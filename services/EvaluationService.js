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

    async validateInteractionAndCheckExisting(interaction, chatId) {
        if (!interaction || !interaction.question) {
            ServerLoggingService.warn('Invalid interaction or missing question', chatId);
            return null;
        }

        const existingEval = await Eval.findOne({ interaction: interaction._id });
        if (existingEval) {
            ServerLoggingService.info('Evaluation already exists for interaction', chatId);
            return existingEval;
        }

        return true;
    }

    async getQuestionWithEmbedding(interaction, chatId) {
        const question = await Question.findById(interaction.question);
        if (!question || !question.embedding || !question.embedding.length) {
            ServerLoggingService.warn('Question not found or missing embedding', chatId);
            return null;
        }
        return question;
    }

    async compareAnswers(currentAnswer, compareAnswer) {
        if (!currentAnswer || !compareAnswer) return null;

        let answerSimilarity = 0;
        let sentenceSimilarity = 0;
        let sentenceMatches = [];

        if (currentAnswer.embedding && compareAnswer.embedding) {
            answerSimilarity = this.calculateCosineSimilarity(
                currentAnswer.embedding,
                compareAnswer.embedding
            );
        }

        if (currentAnswer.sentenceEmbeddings?.length && compareAnswer.sentenceEmbeddings?.length) {
            const similarityMatrix = currentAnswer.sentenceEmbeddings.map(embedding1 =>
                compareAnswer.sentenceEmbeddings.map(embedding2 => 
                    this.calculateCosineSimilarity(embedding1, embedding2)
                )
            );

            const maxSentences = Math.min(4, currentAnswer.sentenceEmbeddings.length);
            let usedTargetIndices = new Set();

            for (let i = 0; i < maxSentences; i++) {
                let bestSimilarity = 0;
                let bestTargetIndex = -1;

                similarityMatrix[i].forEach((similarity, targetIdx) => {
                    if (!usedTargetIndices.has(targetIdx) && similarity > bestSimilarity) {
                        bestSimilarity = similarity;
                        bestTargetIndex = targetIdx;
                    }
                });

                if (bestTargetIndex !== -1) {
                    sentenceMatches.push({
                        sentenceIndex: i + 1,
                        similarity: bestSimilarity
                    });
                    usedTargetIndices.add(bestTargetIndex);
                }
            }

            sentenceSimilarity = sentenceMatches.reduce((sum, match) => 
                sum + match.similarity, 0) / sentenceMatches.length;
        }

        const combinedSimilarity = (answerSimilarity * 0.6) + (sentenceSimilarity * 0.4);

        return {
            answerSimilarity,
            sentenceSimilarity,
            sentenceMatches,
            combinedSimilarity
        };
    }

    async createEvaluation(interaction, bestMatch, chatId) {
        const newExpertFeedback = new ExpertFeedback({
            totalScore: bestMatch.expertFeedback.totalScore,
            citationScore: bestMatch.expertFeedback.citationScore,
            citationExplanation: bestMatch.expertFeedback.citationExplanation,
            answerImprovement: bestMatch.expertFeedback.answerImprovement,
            expertCitationUrl: bestMatch.expertFeedback.expertCitationUrl,
            feedback: bestMatch.expertFeedback.feedback
        });

        bestMatch.sentenceMatches
            .sort((a, b) => a.sentenceIndex - b.sentenceIndex)
            .forEach((match, idx) => {
                const feedbackIdx = match.sentenceIndex;
                const targetIdx = idx + 1;

                newExpertFeedback[`sentence${targetIdx}Score`] = 
                    bestMatch.expertFeedback[`sentence${feedbackIdx}Score`] || -1;
                newExpertFeedback[`sentence${targetIdx}Explanation`] = 
                    bestMatch.expertFeedback[`sentence${feedbackIdx}Explanation`] || '';
                newExpertFeedback[`sentence${targetIdx}Harmful`] = 
                    bestMatch.expertFeedback[`sentence${feedbackIdx}Harmful`] || false;
            });

        const savedFeedback = await newExpertFeedback.save();

        const newEval = new Eval({
            interaction: interaction._id,
            expertFeedback: savedFeedback._id,
            similarityScore: bestMatch.similarity,
            answerSimilarity: bestMatch.answerSimilarity || 0,
            sentenceSimilarity: bestMatch.sentenceSimilarity || 0,
            combinedSimilarity: bestMatch.combinedSimilarity || 0,
            sentenceMatches: bestMatch.sentenceMatches.map((match, idx) => ({
                sourceIndex: match.sentenceIndex - 1,
                mappedFeedbackIndex: idx + 1,
                similarity: match.similarity,
                score: bestMatch.expertFeedback[`sentence${match.sentenceIndex}Score`] || -1
            })).sort((a, b) => b.similarity - a.similarity)
        });

        const savedEval = await newEval.save();

        await Interaction.findByIdAndUpdate(
            interaction._id,
            { aiEval: savedEval._id },
            { new: true }
        );

        ServerLoggingService.info('Created evaluation with rearranged feedback', chatId, {
            evaluationId: savedEval._id,
            feedbackId: savedFeedback._id,
            interactionId: interaction._id,
            similarityScores: {
                question: bestMatch.similarity,
                answer: bestMatch.answerSimilarity,
                sentence: bestMatch.sentenceSimilarity,
                combined: bestMatch.combinedSimilarity
            },
            sentenceMatches: savedEval.sentenceMatches
        });

        return savedEval;
    }

    async evaluateInteraction(interaction, chatId) {
        await dbConnect();
        try {
            const validationResult = await this.validateInteractionAndCheckExisting(interaction, chatId);
            if (validationResult !== true) {
                return validationResult; // Returns null or existing eval
            }

            const question = await this.getQuestionWithEmbedding(interaction, chatId);
            if (!question) return null;

            const similarResults = await this.findSimilarQuestionsWithFeedback(
                question.embedding,
                0.85,
                chatId
            );

            if (!similarResults.length) {
                ServerLoggingService.info('No similar questions with expert feedback found', chatId);
                return null;
            }

            let bestMatch = null;
            if (interaction.answer) {
                const currentAnswer = await mongoose.model('Answer').findById(interaction.answer);

                if (currentAnswer) {
                    ServerLoggingService.debug('Processing answer similarities', chatId);

                    for (const result of similarResults) {
                        if (!result.interaction.answer) continue;

                        const compareAnswer = await mongoose.model('Answer').findById(result.interaction.answer);
                        if (!compareAnswer) continue;

                        const comparison = await this.compareAnswers(currentAnswer, compareAnswer);
                        if (comparison && comparison.combinedSimilarity > 0.7 && comparison.sentenceMatches.length > 0) {
                            if (!bestMatch || comparison.combinedSimilarity > bestMatch.combinedSimilarity) {
                                bestMatch = {
                                    ...result,
                                    ...comparison
                                };
                            }
                        }
                    }
                }
            }

            if (bestMatch) {
                return await this.createEvaluation(interaction, bestMatch, chatId);
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