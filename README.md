# React app for learning and ux research for gen AI applications

A React-based AI chat application that provides answers designed and sourced exclusively from and for Government of Canada websites. Built to assist users navigating Canada.ca and other government services.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Status - proof of concept prototype - deployed on Vercel - contact me for link - this is a proof of concept prototype for research purposes only
- Back-end database to store user questions and answers and expert feedback
- Evaluation input of csv files generated from user feedback questions to score AI responses
- Can choose either Claude or OpenAI 4o API AI service
- System prompt includes menu structure, updated CRA account context, and specific instructions for top task examples 

## Uses GC Design system (but not fully integrated)
-  https://design-system.alpha.canada.ca/

## 🌟 Key Features

### Tuned for Canada.ca user needs 
- ai response is tagged so sentences in answer can be displayed in accessible canada.ca format and citation urls can be displayed in a single url for next step of task with clickable link available for clickthrough rate measurement
- system prompt forces short answers of a maximum of 4 sentences to improve clarity, use plain language, and reduce risk of hallucinations
- scenarios address top user questions on canada.ca 
- takes advantage of canada.ca interaction patterns and support - e.g. if a wizard is already in place, direct the user to answer those questions rather than attempting to walk them through the process in the ai service. AI services aren't optimized for question logic and aren't effective for that purpose.  
- evaluation system and logging for continuous improvement as models evolve and both users and teams experiment with the ai application
- TODO - use referral url to track where the user came from and use that information to improve the response - already is used for context in system prompt
- TODO - someday could use model as a judge to determine context and apply specific context to system prompt to improve response quality

### Official languages support
- Bilingual system prompts (English/French) - loads based on selected language to improve response quality and reduce input token load
- Language selector available in evaluation process
- loads Canada.caFrench menu structure and navigation options
- Full French version of application with official translation
- All text displayed to users in JSON language files for easy updates and translations -  view the [fr.json file](src/locales/fr.json).

### Multi-model design is independent of AI service provider
- Multiple AI service providers enables testing and exploration of strengths and weaknesses of different models
- Anthropic Claude Sonnet 3.5 and OpenAI GPT-4o are currently supported - Cohere is next on roadmap - should explore Mistral to see if it performs better for French - all of these models are available through [Amazon Bedrock](https://aws.amazon.com/bedrock/?sec=aiapps&pos=2)
- Failover to other AI service if one fails
- Prompt caching implemented to improve response quality and speed
  - Claude: Using `anthropic-beta: prompt-caching-2024-07-31`
  - GPT: Automatic caching
- Confidence rating system
- Temperature set to 0.5 for more deterministic responses for both models, but still allows for some variation to improve response quality
- Conversation history management - pass conversation history to AI service for context 
- Enhanced citation handling - 404 errors for canada.ca urls are replaced by link to canada.ca search page
- System prompts optimized for 2024 model compatibility

### Evaluation-driven design to achieve 100% answer accuracy
- Evaluation system to score AI responses and provide feedback for continuous improvement
- Evaluation input of csv files generated from user feedback questions to score AI responses
- Good source of learning about this methodology is: https://www.ycombinator.com/library/Lg-why-vertical-llm-agents-are-the-new-1-billion-saas-opportunities


### Privacy Protection
- PII (Personally Identifiable Information) safeguards:
  - Basic redaction for name patterns in English and French - TODO apply better algorithm from [feedback tool](https://github.com/alpha-canada-ca/feedback-viewer/blob/master/src/main/java/ca/gc/tbs/service/ContentService.java)
  - Pattern detection for unformatted numbers like phone numbers account numbers, addresses 
  - Anonymous data storage
- Conversation history management with privacy controls

### Guardrails for security
- Profanity and threat word filtering - displays warning to user and doesn't log or send to AI service
- Character limit (750) to prevent prompt injection
- Rate limiting: 3 questions per session
- threat filtering in system prompt to prevent use of languages other than English or French - TODO - improve this
- Ideas here: https://www.guardrailsai.com/ and https://github.com/guardrails-ai/guardrails


### Data Management
- MongoDB Atlas Cloud integration
- Structured database schema for conversations
- External database entry viewer
- CSV/JSON export capabilities for:
  - User feedback
  - Evaluation data
  - Tagged response sentences

### User Interface
- GCDS (Government of Canada Design System) compliance
- Feedback collection system
  - Feedback suppression for clarifying questions
  - Structured response collection
- User survey integration via Qualtrics
- AI service selector
- Referring URL tracking
- Expandable options menu

### Content Integration
- Dynamic menu structure from Canada.ca
- Specialized content for:
  - Passport services (EN/FR)
  - IRCC scenarios
  - CRA account services
  - Government employment information
- TODO - add more scenarios per theme or topic or department that are selectively loaded based on user question 
- TODO - add more canada.ca urls to the system prompt to load selectively to improve response quality in French - for example https://www.canada.ca/fr/agence-revenu.sitemap.xml with https://www.canada.ca/en/revenue-agency.sitemap.xml or even better, have the topic tree per theme

### Citation urls - single citaton url for next step of task
- Extensive citation instructions to reduce hallucinations and improve accuracy
- Citation link validation (404 checking)
- URL validation and sanitization
- TODO - replace with search function

## 🚀 Deployment

### Development
- Local development using Create React App
- Environment variables prefixed with `REACT_APP_`
- GitHub Desktop for version control

### Production
- Deployed on Vercel
- MongoDB Atlas for database
- Environment variables configured without `REACT_APP_` prefix

## 📈 Evaluation & Testing
- UserFeel study implementation (4 participants)
- Evaluation process improvements:
  - Feedback file import capability
  - Response parsing optimization
  - Structured CSV/JSON output

## 🛠️ Technical Notes
- System prompt separation for better maintenance
- Menu structure automation improvements needed
- Automated testing implementation ongoing

## 📝 Contributing
Please refer to our contributing guidelines and code of conduct for details on how to participate in this project.

## Backlog
- How to prevent old stuff like transparency, archived, corporate reports, audits etc from being used for answers and citations unless user asks about it specifically


## Localization

For more details on the French translations used in the application, you can view the [fr.json file](src/locales/fr.json).

