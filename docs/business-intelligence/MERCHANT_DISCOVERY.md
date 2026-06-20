# MERCHANT DISCOVERY
## Validation terrain — Interviews & Pain Points
**Version:** 1.1 — 2026-06-03  
**Statut:** Framework prêt — interviews à conduire avant Phase 1

---

## OBJECTIF

Avant de construire quoi que ce soit au-delà du MVP existant, valider avec de vrais marchands Shopify que les fonctionnalités planifiées correspondent à des douleurs réelles — et pas à des hypothèses produit.

**Règle d'or:** Chaque fonctionnalité majeure de Phase 1–3 doit être validée par plusieurs marchands indépendants et par des patterns récurrents avant implémentation. Le signal recherché est la saturation des insights, pas un seuil numérique isolé.

---

## Principe de saturation des insights

Le nombre d'interviews est un moyen, pas l'objectif. L'objectif réel est d'atteindre une saturation des insights : le moment où les mêmes douleurs, objections, besoins et signaux de willingness-to-pay reviennent de manière répétée chez les marchands ciblés.

Kairos ne doit donc pas viser un chiffre symbolique d'interviews. Le nombre nécessaire dépendra de la diversité des réponses, du segment interrogé, de la répétition des douleurs, du retour des mêmes objections et du niveau de confiance requis avant de prioriser une feature.

Une première vague peut commencer avec 5 marchands. Après chaque vague, l'équipe doit regrouper les douleurs, objections, besoins, signaux de willingness-to-pay et signaux CRM / Customer Intelligence. Les interviews continuent seulement si les réponses restent trop variées, si les patterns ne sont pas encore stables ou si des questions critiques restent ouvertes.

La validation est considérée comme suffisamment forte lorsqu'un ensemble clair de problèmes revient de manière répétée : profit réel, inventaire mort, décisions produit, réassort, coûts opérationnels, willingness-to-pay, intérêt potentiel pour CRM / Customer Intelligence et besoin de recommandations actionnables.

---

## 1. PROFIL DES MARCHANDS CIBLES

### Segments à interviewer

**Segment A — Petit marchands (cible principale MVP)**
- Boutique Shopify: $2K–$20K/mois de revenus
- 5–30 produits actifs
- 1 personne gère tout (propriétaire = opérateur)
- Pas de contrôleur financier
- Calcule ses marges dans Excel ou approximativement

**Segment B — Marchands intermédiaires (cible Growth)**
- Boutique Shopify: $20K–$200K/mois de revenus
- 20–200 produits actifs
- 2–5 employés
- Dépense en publicité (Meta, Google, TikTok)
- Utilise peut-être Lifetimely ou Triple Whale déjà

**Note :** Cette fourchette reste indicative et sera affinée avec les interviews, la saturation des insights et l'analyse willingness-to-pay.

**Segment C — Marchands avancés (cible Pro)**
- Boutique Shopify: $150K+/mois
- 50–500 produits actifs
- Équipe dédiée (ops, marketing, finance)
- Multiple outils: 3PL, ERP, Klaviyo, etc.
- Budget SaaS > $500/mo existant

**Priorité d'interview:** A > B >> C (A = budget limité, valeur perçue doit être immédiate)

---

## 2. PLAN D'ENTREVUES

### Cadre pratique
- Point de départ: petites vagues d'interviews, par exemple 5 marchands à la fois
- Cible réelle: saturation des insights, pas volume absolu
- Format: 30 minutes, vidéo ou téléphone
- Délai: Compléter avant fin Phase 0 (2026-06-14)

### Méthode par vagues
- **Vague 1 :** 5 interviews exploratoires pour comprendre les douleurs, objections et besoins réels sans imposer les hypothèses Kairos.
- **Analyse :** regrouper les douleurs par thème : profit réel, inventaire mort, décisions produit, réassort, coûts opérationnels, pricing, CRM / Customer Intelligence, recommandations actionnables.
- **Vague 2 :** 5 interviews ciblées sur les hypothèses les plus fortes et les zones encore ambiguës.
- **Vague 3+ :** continuer seulement si les réponses ne sont pas encore stables, si les segments divergent fortement ou si des questions critiques restent non résolues.
- **Validation :** lorsque les mêmes douleurs reviennent clairement, passer à la priorisation produit plutôt que poursuivre les interviews par principe.

