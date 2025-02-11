import ContextService from './ContextService.js';
import AnswerService from './AnswerService.js';
import { DataStoreService } from './DataStoreService.js';
import { urlToSearch } from '../utils/urlToSearch.js';
import RedactionService from './RedactionService.js';

export const PipelineStatus = {
    REDACTING: 'redacting',
    MODERATING_QUESTION: 'moderatingQuestion',
    SEARCHING: 'searching',
    GETTING_CONTEXT: 'gettingContext',
    GENERATING_ANSWER: 'generatingAnswer',
    COMPLETE: 'complete',
    VERIFYING_CITATION: 'verifyingCitation',
    UPDATING_DATASTORE: 'updatingDatastore',
    MODERATING_ANSWER: 'moderatingAnswer',
    ERROR: 'error',
    NEED_CLARIFICATION: 'needClarification'
};
export const ChatPipelineService = {

    processResponse: async (chatId, userMessage, userMessageId, conversationHistory, lang, department, referringUrl, selectedAI, translationF, onStatusUpdate, searchProvider) => {
        const startTime = Date.now();
        await ChatPipelineService.updateStatusWithDelay(PipelineStatus.MODERATING_QUESTION, onStatusUpdate);

        console.log("➡️ Starting pipeline with data:", userMessage, lang, department, referringUrl, conversationHistory, selectedAI);
        await ChatPipelineService.updateStatusWithDelay(PipelineStatus.REDACTING, onStatusUpdate);
        ChatPipelineService.processRedaction(userMessage);

        let context = null;
        // remove error messages
        conversationHistory = conversationHistory.filter(message => !message.error);
        conversationHistory = conversationHistory.filter(message => message.sender === 'ai');
        if (conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1].interaction.answer.answerType !== 'question') {
            const lastMessage = conversationHistory[conversationHistory.length - 1];
            context = lastMessage.interaction.context;
        } else {
            // if initial questions or last response type was a questions
            await ChatPipelineService.updateStatusWithDelay(PipelineStatus.GETTING_CONTEXT, onStatusUpdate);
            // TODO conversation history
            context = await ContextService.deriveContext(selectedAI, userMessage, lang, department, referringUrl, searchProvider);
        }
        console.log("➡️ Derived context:", context);

        await ChatPipelineService.updateStatusWithDelay(PipelineStatus.GENERATING_ANSWER, onStatusUpdate);

        // TOOD check about evaluation
        const answer = await AnswerService.sendMessage(selectedAI, userMessage, conversationHistory, lang, context, false, referringUrl);
        console.log("➡️ Answer Received:", answer);
        let finalCitationUrl, confidenceRating = null;
        if (answer.answerType === 'normal') {
            await ChatPipelineService.updateStatusWithDelay(PipelineStatus.VERIFYING_CITATION, onStatusUpdate);
            const citationResult = await ChatPipelineService.verifyCitation(answer.citationUrl, lang, userMessage, department, translationF);
            finalCitationUrl = citationResult.url;
            confidenceRating = citationResult.confidenceRating;
            console.log("➡️ Citation validated:", { finalCitationUrl, confidenceRating });
        }

        if (answer.answerType === 'question') {
            await ChatPipelineService.updateStatusWithDelay(PipelineStatus.NEED_CLARIFICATION, onStatusUpdate);
        }

        await ChatPipelineService.updateStatusWithDelay(PipelineStatus.UPDATING_DATASTORE, onStatusUpdate);

        const endTime = Date.now();
        const totalResponseTime = endTime - startTime;
        console.log("➡️ Total response time:", totalResponseTime, "ms");
        // Log the interaction with the validated URL
        await DataStoreService.persistInteraction(
            selectedAI,
            userMessage,
            userMessageId,
            referringUrl,
            answer,
            finalCitationUrl,
            confidenceRating,
            context,
            chatId,
            lang,
            totalResponseTime,
            searchProvider
        );

        await ChatPipelineService.updateStatusWithDelay(PipelineStatus.MODERATING_ANSWER, onStatusUpdate);
        console.log("➡️ pipeline complete");
        return {
            answer: answer,
            context: context,
            question: userMessage,
            citationUrl: finalCitationUrl,
            confidenceRating: confidenceRating
        };



    },
    updateStatusWithDelay: async (status, onStatusUpdate) => {
        return new Promise(resolve => {
            setTimeout(() => {
                onStatusUpdate(status);
                resolve();
            }, 1);
        });
    },
    verifyCitation: async (originalCitationUrl, lang, redactedText, selectedDepartment, t) => {

        if (originalCitationUrl) {
            const validationResult = await urlToSearch.validateAndCheckUrl(
                originalCitationUrl,
                lang,
                redactedText,
                selectedDepartment,
                t
            );
            console.log(`✅ Validated URL:`, validationResult);
            return validationResult;

        }
        return { url: null, confidenceRating: null };
    },
    processRedaction: (userMessage) => {

        const { redactedText, redactedItems } = RedactionService.redactText(userMessage);

        // Check for blocked content (# for profanity/threats/manipulation, XXX for private info)
        const hasBlockedContent = redactedText.includes('#') || redactedText.includes('XXX');
        if (hasBlockedContent) {
            throw new RedactionError(
                'Blocked content detected',
                redactedText,
                redactedItems
            );
        }
    }
};



export class RedactionError extends Error {
    constructor(message, redactedText, redactedItems) {
        super(message);
        this.name = 'RedactionError';
        this.redactedText = redactedText;
        this.redactedItems = redactedItems;
    }
}

