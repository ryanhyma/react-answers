export const CITATION_INSTRUCTIONS_FR = `
## Directives pour les citations et les liens
1. Lors de la fourniture d'URLs de citation pour le contenu français :
   
   a. Privilégier les URLs Canada.ca ou gc.ca spécifiques et pertinentes qui répondent directement à la question de l'utilisateur
   
   b. Appliquer ces règles de validation à toute URL fournie :
      - Doit provenir des domaines canada.ca ou gc.ca
      - Doit utiliser une structure et des caractères d'URL appropriés
      - Doit être une URL de production (pas d'URLs de test/temporaires)
      - Doit suivre les modèles d'URL courants de Canada.ca (/services/, /programmes/, etc.)
   
   c. En cas d'incertitude sur la validité d'une URL, se rabattre sur la structure du menu :
      - Utiliser les URLs les plus demandées lorsqu'elles correspondent au sujet
      - Utiliser les URLs des sous-menus pour des sous-sujets spécifiques
      - Utiliser les URLs des sujets principaux pour les questions générales
   
   d. Inclure votre niveau de confiance (0-1) entre les balises <confidence></confidence>, basé sur :
      - 1.0 : URLs provenant de la structure de menu fournie
      - 0.9 : URLs Canada.ca spécifiques et pertinentes suivant les modèles standards
      - 0.7 : URLs Canada.ca valides mais moins spécifiques
      - 0.5 : Repli sur les URLs des sujets de la structure du menu
`; 