Ces nombres sont un cadre pratique, pas une obligation. Si la saturation arrive plus tôt ou plus tard selon le segment, la décision doit suivre la qualité des insights.

### Sources de recrutement
1. **Groupes Facebook** — "Shopify Entrepreneurs", "Dropshipping Québec", "eCommerce Canada"
2. **Reddit** — r/shopify, r/ecommerce, r/dropship
3. **Réseau personnel** — connaissances qui ont une boutique Shopify
4. **LinkedIn** — "Shopify store owner" + filtre Canada/France
5. **Discord Shopify** — serveurs communautaires DTC
6. **Incentive:** 30 min de consultation gratuite sur leur profitabilité en échange de l'entrevue

---

## 3. GUIDE D'ENTREVUE

### Introduction (2 min)
> "Merci de me parler aujourd'hui. Je construis un outil pour les marchands Shopify et je veux comprendre vos défis AVANT de construire quoi que ce soit. Je ne vais pas vous vendre quoi que ce soit aujourd'hui — j'ai juste besoin de comprendre votre réalité."

**Règle:** Écouter 80% du temps. Poser des questions ouvertes. Ne pas mentionner les fonctionnalités de Kairos.

---

### Bloc A — Contexte (5 min)

1. "Décris-moi ta boutique en 3 phrases: quoi, depuis quand, combien de produits?"
2. "Comment as-tu commencé? Quelle est ton histoire avec le e-commerce?"
3. "C'est ta source de revenu principale ou secondaire?"

*Ce qu'on cherche:* niveau de sophistication, dépendance financière, contexte

---

### Bloc B — Gestion financière actuelle (10 min)

4. "Comment tu sais si ta boutique est profitable en ce moment?"
5. "Est-ce que tu sais exactement combien tu gagnes par produit vendu?"
6. *(Si non)* "Pourquoi pas? Qu'est-ce qui bloque?"
7. *(Si oui)* "Comment tu calcules ça? Montre-moi si tu veux."
8. "Quand tu regardes ton Shopify, qu'est-ce qui te manque comme information?"
9. "C'est quoi la dernière décision business difficile que tu as dû prendre? Comment tu l'as prise?"
10. "Est-ce qu'il t'est arrivé de vendre un produit en pensant gagner de l'argent et réaliser après que tu perdais?"

*Ce qu'on cherche:* sophistication financière, outils actuels, pain points réels, anecdotes

---

### Bloc C — Inventaire (8 min)

11. "Comment tu gères ton inventaire en ce moment?"
12. "Est-ce que tu as déjà eu un problème de rupture de stock sur un produit qui se vendait bien?"
13. "Est-ce que tu as des produits qui traînent en stock depuis longtemps? Comment tu le sais?"
14. "Combien représente ton inventaire mort en valeur, approximativement?"
15. "Qu'est-ce que tu fais avec les produits qui ne se vendent plus?"

*Ce qu'on cherche:* validation du pain point inventaire mort, coût réel, comportement actuel

---

### Bloc D — Décisions produits (5 min)

16. "Comment tu décides quel produit ajouter à ta boutique?"
17. "Comment tu décides quel produit arrêter de vendre?"
18. "Est-ce que tu as déjà arrêté un produit? Pourquoi? Comment tu as su?"
19. "Si quelqu'un pouvait te dire demain 'arrête de vendre ce produit, il te coûte X par mois', est-ce que tu agirais?"

*Ce qu'on cherche:* processus décisionnel, ouverture aux recommandations IA, validation de l'advisor

---

### Bloc E — Outils actuels & frustrations (5 min)

20. "Quels outils tu utilises pour gérer ta boutique? (Shopify apps, analytics, etc.)"
21. "Qu'est-ce que tu aimes dans ces outils? Qu'est-ce qui te frustre?"
22. "Combien tu paies en SaaS par mois pour ta boutique, approximativement?"
23. "Y a-t-il un outil que tu voudrais qui n'existe pas encore?"

*Ce qu'on cherche:* stack existant, budget SaaS disponible, gaps de marché identifiés

---

### Bloc E2 — CRM / Customer Intelligence (5 min)

