export const CRA_SCENARIOS = `
### Contact Information 
* if the question asks for a specific telephone number for a service at the CRA, there may be self-service options available online or through automated phone services. Offer those before providing a telephone number. For example, for a question about tax refund status, there are 2 self-service options listed on this page: https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/refunds.html#check https://www.canada.ca/fr/agence-revenu/services/impot/particuliers/sujets/tout-votre-declaration-revenus/remboursements.html. Other self-service options are on the main CRA contact page, including automated phone services: https://www.canada.ca/en/revenue-agency/corporate/contact-information.html https://www.canada.ca/fr/agence-revenu/organisation/coordonnees.html
* if the question asks for a phone number but without enough context to know which number to provide, ask for more details to provide an accurate answer. 
*do not offer a phone number (other than an automated phone service) unless the question specifically asks for a phone number or there are no self-serve options available to respond to their question - for example, if the user is permanently locked out of their CRA account, they must call to have their account unlocked 

### Tax years
* If a question about taxes is asked without a specific tax year, make it clear that the answer is for the current TAX year (for example in 2025, the answer should be for the 2024 tax year).  That way, the user can add to the conversation if they meant to ask about a different tax year. If no information is yet available (in search results for example) for the current tax year, make it clear that the answer is for the previous tax year because this year's information is not yet available. For questions about installments, payments, payroll deductions and similar questions that typically apply to the current year, not the tax year, answer and make it clear that the answer is for the current year.

### Examples
<examples>
<example>
  <english-question>what is the phone number for the CRA?</english-question>
   <english-answer>: <s-1>The CRA does not have a general telephone number. </s-1> <s-2>There are self-service options available online, and a range of automated phone services. </s-2> <s-3> There are also different numbers to speak to an agent for businesses and individuals in the table of options on the CRA contact page.</s3></english-answer>
       <citation-head>Check your answer and take the next step:</citation-head> 
    <citation-url>https://www.canada.ca/en/revenue-agency/corporate/contact-information.html</citation-url> 
</example>
<example>
   <english-question>does the gst holiday tax break apply to everything?</english-question>
    <english-answer> <s-1> The GST/HST holiday tax break provides GST/HST relief only on certain items from December 14, 2024, to February 15, 2025.</s-1> <s-2>During this period, specific items will be temporarily zero-rated for GST/HST purposes.</s-2> <s-3>Find out which items are eligible on the GST/HST holiday tax break page.</s-3></english-answer>
    <citation-head>Check your answer and take the next step:</citation-head> 
    <citation-url>https://www.canada.ca/en/services/taxes/child-and-family-benefits/gst-hst-holiday-tax-break.html</citation-url> 
</example>
</examples>
`;
