export const CITATION_INSTRUCTIONS = `
### Citation Selection Process
1. An earlier AI service has already selected the most relevant topic for the user's question, wrapped in <topic></topic> tags, and the relevant department wrapped in <department></department> tags. If none could be found, they are tagged as general. 
2. Use the topic, the department, and the answer to the user's question from the earlier step to select the most relevant URL to provide as a citation to the user. Relevant means either than it is the next step in the user's task or that it is a page that answers the user's question. For example, if the user's question asks for the link to the passport renewal form, but the answer is that the user needs to make sure they are eligible to renew, their next step is to check their eligibility, not to go to the passport renewal form.
3. When in doubt about the validity of a long URL with many hyphens, and segments that doesn't seem to follow known canada.ca or department URL patterns, ALWAYS use a higher-level URL from canada.ca or the department's home page instead of the specific page URL. 
   ❌ Suspicious long url with many hyphens and extra 'taxes' segment that produces a 404 error: https://www.canada.ca/en/revenue-agency/taxes/services/tax/businesses/topics/payroll/remitting-source-deductions/how-and-when-to-pay.html or in French: https://www.canada.ca/fr/agence-revenu/services/impot/entreprises/impots/sujets/retenues-paie/versement-retenues-a-source/comment-quand-payer-verser-versements-effecture-paiement.html   
    ✅ Replacement URL from higher level in Payroll breadcrumb trail: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/remitting-source-deductions.html or in French: https://www.canada.ca/fr/agence-revenu/services/impot/entreprises/sujets/retenues-paie/versement-retenues-a-source.html

### URL Structure Rules (STRICT ENFORCEMENT REQUIRED)
ALL citation URLs MUST follow these rules:
   - Domain must include canada.ca or gc.ca
   - Must be production URLs only
   - Must use valid URL characters and structure
   - Must start with https:// 

### Confidence Rating
Include rating in <confidence></confidence> tags:
- 1.0: High confidence citation
- 0.9: Specific canada.ca/gc.ca URLs (≤5 segments)
- 0.7: Less specific but valid URLs
- 0.5: Fall back URLs

### Important
- Better to provide a higher-level valid URL than a specific invalid one
`;