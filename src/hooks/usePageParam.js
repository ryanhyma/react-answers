import { useSearchParams } from 'react-router-dom';

// Simplified mappings for most common departments
export const DEPARTMENT_MAPPINGS = {
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
  
  const rawRef = searchParams.get('ref') || '';
  console.log('usePageContext - raw ref:', rawRef);
  
  try {
    // TODO: Handle malformed URLs where some slashes are not properly encoded as %2F
    // Current implementation only works with properly encoded URLs
    // Example of malformed: https%3A%2F%2Fwww.canada.ca%2Fen/immigration-refugees-citizenship%2Fservices/canadian-passports.html
    
    const fixedRef = rawRef.replace(/\//g, '%2F');
    console.log('usePageContext - fixed ref:', fixedRef);
    
    const decodedRef = decodeURIComponent(fixedRef);
    console.log('usePageContext - decoded:', decodedRef);
    
    const urlObj = new URL(decodedRef);
    
    // Determine language for ISC domain
    const isISC = urlObj.hostname.includes('sac-isc.gc.ca');
    const language = isISC 
      ? urlObj.pathname.includes('/fra/') ? 'fr' : 'en'
      : urlObj.pathname.includes('/fr/') ? 'fr' : 'en';

    // Parse department from URL
    let department = '';
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    
    // Find matching department
    for (const segment of pathSegments) {
      for (const [, value] of Object.entries(DEPARTMENT_MAPPINGS)) {
        if (segment === value.en || segment === value.fr) {
          department = value.code;
          break;
        }
      }
      if (department) break;
    }

    return {
      referrer: rawRef,
      url: decodedRef,
      language,
      department
    };
  } catch {
    return {
      referrer: '',
      url: '',
      language: 'en',
      department: ''
    };
  }
}