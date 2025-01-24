import { getApiUrl } from '../utils/apiToUrl.js';

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
    processMessage: async (userMessage, onStatusUpdate, lang, department, referringUrl) => {
        console.log("Starting pipeline with data:", data);
        onStatusUpdate(PipelineStatus.REDACTING);
        processRedaction(userMessage, onStatusUpdate);

        onStatusUpdate(PipelineStatus.GETTING_CONTEXT);
        const derivedContext = await ContextService.deriveContext(selectedAI, userMessage, lang, department, referringUrl);
        console.log("Derived context:", derivedContext);
        onStatusUpdate(PipelineStatus.GENERATING_ANSWER);
        const response = await MessageService.sendMessage(selectedAI, userMessage, conversationHistory, lang, context, referringUrl);
        console.log("Answer Received:", derivedContext);

        onStatusUpdate(PipelineStatus.VERIFYING_CITATION);
        await verifyCitation(response.originalCitationUrl, lang, redactedText, selectedDepartment, t);
        console.log("Citation validated:");

        onStatusUpdate(PipelineStatus.UPDATING_DATASTORE);
        // Log the interaction with the validated URL
        DataService.persistInteraction(selectedAI, redactedText, referringUrl,
            response,
            finalCitationUrl,
            originalCitationUrl,
            confidenceRating,
            null,  // feedback
            null   // expertFeedback
        );



    },
    verifyCitation: async (originalCitationUrl, lang, redactedText, selectedDepartment, t) => {
        let finalCitationUrl, confidenceRating;
        if (originalCitationUrl) {
            const validationResult = await urlToSearch.validateAndCheckUrl(
                originalCitationUrl,
                lang,
                redactedText,
                selectedDepartment,
                t
            );

            console.log(`✅ Validated URL:`, validationResult);
        }
    },
    processRedaction: (userMessage, onStatusUpdate) => {
        onStatusUpdate(PipelineStatus.REDACTING);
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

