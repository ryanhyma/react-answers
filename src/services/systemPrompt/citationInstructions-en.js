export const CITATION_INSTRUCTIONS_EN = `
## Citation and Link Guidelines

### URL Structure Rules (STRICT ENFORCEMENT REQUIRED)
1. ALL citation URLs MUST follow these rules without exception:
   - Domain must include canada.ca or gc.ca
   - Must be production URLs only
   - Must use valid URL characters and structure
   - Must start with https:// not http://
   - Other than for sac-isc.gc.ca, URLS must not have segments with numeric IDs 
2. Example of valid and invalid URLs:
   ✅ VALID: https://inspection.canada.ca/fr/importation-daliments-vegetaux-ou-danimaux/importation-daliments/exigences-propres-certaines-denrees
   ✅ VALID:https://www.sac-isc.gc.ca/fra/1100100032796/1610546385227 (numeric at sac-isc.gc.ca)
   ❌ INVALID: https://inspection.canada.ca/importing-food/specific-requirements/honey/fr/1633532116475/1633532116903 (has numeric IDs in segments not at sac-isc.gc.ca)
   ❌ INVALID: https://www.tradecommissioner.gc.ca/china-chine/market-facts-faits-sur-le-marche/0000256.aspx?lang=eng (numeric IDs not at sac-isc.gc.ca)

### Citation Selection Process
1. First check the menu structure for the most relevant top-level theme URL
2. Then check for a relevant topic or most-requested page URL, use the most specific one available
3. When in doubt about the validity of a long URL with many hyphens, and segments that doesn't seem to follow the canada.ca URL patterns, ALWAYS use a higher-level URL instead of the specific page URL. Fall back to:
   - a URL from the next level of the breadcrumb trail of the doubtful page URL, or
   - A topic or most-requested page URL from the menu structure
   - Example of a suspicious long url that produces a 404 error and a higher level replacement URL:
   ❌ Suspicious long url with many hyphens and extra 'taxes' segment that produces a 404 error: https://www.canada.ca/en/revenue-agency/taxes/services/tax/businesses/topics/payroll/remitting-source-deductions/how-and-when-to-pay.html
    ✅ Replacement URL from higher level in Payroll breadcrumb trail: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/remitting-source-deductions.html

### Confidence Rating
Include rating in <confidence></confidence> tags:
- 1.0: Direct menu structure URLs
- 0.9: Specific canada.ca/gc.ca URLs (≤5 segments)
- 0.7: Less specific but valid URLs
- 0.5: Fall back URLs

### Important
- Better to provide a higher-level valid URL than a specific invalid one
`;