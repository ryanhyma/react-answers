# React app for learning and ux research for gen AI applications

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Status - runs locally only
- Next on to-do list: add back-end to protect personal API keys
- Move to a GC repo eventually so can be hosted 

## To do list
- Add back-end to protect personal API keys
- Currently only uses Anthropic Claude API service - add a version to use OpenAI 4o
- Will same system prompt work with both? 
- System prompt needs more tuning in console as responses are too verbose despite prompt requiring max of 4 sentences
- Need to style AI responses (currently a block of text) and user questions 

## Current AI service
- the /services/ClaudeService.js file contains the system prompt 

## Uses GC Design system 
- install and import components into the app.js main page, and the chat container  (import utilities into index.html) https://design-system.alpha.canada.ca/