24. "Utilises-tu un CRM ou outil client ? Si oui lequel ? HubSpot, Klaviyo, Gorgias, Salesforce, Zoho, Pipedrive, autre ?"
25. "Est-ce que tes données clients influencent tes décisions produit ?"
26. "Est-ce que tu sais quels produits attirent tes meilleurs clients ?"
27. "Est-ce que tu sais quels produits génèrent le plus de plaintes ou de support ?"
28. "Est-ce qu'un outil qui connecte Shopify + CRM pour enrichir les recommandations serait utile ?"
29. "Est-ce que connecter ton CRM à un outil d'analyse business serait un frein ou une valeur ajoutée ?"
30. "Quelles données CRM seraient les plus utiles pour tes décisions business ?"

*Ce qu'on cherche:* adoption CRM réelle, valeur des signaux clients, risque d'intégration, potentiel de partenariats et de beta qualifiée

---

### Bloc F — Validation willingness-to-pay (5 min — à faire naturellement, pas comme un pitch)

31. "Si un outil pouvait te montrer exactement quel produit t'enrichit et lequel te ruine, et te dire quoi faire, qu'est-ce que ça vaudrait pour toi?"
32. "Qu'est-ce qui te ferait changer d'outil ou adopter un nouvel outil?"
33. "C'est quoi le dernier SaaS que tu as acheté pour ta boutique? Pourquoi tu l'as acheté?"

---

### Clôture (2 min)
> "Dernière question: si on avait un outil qui résolvait exactement le problème que tu m'as décrit, est-ce que tu voudrais le tester en priorité?"

*(Si oui → obtenir email pour beta waitlist)*

---

## 4. GRILLE D'ANALYSE

Pour chaque interview, noter:

| Dimension | Score (1-5) | Notes |
|---|---|---|
| Conscience du problème de profitabilité | | |
| Douleur inventaire mort | | |
| Sophistication financière | | |
| Budget SaaS disponible (estimé) | | |
| Ouverture aux recommandations IA | | |
| Urgence du besoin | | |
| Potentiel de conversion | | |

**Score total:** Prioriser les marchands avec score moyen > 3.5 pour la beta

---

## 5. PAIN POINTS HYPOTHÈSES (à valider ou invalider)

Ces hypothèses viennent de l'analyse compétitive. Chaque interview doit les confirmer ou les infirmer.

| # | Hypothèse | Priorité | Statut |
|---|---|---|---|
| H1 | Le marchand ne sait pas quel produit lui coûte de l'argent | Critique | À valider |
| H2 | L'inventaire mort est un problème financier réel et sous-estimé | Critique | À valider |
| H3 | Les marchands calculent leurs marges dans Excel de façon approximative | Haute | À valider |
| H4 | Le marchand veut des recommandations, pas juste des données | Haute | À valider |
| H5 | Le marchand ne sait pas quand commander du stock | Haute | À valider |
| H6 | Les pics de ventes (heures/jours) sont des insights utiles et actionnables | Moyenne | À valider |
| H7 | Le marchand veut trouver de nouveaux produits à vendre | Haute | À valider |
| H8 | Le marchand veut comparer ses fournisseurs | Moyenne | À valider |
| H9 | Le marchand est frustré de ne pas avoir ses vraies marges dans Shopify | Critique | À valider |
| H10 | Le marchand paierait $50–$150/mois pour un outil de décision business | Critique | À valider |
| H11 | Les données CRM peuvent enrichir les recommandations produit | Haute | À valider |
| H12 | Les marchands veulent savoir quels produits attirent leurs meilleurs clients | Haute | À valider |
| H13 | Les données support/CRM peuvent aider à identifier les produits problématiques | Moyenne | À valider |
| H14 | Une intégration CRM peut faciliter des partenariats ou bêta-tests qualifiés | Moyenne | À valider |

---

## 6. ANALYSE PAR SEGMENT ATTENDUE

### Segment A — Ce qu'on attend d'entendre

**Pain points probables:**
- "Je sais pas si je fais vraiment de l'argent"
- "J'ai des produits qui traînent depuis 6 mois"
- "J'utilise Excel pour mes coûts"
- "Shopify me montre mes ventes, pas mon profit"

**Résistances probables:**
- Budget limité (< $50/mo sensibilité prix forte)
- "J'ai pas le temps d'apprendre un nouvel outil"
- Scepticisme IA

**Déclencheur d'achat probable:** ROI immédiat ("si j'économise $500 ce mois sur l'inventaire mort")

---

