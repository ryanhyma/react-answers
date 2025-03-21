import mongoose from 'mongoose';
import { Question } from '../models/question.js';
import { Interaction } from '../models/interaction.js';
import { Eval } from '../models/eval.js';
import ServerLoggingService from './ServerLoggingService.js';
import cosineSimilarity from 'compute-cosine-similarity';
import dbConnect from '../api/db/db-connect.js';

class EvaluationService {
    // Use compute-cosine-similarity package
    calculateCosineSimilarity(vector1, vector2) {
        if (!vector1 || !vector2 || vector1.length !== vector2.length) {
            return 0;
        }

        try {
            return cosineSimilarity(vector1, vector2);
        } catch (error) {
            ServerLoggingService.error('Error calculating cosine similarity', null, error);
            return 0;
        }
    }

    // Calculate sentence-level similarity between two answers using their sentence embeddings
    calculateSentenceSimilarity(embeddings1, embeddings2) {
        if (!Array.isArray(embeddings1) || !Array.isArray(embeddings2) || 
            embeddings1.length === 0 || embeddings2.length === 0) {
            return 0;
        }

        // Create similarity matrix using cosine similarity between sentence embeddings
        const similarityMatrix = embeddings1.map(embedding1 =>
            embeddings2.map(embedding2 => this.calculateCosineSimilarity(embedding1, embedding2))
        );

        // Calculate average of best matches for each sentence
        const bestMatches = similarityMatrix.map(row =>
            Math.max(...row)
        );

        return bestMatches.reduce((a, b) => a + b, 0) / bestMatches.length;
    }

    // Find similar questions and check for existing expert feedback
    async findSimilarQuestionsWithFeedback(questionEmbedding, similarityThreshold = 0.85, chatId) {
        await dbConnect();
        if (!questionEmbedding || !questionEmbedding.length) {
            ServerLoggingService.warn('No question embedding provided for similarity search', chatId);
            return [];
        }

        try {
            const batchSize = 100;
            let lastId = null;
            let allSimilarQuestions = [];
            let hasMore = true;

            // Process in batches of 100 until we have no more records
            while (hasMore) {
                // Find questions that have embeddings and expert feedback
                const questionsWithFeedback = await Question.aggregate([
                    {
                        $match: {
                            embedding: { $exists: true, $ne: null },
                            ...(lastId ? { _id: { $gt: lastId } } : {})
                        }
                    },
                    {
                        $lookup: {
                            from: 'interactions',
                            localField: '_id',
                            foreignField: 'question',
                            as: 'interactions'
                        }
                    },
                    {
                        $match: {
                            'interactions.expertFeedback': { $exists: true, $ne: null }
                        }
                    },
                    {
                        $limit: batchSize
                    }
                ]).exec();

                if (questionsWithFeedback.length === 0) {
                    hasMore = false;
                    continue;
                }

                // Update lastId for next iteration
                lastId = questionsWithFeedback[questionsWithFeedback.length - 1]._id;

                // Calculate similarity scores for this batch
                const batchSimilarQuestions = questionsWithFeedback
                    .map(question => ({
                        question,
                        similarity: this.calculateCosineSimilarity(questionEmbedding, question.embedding)
                    }))
                    .filter(item => item.similarity >= similarityThreshold);

                allSimilarQuestions = allSimilarQuestions.concat(batchSimilarQuestions);

                // If we got less than batchSize, we've reached the end
                if (questionsWithFeedback.length < batchSize) {
                    hasMore = false;
                }
            }

            // Sort all similar questions by similarity
            allSimilarQuestions.sort((a, b) => b.similarity - a.similarity);

            if (allSimilarQuestions.length === 0) {
                ServerLoggingService.info('No similar questions found above threshold', chatId);
                return [];
            }

            ServerLoggingService.debug(`Found ${allSimilarQuestions.length} similar questions above threshold`, chatId, {
                topSimilarity: allSimilarQuestions[0].similarity
            });

            // Get the expert feedback details
            return allSimilarQuestions.map(sq => {
                const interaction = sq.question.interactions.find(i => i.expertFeedback);
                return {
                    similarity: sq.similarity,
                    question: sq.question,
                    interaction,
                    expertFeedback: interaction.expertFeedback
                };
            });

        } catch (error) {
            ServerLoggingService.error('Error finding similar questions with feedback', chatId, error);
            return [];
        }
    }

