import { useSearchParams } from 'react-router-dom';

// Simplified mappings for most common departments
const DEPARTMENT_MAPPINGS = {
  'revenue-agency': {
    code: 'cra',
    fr: 'agence-revenu',
    en: 'revenue-agency',
    domains: ['canada.ca']
  },
  'immigration-refugees-citizenship': {
    code: 'ircc',
    fr: 'immigration-refugies-citoyennete',
    en: 'immigration-refugees-citizenship',
    domains: ['canada.ca']
  },
  'employment-social-development': {
    code: 'esdc',
    fr: 'emploi-developpement-social',
    en: 'employment-social-development',
    domains: ['canada.ca']
  },
  'indigenous-services': {
    code: 'isc',
    fr: 'services-autochtones',
    en: 'indigenous-services',
    domains: ['canada.ca', 'sac-isc.gc.ca']  // Handle both domain patterns
  },
  'public-services-procurement': {
    code: 'pspc',
    fr: 'services-publics-approvisionnement',
    en: 'public-services-procurement',
    domains: ['canada.ca']
  }
};

export function usePageContext() {
  const [searchParams] = useSearchParams();
  
  // Get the referrer URL from query parameter
  const referrer = searchParams.get('ref') || '';
  
  try {
    const urlObj = new URL(referrer);
    
    // Determine language for ISC domain
    const isISC = urlObj.hostname.includes('sac-isc.gc.ca');
    const language = isISC 
      ? urlObj.pathname.includes('/fra/') ? 'fr' : 'en'
      : urlObj.pathname.includes('/fr/') ? 'fr' : 'en';
    
    // Check for ISC domain first
    if (isISC) {
      return {
        referrer,
        url: urlObj.href,
        language,
        department: 'isc'
      };
    }

    // Get path segments and look for department in canada.ca URLs
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    let department = '';
    
    // Find matching department
    for (const segment of pathSegments) {
      for (const [key, value] of Object.entries(DEPARTMENT_MAPPINGS)) {
        if (segment === value.en || segment === value.fr) {
          department = value.code;
          break;
        }
      }
      if (department) break;
    }

    return {
      referrer,
      url: urlObj.href,
      language,
      department
    };
  } catch {
    // If URL parsing fails, return defaults
    return {
      referrer: '',
      url: '',
      language: 'en',
      department: ''
    };
  }
}