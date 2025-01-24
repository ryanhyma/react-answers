import { getApiUrl } from '../utils/apiToUrl.js';
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
    MOERATING_ANSWER: 'moderatingAnswer',
    ERROR: 'error'
};
export const ChatPipelineService = {

    processMessage: async (chatId,userMessage, conversationHistory, lang, department, referringUrl, selectedAI, translationF, onStatusUpdate) => {

        console.log("Starting pipeline with data:", userMessage, lang, department, referringUrl);
        onStatusUpdate(PipelineStatus.REDACTING);
        ChatPipelineService.processRedaction(userMessage);

        onStatusUpdate(PipelineStatus.GETTING_CONTEXT);
        const context = await ContextService.deriveContext(selectedAI, userMessage, lang, department, referringUrl);
        console.log("Derived context:", context);
        onStatusUpdate(PipelineStatus.GENERATING_ANSWER);
        // TOOD check about evaluation
        const answer = await AnswerService.sendMessage(selectedAI, userMessage, conversationHistory, lang, context, false, referringUrl);
        console.log("Answer Received:", answer);

        onStatusUpdate(PipelineStatus.VERIFYING_CITATION);
        const { finalCitationUrl, confidenceRating } = await ChatPipelineService.verifyCitation(answer.citationUrl, lang, userMessage, department, translationF);
        console.log("Citation validated:");

        onStatusUpdate(PipelineStatus.UPDATING_DATASTORE);
        // Log the interaction with the validated URL
        DataStoreService.persistInteraction(selectedAI, userMessage, referringUrl,
            answer,
            finalCitationUrl,
            answer.citationUrl,
            confidenceRating,
            context,chatId
        );
        return answer;



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
        return null;
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

