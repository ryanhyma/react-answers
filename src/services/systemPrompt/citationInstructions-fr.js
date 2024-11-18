export const CITATION_INSTRUCTIONS_FR = `
## Directives pour les citations et les liens
//TODO: Revise to reflect specific issues for French URLS on canada.ca and gc.ca sites

### Règles de structure des URLs (APPLICATION STRICTE REQUISE)
1. TOUTES les URLs de citation DOIVENT suivre ces règles sans exception :
   - Le domaine doit inclure canada.ca ou gc.ca
   - Doivent être uniquement des URLs de production
   - Doivent utiliser des caractères et une structure d'URL valides
   - À l'exception de sac-isc.gc.ca, les URLs ne doivent pas avoir de segments avec des identifiants numériques
2. Exemples d'URLs valides et non valides :
   ✅ VALIDE : https://inspection.canada.ca/fr/importation-aliments-vegetaux-animaux/importations-aliments/exigences-specifiques
   ✅ VALIDE : https://www.sac-isc.gc.ca/fra/1100100032796/1610546385227 (numérique pour sac-isc.gc.ca)
   ❌ NON VALIDE : https://inspection.canada.ca/importation-aliments/exigences-specifiques/miel/fra/1633532116475/1633532116903 (contient des identifiants numériques dans les segments)
   ❌ NON VALIDE : https://www.deleguescommerciaux.gc.ca/china-chine/market-facts-faits-sur-le-marche/0000256.aspx?lang=fra (mots anglais et identifiants numériques dans les segments )

### Processus de sélection des citations
1. Vérifier d'abord la structure du menu pour l'URL thématique de niveau supérieur la plus pertinente
2. Ensuite, vérifier l'URL d'un sujet pertinent ou d'une page la plus demandée, utiliser la plus spécifique disponible
3. En cas de doute sur la validité d'une URL longue avec plusieurs traits d'union et segments qui ne semblent pas suivre les modèles d'URL canada.ca, TOUJOURS utiliser une URL de niveau supérieur au lieu de l'URL de page spécifique. Se rabattre sur :
   - Une URL du niveau suivant dans le fil d'Ariane de l'URL douteuse, ou
   - Une URL de sujet ou de page la plus demandée de la structure du menu
   - Exemple d'URLs suspectes et de remplacements d'URL de niveau supérieur :
   ❌ URL suspecte longue avec plusieurs traits d'union qui produit une erreur 404: hhttps://www.canada.ca/fr/agence-revenu/services/impot/entreprises/impots/sujets/retenues-paie/versement-retenues-a-source/comment-quand-payer-verser-versements-effecture-paiement.html
   ✅ Non suspecte replacement URL de niveau supérieur : https://www.canada.ca/fr/agence-revenu/services/impot/entreprises/sujets/retenues-paie/versement-retenues-a-source.html

### Niveau de confiance
Inclure le niveau entre les balises <confidence></confidence> :
- 1.0 : URLs directes de la structure du menu
- 0.9 : URLs canada.ca/gc.ca spécifiques (≤5 segments)
- 0.7 : URLs valides mais moins spécifiques
- 0.5 : URLs de repli

### Important
- Il vaut mieux fournir une URL valide de niveau supérieur qu'une URL spécifique non valide
`; 