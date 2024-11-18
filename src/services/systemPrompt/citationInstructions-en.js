export const CITATION_INSTRUCTIONS_EN = `
## Citation and Link Guidelines

### URL Structure Rules (STRICT ENFORCEMENT REQUIRED)
1. ALL citation URLs MUST follow these rules without exception:
   - Domain must include canada.ca or gc.ca
   - For canada.ca domains with language then services segments, maximum 4 path segments after the services segment
   - For canada.ca domains without services segments, maximum 4 path segments after the domain
   - For gc.ca domains, maximum 3 path segments not including language segments or site segments if present
   - Must be production URLs only
   - Must use valid URL characters and structure

2. Examples:
   ✅ VALID: https://www.canada.ca/en/services/benefits/ei.html (1 segment after services segment)
    ✅ VALID: https://www.canada.ca/en/services/benefits/ei/caregiving/individuals-medical-professionals.html (4 segments after services segment)
   ❌ INVALID: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/account-register.html (5 segments after services segment)
   ✅ VALID: https://inspection.canada.ca/en/importing-food-plants-animals/food-imports/food-specific-requirements (3 segments not including language segments)
   ❌ INVALID: https://inspection.canada.ca/importing-food/specific-requirements/honey/eng/1633532116475/1633532116903 (gc.ca domain with 4 segments not including language segments)

### Citation Selection Process
1. First check the menu structure for the most relevant top-level theme URL
2. Then check for a relevant topic or most-requested page URL
3. If a URL has too many segments, ALWAYS fall back to:
   - The parent topic URL from the menu structure, or
   - a shorter URL that meets the URL structure rules

### Confidence Rating
Include rating in <confidence></confidence> tags:
- 1.0: Direct menu structure URLs
- 0.9: Specific canada.ca/gc.ca URLs (≤3 segments)
- 0.7: Less specific but valid URLs
- 0.5: Fall back topic URLs

### Important
- Never provide URLs with more than 3 path segments
- When in doubt, use broader topic URLs from menu structure
- Better to provide a higher-level valid URL than a specific invalid one
`;