    // Main method to evaluate an interaction and create eval entry if similar content found
    async evaluateInteraction(interaction, chatId) {
        await dbConnect();
        try {
            // Ensure we have a valid interaction with a question
            if (!interaction || !interaction.question) {
                ServerLoggingService.warn('Invalid interaction or missing question', chatId);
                return null;
            }

            // Check if evaluation already exists for this interaction
            const existingEval = await Eval.findOne({ interaction: interaction._id });
            if (existingEval) {
                ServerLoggingService.info('Evaluation already exists for interaction', chatId);
                return existingEval;
            }

            // Get the full question object with embedding
            const question = await Question.findById(interaction.question);
            if (!question || !question.embedding || !question.embedding.length) {
                ServerLoggingService.warn('Question not found or missing embedding', chatId);
                return null;
            }

            // Find similar questions with expert feedback
            const similarResults = await this.findSimilarQuestionsWithFeedback(
                question.embedding,
                0.85, // similarity threshold
                chatId
            );

            if (!similarResults.length) {
                ServerLoggingService.info('No similar questions with expert feedback found', chatId);
                return null;
            }

            // If we have an answer, check both overall and sentence-level similarity
            let bestMatch = null;
            if (interaction.answer) {
                // Get the answer from the current interaction
                const currentAnswer = await mongoose.model('Answer').findById(interaction.answer);

                if (currentAnswer) {
                    ServerLoggingService.debug('Processing answer similarities', chatId);

                    // For each similar question, compare the answers
                    for (const result of similarResults) {
                        if (!result.interaction.answer) continue;

                        const compareAnswer = await mongoose.model('Answer').findById(result.interaction.answer);

                        if (compareAnswer) {
                            // Compare answers using cosine similarity if embeddings exist
                            let answerSimilarity = 0;
                            let sentenceSimilarity = 0;

                            if (currentAnswer.embedding && compareAnswer.embedding) {
                                answerSimilarity = this.calculateCosineSimilarity(
                                    currentAnswer.embedding,
                                    compareAnswer.embedding
                                );
                            }

                            // Calculate sentence-level similarity using precalculated sentence embeddings
                            if (currentAnswer.sentenceEmbeddings?.length && compareAnswer.sentenceEmbeddings?.length) {
                                sentenceSimilarity = this.calculateSentenceSimilarity(
                                    currentAnswer.sentenceEmbeddings,
                                    compareAnswer.sentenceEmbeddings
                                );
                            }

                            // Combined similarity score - weigh both vector and sentence similarity
                            const combinedSimilarity = (answerSimilarity * 0.6) + (sentenceSimilarity * 0.4);

                            // If combined similarity is high enough
                            if (combinedSimilarity > 0.7) {
                                // If this is a better match than what we've found so far
                                if (!bestMatch || combinedSimilarity > bestMatch.combinedSimilarity) {
                                    bestMatch = {
                                        ...result,
                                        answerSimilarity,
                                        sentenceSimilarity,
                                        combinedSimilarity
                                    };
                                }
                            }
                        }
                    }
                }
            }

            // If we found a good match, create an Eval entry
            if (bestMatch) {
                // Create new Eval entry with the expert feedback and similarity scores
                const newEval = new Eval({
                    interaction: interaction._id,
                    expertFeedback: bestMatch.expertFeedback._id,
                    similarityScore: bestMatch.similarity,
                    answerSimilarity: bestMatch.answerSimilarity || 0,
                    sentenceSimilarity: bestMatch.sentenceSimilarity || 0,
                    combinedSimilarity: bestMatch.combinedSimilarity || 0
                });

                const savedEval = await newEval.save();

                // Update the interaction with the new evaluation reference
                await Interaction.findByIdAndUpdate(
                    interaction._id, 
                    { aiEval: savedEval._id },
                    { new: true }
                );

                ServerLoggingService.info('Created evaluation and updated interaction reference', chatId, {
                    evaluationId: savedEval._id,
                    interactionId: interaction._id,
                    similarityScores: {
                        question: bestMatch.similarity,
                        answer: bestMatch.answerSimilarity,
                        sentence: bestMatch.sentenceSimilarity,
                        combined: bestMatch.combinedSimilarity
                    }
                });

                return savedEval;
            }

            return null;
        } catch (error) {
            ServerLoggingService.error('Error during interaction evaluation', chatId, error);
            return null;
        }
    }

    // Process multiple interactions in a batch
    async batchEvaluateInteractions(limit = 50, skipExisting = true) {
        await dbConnect();
        try {
            // Find interactions that have both question and answer
            const query = {
                question: { $exists: true, $ne: null },
                answer: { $exists: true, $ne: null }
            };

            // If skipExisting is true, exclude interactions that already have evaluations
            if (skipExisting) {
                query.aiEval = { $exists: false };
            }

            // Find interactions to evaluate
            const interactions = await Interaction.find(query).limit(limit);

            ServerLoggingService.info(`Starting batch evaluation of ${interactions.length} interactions`, 'system', {
                limit,
                skipExisting
            });

            // Process each interaction
            const results = [];
            for (const interaction of interactions) {
                const result = await this.evaluateInteraction(interaction, interaction._id.toString());
                if (result) {
                    results.push({
                        interactionId: interaction._id,
                        result
                    });
                }
            }

            ServerLoggingService.info('Batch evaluation completed', 'system', {
                processed: interactions.length,
                successful: results.length
            });

            return {
                processed: interactions.length,
                successful: results.length,
                results
            };
        } catch (error) {
            ServerLoggingService.error('Error in batch evaluation', 'system', error);
            return {
                processed: 0,
                successful: 0,
                error: error.message
            };
        }
    }

    // Check if an interaction already has an evaluation
    async hasExistingEvaluation(interactionId) {
        await dbConnect();
        try {
            const interaction = await Interaction.findById(interactionId).populate('aiEval');
            ServerLoggingService.debug(`Checked for existing evaluation`, interactionId.toString(), {
                exists: !!interaction?.aiEval
            });
            return !!interaction?.aiEval;
        } catch (error) {
            ServerLoggingService.error('Error checking for existing evaluation', interactionId.toString(), error);
            return false;
        }
    }

    // Get evaluation for a specific interaction
    async getEvaluationForInteraction(interactionId) {
        await dbConnect();
        try {
            const interaction = await Interaction.findById(interactionId).populate('aiEval');
            const evaluation = interaction?.aiEval;

            if (evaluation) {
                ServerLoggingService.debug('Retrieved evaluation', interactionId.toString(), {
                    evaluationId: evaluation._id
                });
            } else {
                ServerLoggingService.debug('No evaluation found', interactionId.toString());
            }

            return evaluation;
        } catch (error) {
            ServerLoggingService.error('Error retrieving evaluation', interactionId.toString(), error);
            return null;
        }
    }
}

export default new EvaluationService();