### Segment B — Ce qu'on attend d'entendre

**Pain points probables:**
- "J'ai Triple Whale mais ça me dit pas mon vrai profit"
- "Mes pubs Meta me coûtent cher, je sais pas si c'est rentable au niveau produit"
- "J'ai des ruptures de stock sur mes bestsellers"
- "J'ai trop de SKUs à gérer, je sais pas lesquels couper"

**Déclencheur d'achat probable:** Gain de temps + meilleure décision produit

---

### Segment C — Ce qu'on attend d'entendre

**Pain points probables:**
- "Mon équipe ops et mon équipe marketing ont des données différentes"
- "On a besoin de forecasting pour les commandes fournisseurs"
- "On veut automatiser nos décisions de réassort"

**Déclencheur d'achat probable:** Économies d'échelle, intégrations avec leur stack

---

## 7. CRITÈRES DE SATURATION

La recherche terrain peut être considérée comme suffisamment avancée lorsque :
- Les mêmes pains reviennent chez plusieurs marchands du segment cible
- Les objections principales sont connues et se répètent
- Les features prioritaires sont confirmées par plusieurs marchands
- Le pricing / willingness-to-pay commence à former une fourchette cohérente
- Les questions critiques restantes sont identifiées explicitement
- Les nouveaux interviews ajoutent peu de nouveaux insights majeurs

La saturation doit être évaluée par segment. Segment A, B et C peuvent atteindre la stabilité à des moments différents.

---

## 8. MÉTRIQUES DE VALIDATION

**Le produit est validé si:**
- La profitabilité par produit revient comme problème réel chez plusieurs marchands du segment cible
- L'inventaire mort est mentionné spontanément ou confirmé comme coût réel
- Les marchands disent qu'ils agiraient sur une recommandation bien expliquée
- La willingness-to-pay commence à converger vers une fourchette exploitable
- Des marchands qualifiés demandent à rejoindre la beta waitlist
- L'intérêt ou la résistance envers CRM / Customer Intelligence est suffisamment clair pour décider du prochain niveau de validation

**Pivots à considérer si:**
- L'inventaire est rarement mentionné ou semble secondaire → réduire la priorité Phase 1.1
- Les pubs reviennent comme pain point dominant → considérer intégration ad spend plus tôt
- Segment A montre une sensibilité prix forte et répétée → ajuster pricing ou packaging
- Le CRM apparaît comme source forte de valeur ou de friction → cadrer un CRM Integration Spike avant développement lourd

---

## 9. TEMPLATE DE NOTES D'ENTREVUE

```markdown
## Entrevue #[N] — [Prénom] — [Date]

**Profil:**
- Segment: A / B / C
- Revenus Shopify (estimation): 
- Nombre de produits:
- Temps en e-commerce:
- Outils utilisés:
- Budget SaaS estimé:

**Citations clés (mot pour mot):**
1. "..."
2. "..."
3. "..."

**Hypothèses validées:**
- H1: Oui / Non / Partiel
- H2: Oui / Non / Partiel
- [...]

**Douleur principale identifiée:**

**Fonctionnalité qui résoudrait son problème immédiatement:**

**Willingness to pay estimé:**

**Signaux CRM / Customer Intelligence:**
- CRM utilisé:
- Données clients utiles:
- Freins à la connexion CRM:

**Intéressé pour la beta:** Oui / Non — Email: [...]

**Score total:** /35

**Insights inattendus:**
```

---

## 10. SYNTHÈSE — TEMPLATE POST-INTERVIEWS

*(À compléter après chaque vague d'interviews et à stabiliser lorsque la saturation des insights est atteinte.)*

### Top 5 Pain Points validés (par fréquence)
1. 
2. 
3. 
4. 
5. 

### Fonctionnalités les plus demandées (spontanément)
1. 
2. 
3. 

### Fonctionnalités de RESEARCH_PLAN.md à déprioriser (non validées)
- 

### Fonctionnalités à prioriser (validées par patterns récurrents)
- 

### Ajustements pricing recommandés
- 

### Segments à prioriser pour la beta
- 

### Signaux CRM / Customer Intelligence
- 

### Niveau de saturation atteint
- Stable / Partiel / Insuffisant :
- Questions critiques restantes :

---

*End of MERCHANT_DISCOVERY.md — Last updated 2026-06-03 — v1.1*
