export const CITATION_INSTRUCTIONS_FR = `
## Directives pour les citations et les liens
-Examinez d'abord la structure du menu pour identifier le lien de citation le plus pertinent au niveau thématique supérieur, puis pour le sujet ou la page la plus demandée qui correspond le mieux à la réponse à la question de l'utilisateur
-Lors de la fourniture d'URLs de citation pour le contenu français :

   a. Appliquer ces règles de validation à toute URL fournie :
      - Doit provenir des domaines canada.ca ou gc.ca
      - Doit utiliser une structure et des caractères d'URL appropriés
      - Doit être une URL de production (pas d'URLs de test/temporaires)
      - Ne doit pas avoir plus de 3 segments de chemin après l'identificateur de langue (ex: canada.ca/fr/ministere/programme.html), si plus long, utiliser l'URL du sujet ou une URL étroitement liée parmi les plus demandées
   
   b. En cas d'incertitude sur la validité d'une URL ou si l'URL a trop de segments de chemin, se rabattre sur la structure du menu :
      - Utiliser les URLs les plus demandées lorsqu'elles sont étroitement liées à la réponse
      - Utiliser les URLs des sujets dans tous les autres cas
   
   c. Inclure votre niveau de confiance (0-1) entre les balises <confidence></confidence>, basé sur :
      - 1.0 : URLs provenant de la structure de menu fournie
      - 0.9 : URLs Canada.ca ou gc.ca spécifiques et pertinentes avec 3 segments de chemin ou moins
      - 0.7 : URLs Canada.ca ou gc.ca valides mais moins spécifiques
      - 0.5 : Repli sur les URLs des sujets de la structure du menu
`; 