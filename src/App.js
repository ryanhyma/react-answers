/* eslint-disable no-unused-vars */
/* eslint-disable import/no-unused-modules */
import React from 'react';
import TempChatAppContainer from './components/chat/TempChatAppContainer';
import { GcdsHeader, GcdsContainer, GcdsBreadcrumbs, GcdsBreadcrumbsItem, GcdsDetails, GcdsText, GcdsLink, GcdsFooter, GcdsTextarea } from '@cdssnc/gcds-components-react';
import './App.css';

function App() {
  return (
    <>
      <section className="alpha-top">
        <div className="container">
          <small><span className="alpha-label">Beta</span>&nbsp;&nbsp; Experimental page
            testing.</small>
        </div>
      </section>
      <GcdsHeader
        langHref="#"
        skipToHref="#">
        <GcdsBreadcrumbs slot="breadcrumb">
        </GcdsBreadcrumbs>
      </GcdsHeader>

      {/* <main> */}
      <GcdsContainer size="xl" mainContainer centered tag="main" className="mb-600" chat-app-wrapper>
        <h1 className='mb-400'>AI Answers</h1>
        <h2 className='mt-400 mb-400'>Get answers to your Canada.ca questions. </h2>


        <GcdsText className='mb-400'> This proof of concept is for research purposes only.
        </GcdsText>
        <GcdsDetails detailsTitle='About AI Answers' className='mb-400'>
          <GcdsText>Development is still in progress - contact Lisa Fast for information. </GcdsText>
          <GcdsText >To protect your privacy, numbers and addresses will be removed before your question is sent to the AI service.  The removed text will display as <strong>XXX</strong>. </GcdsText>
          <GcdsText>AI service Claude: Anthropic Claude Sonnet 3.5, knowledge to April 2024</GcdsText>
          <GcdsText>AI service ChatGPT: OpenAI 4o,  knowledge to May 2024</GcdsText>
        </GcdsDetails>
        <TempChatAppContainer />
      </GcdsContainer>
      <GcdsContainer size="sm" centered className="mb-600">
        <GcdsDetails detailsTitle='Privacy and AI terms of use' className='mb-400'>
          <GcdsText>
            We may store your questions and answers to improve system performance. Personal information will be deleted and replaced with XXX. Personal information won't be stored.
          </GcdsText>
          <GcdsText>
            Use the Canada.ca link provided in the response to check your answer. Responses generated by this AI system should not be considered as professional, legal, or medical
            advice. We attempt to ensure the accuracy
            of the information provided but there is a possibility that the information may contain
            inaccuracies, and the information may not yet reflect recent changes or fulfill your particular
            needs or purposes.
          </GcdsText>
          <GcdsText>
            This AI system relies on information provided on Government of Canada websites and your use of this system
            and any information generated is also subject to the <GcdsLink
              href="https://www.canada.ca/en/transparency/terms.html">Canada.ca Terms and conditions.</GcdsLink>
          </GcdsText>
        </GcdsDetails>
      </GcdsContainer>
      {/* </main> */}
      <GcdsFooter display='full'></GcdsFooter>
    </>
  );
}

export default App;