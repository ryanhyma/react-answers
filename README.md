# React app for learning and ux research for gen AI applications

A React-based AI chat application that provides answers designed and sourced exclusively from and for Government of Canada websites. Built to assist users navigating Canada.ca and other government services.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Status - proof of concept prototype - deployed on Vercel - contact me for link 
- this is a proof of concept prototype for research purposes only
- Back-end MongoDB database to store user questions and answers and expert feedback
- Evaluation input of csv files generated from user feedback questions to score AI responses
- Can choose either Claude Sonnet 3.5, 🇨🇦 Cohere command-r-plus-08-2024 (not yet on production), or OpenAI GPT-4o API AI service
- System prompt includes menu structure, updated CRA account context, and specific instructions for top task examples 

## Uses GC Design system (but not fully integrated) - couldn't get inputs to work for url field, radio buttons or checkboxes
-  https://design-system.alpha.canada.ca/

## 🌟 Key Features

### Tuned for Canada.ca user needs 
- ai response is tagged so sentences in answer can be displayed in accessible canada.ca format and citation urls can be displayed in a single url for next step of task with clickable link available for clickthrough rate measurement
- system prompt forces short answers of a maximum of 4 sentences to improve clarity, use plain language, and reduce risk of hallucinations
- scenarios address top user questions on canada.ca 
- takes advantage of canada.ca interaction patterns and support - e.g. if a wizard is already in place, direct the user to answer those questions rather than attempting to walk them through the process in the ai service. AI services aren't optimized for question logic and aren't effective for that purpose.  
- evaluation system and logging for continuous improvement as models evolve and both users and teams experiment with the ai application

### Official languages support
- Bilingual system prompts (English/French) - loads based on selected language to improve response quality and reduce input token load
- Language selector available in evaluation process
- loads Canada.ca French menu structure and navigation options
- Full French version of application with official translation
- All text displayed to users in JSON language files for easy updates and translations -  view the [fr.json file](src/locales/fr.json).

