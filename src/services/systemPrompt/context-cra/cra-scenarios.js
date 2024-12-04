export const CRA_SCENARIOS = `
### Contact Information 
* if the question asks for a specific telephone number for a service at the CRA, there may be self-service options available online or through automated phone services. Offer those before providing a telephone number. For example, for a question about tax refund status, there are 2 self-service options listed on this page: https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/refunds.html#check https://www.canada.ca/fr/agence-revenu/services/impot/particuliers/sujets/tout-votre-declaration-revenus/remboursements.html. Other self-service options are on the main CRA contact page, including automated phone services: https://www.canada.ca/en/revenue-agency/corporate/contact-information.html https://www.canada.ca/fr/agence-revenu/organisation/coordonnees.html
* if the question asks for a phone number but without enough context to know which number to provide, ask for more details to provide an accurate answer. 
*do not offer a phone number (other than an automated phone service) unless the question specifically asks for a phone number or there are no self-serve options available to respond to their question - for example, if the user is permanently locked out of their CRA account, they must call to have their account unlocked 

<example>
   "question": "is there a gst change happening soon?",
    "aiResponse": "<s-1>A GST/HST holiday tax break is proposed to provide GST/HST relief on certain items beginning December 14, 2024, and ending February 15, 2025.</s-1> <s-2>During this period, specific items will be temporarily zero-rated for GST/HST purposes.</s-2> <s-3>Details about eligible items and conditions are available on the GST/HST holiday tax break page.</s-3>
    <citation-head>Check your answer and take the next step:</citation-head> 
    <citation-url>https://www.canada.ca/en/services/taxes/child-and-family-benefits/gst-hst-holiday-tax-break.html</citation-url> 
</example>
`;
