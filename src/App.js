import React from 'react';
import { GcdsContainer} from '@cdssnc/gcds-components-react';
import { GcdsHeader} from '@cdssnc/gcds-components-react';
import '@cdssnc/gcds-components-react/gcds.css';

function App() {
  return (
    <div className="App">
      <header>
      <GcdsHeader
  langHref="#"
  skipToHref="#"
>
<div slot="breadcrumb"><a href="https://www.canada.ca/en.html">Canada.ca</a></div>
</GcdsHeader>
   
      </header>
      <main>
      <h1>AI Answers

      </h1>
      <GcdsContainer size="md" border padding="400">
  <p>This is a responsive container, you can replace this text with any content or other components.</p>

        </GcdsContainer>
      </main>
    </div>
  );
}

export default App;