### Multi-model design - independent of AI service provider
- Multiple AI service providers enables testing and exploration of strengths and weaknesses of different models
- Anthropic Claude Sonnet  and OpenAI GPT are currently supported - Cohere is in progress - should explore Mistral to see if it performs better for French - all of these models are available through [Amazon Bedrock](https://aws.amazon.com/bedrock/?sec=aiapps&pos=2)
- Failover to other AI service if one fails
- Prompt caching implemented to improve response quality and speed
  - Claude: Using `anthropic-beta: prompt-caching-2024-07-31`
  - GPT: Automatic caching
- Confidence rating system for citation urls 
- Temperature set to 0.5 for more deterministic responses for both models, but still allows for some variation to improve response quality
- Conversation history management - pass conversation history to AI service for context in 'message' field
- Enhanced citation handling - 404 errors for canada.ca urls are replaced by link to canada.ca search page
- System prompts optimized for 2024 model compatibility

### Evaluation-driven design to eventually achieve 100% answer accuracy
- Evaluation system to score AI responses and provide feedback for continuous improvement
- Evaluation input of csv files generated from user feedback questions to score AI responses
- Good source of learning about this methodology is: https://www.ycombinator.com/library/Lg-why-vertical-llm-agents-are-the-new-1-billion-saas-opportunities

### Accessibility features
- GCDS components - TODO should the input field have focus when page loads? TODO: some components couldn't get inputs to work so are temporarily replaced with plain html
- No streaming of responses - response is formatted and complete before it is displayed
- Get ideas from this accessibility AI application: https://adf-ask-accessibility-daeeafembaazdzfk.z01.azurefd.net/

### Microservices prompt-chaining architecture
- TODO - implement microservices prompt-chaining architecture to improve response quality and speed [see diagram](#microservices-prompt-chaining-architecture-diagram)
References: 
* https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/chain-prompt
* https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-5-multi-agent-collaboration/

#### 1. Context service 
The context service would select the question topic/dept area using EITHER the referral URL - e.g. the page the user triggered the AI from - OR an AI model as a judge system. 
- Risk of using referral url is that it may not be accurate (e.g. they're on the CRA account page but they asked about EI claims) or relevant to the question (e.g. they're on the CRA account page but they asked about IRCC passport services).
-Model as a judge uses a small light AI model to evaluate the question to determine the topic area of the question. Then that microservice would pass the topic to the answer service.
-Input: Menu structure without urls and list of departments/agencies from department page
Output: topic or department context

#### 2. Answer service
Input: base system prompt, plus topic or department context name from context service to load the context files for that topic/dept, including top task scenarios, confusions, and examples. Uses selected AI service.
Output: answer

#### 3. AI service manager
Manage API keys, endpoints and batches for each AI service

#### 4. Citation service
Input: context from context service, question, and answer from answer service
-Feed input to AI with base systemp prompt citation selection criteria, and use context to load hierarchical sitemap, or menu structure and any update files. 
Or use search api and select first search result url as citation

Output: single citation url 
- Extensive citation instructions to reduce hallucinations and improve accuracy
- Citation link validation (404 checking)
- URL validation and sanitization
- TODO - replace with search function

#### 5. Database service
Log all interactions to database - eventually need department filter? 
Input: referring url (if provided), TODO: add context from context service, userquestion, answer, AI service selected TODO: addAI service used,citation-original and citation-used (from citation service), user-feedback items, confidence ratings for citation url, TODO:add token counts, TODO: add evaluation data?
Output:logs and evaluation data?

#### 6. Evaluation service
Input: questions and correct citation and answers from evaluation  file
Output: answers and citations from current system and selected model and model version - send to scoring AI service 
References: https://platform.openai.com/docs/guides/evals and https://github.com/anthropics/evals

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
- TODO - add more scenarios per context (theme or topic or department) that are selectively loaded based on user question 
- TODO - add more canada.ca urls to the menu structure to load selectively to improve response quality in French - for example https://www.canada.ca/fr/agence-revenu.sitemap.xml with https://www.canada.ca/en/revenue-agency.sitemap.xml or even better, have the topic tree per theme


### Development
- Local development using Create React App
- Environment variables prefixed with `REACT_APP_` for local development
- GitHub repo for version control 

### Production
- Deployed on Vercel
- Environment variables configured without `REACT_APP_` prefix and stored in Vercel environment variables
- MongoDB Atlas for database - only writes to database from production
- deploys to Vercel from Github (any change to main triggers deploy)

## 📈 Evaluation & Testing
- UserFeel study 1 - October 2024 (4 participants) - participants solve 
- UserFeel study 2 - November 2024 (8 participants)
- Evaluation process improvements:
  - Feedback file import capability
  - Response parsing optimization
  - Structured CSV/JSON output

## 📝 Contributing
TODO:contributing guidelines and code of conduct for details on how to participate in this project.


## Microservices prompt-chaining architecture diagram {#architecture-diagram}

```mermaid
flowchart TB
    User(["User/Browser"])
    Context["**Context Service**<br>- Topic/Dept Detection<br>- Referral URL Analysis"]
    Answer["**Answer Service**<br>- Question Processing<br>- AI Response Generation"]
    AIManager["**AI Service Manager**<br>- API Key Management<br>- Service Selection<br>- Load Balancing"]
    Citation["**Citation Service**<br>- URL Validation<br>- Link Generation<br>- 404 Handling"]
    DB["**Database Service**<br>- MongoDB Atlas<br>- Logging<br>- Data Export"]
    Eval["**Evaluation Service**<br>- Response Scoring<br>- Quality Metrics<br>- Performance Analysis"]

    User -->|Question| Context
    Context -->|Topic/Context| Answer
    Answer -->|Service Request| AIManager
    AIManager -->|AI Response| Answer
    Answer -->|Response Text| Citation
    Citation -->|Validated URL| Answer
    
    Answer -->|Interaction Data| DB
    Citation -->|URL Data| DB
    Context -->|Context Data| DB
    
    DB -->|Historical Data| Eval
    Answer -->|Response Quality| Eval
    Citation -->|URL Accuracy| Eval
    
    subgraph AI_Providers
        Claude["Claude"]
        GPT["OpenAI"]
        Cohere["Cohere"]
    end
    
    AIManager -->|API Calls| AI_Providers
```

