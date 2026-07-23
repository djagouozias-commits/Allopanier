# Requirements Document

## Introduction

AlloPanier est une PWA (Progressive Web App) de livraison à domicile. Sur mobile, la navigation principale est gérée par un menu burger dans le Header, ce qui impose plusieurs interactions pour atteindre les pages clés. Cette fonctionnalité introduit une barre de navigation fixe en bas de l'écran (`BottomNav`), visible uniquement sur mobile, pour offrir un accès rapide aux destinations les plus fréquentes. Le bouton "Historique" (mes commandes) est positionné à l'extrême droite, conformément aux conventions UX mobiles où les actions secondaires mais importantes occupent ce coin.

## Glossaire

- **BottomNav** : Composant de barre de navigation fixe affiché en bas de l'écran sur les appareils mobiles.
- **Raccourci** : Bouton de navigation dans le BottomNav permettant d'accéder directement à une page.
- **Indicateur de badge** : Pastille numérique affichée sur un raccourci pour signaler un compteur (ex. articles dans le panier).
- **Route active** : Route React Router correspondant à l'URL courante, servant à mettre en surbrillance le raccourci actif.
- **Safe area** : Zone inférieure de l'écran sur iPhone et appareils à encoche, gérée via `env(safe-area-inset-bottom)`.
- **ClientLayout** : Composant de mise en page englobant les pages publiques et client de l'application.
- **Panier** : Page listant les articles ajoutés par l'utilisateur avant commande, accessible via `/panier`.
- **Historique** : Page listant les commandes passées par l'utilisateur, accessible via `/mes-commandes`.

---

## Requirements

### Requirement 1 : Affichage conditionnel sur mobile

**User Story:** En tant qu'utilisateur mobile, je veux voir une barre de navigation fixe en bas de l'écran, afin d'accéder rapidement aux pages principales sans avoir à utiliser le menu burger.

#### Acceptance Criteria

1. THE BottomNav SHALL s'afficher uniquement sur les écrans dont la largeur est inférieure à 768 px (breakpoint `md` de Tailwind).
2. WHILE l'utilisateur est sur une page incluse dans le `ClientLayout`, THE BottomNav SHALL rester visible en position fixe en bas de l'écran.
3. THE BottomNav SHALL être masqué sur les routes de l'espace admin (préfixe `/admin`).
4. THE BottomNav SHALL être masqué sur les pages d'authentification (`/connexion`, `/inscription`).
5. THE BottomNav SHALL appliquer un padding inférieur équivalent à `env(safe-area-inset-bottom)` pour respecter la Safe area des appareils iOS.

---

### Requirement 2 : Composition des raccourcis

**User Story:** En tant qu'utilisateur mobile, je veux trouver les raccourcis les plus utiles dans la barre de navigation, afin de naviguer efficacement sans chercher dans les menus.

#### Acceptance Criteria

1. THE BottomNav SHALL contenir exactement 5 raccourcis dans l'ordre suivant (de gauche à droite) : Accueil, Catalogue, Panier, Compte, Historique.
2. THE BottomNav SHALL positionner le raccourci "Historique" à l'extrême droite de la barre.
3. WHEN l'utilisateur appuie sur le raccourci "Accueil", THE BottomNav SHALL naviguer vers la route `/`.
4. WHEN l'utilisateur appuie sur le raccourci "Catalogue", THE BottomNav SHALL naviguer vers la route `/catalogue`.
5. WHEN l'utilisateur appuie sur le raccourci "Panier", THE BottomNav SHALL naviguer vers la route `/panier`.
6. WHEN l'utilisateur appuie sur le raccourci "Compte", THE BottomNav SHALL naviguer vers la route `/mon-compte` si l'utilisateur est authentifié, ou vers `/connexion` s'il ne l'est pas.
7. WHEN l'utilisateur appuie sur le raccourci "Historique", THE BottomNav SHALL naviguer vers la route `/mes-commandes` si l'utilisateur est authentifié, ou vers `/connexion` s'il ne l'est pas.

---

### Requirement 3 : Indicateur de route active

**User Story:** En tant qu'utilisateur mobile, je veux voir quel raccourci correspond à la page actuellement affichée, afin de me repérer dans l'application.

#### Acceptance Criteria

1. WHEN la route courante correspond à la destination d'un raccourci, THE BottomNav SHALL afficher ce raccourci dans un état visuellement distinct (couleur primaire, icône remplie ou label en gras).
2. WHEN la route courante ne correspond à aucun raccourci, THE BottomNav SHALL afficher tous les raccourcis dans leur état inactif.
3. THE BottomNav SHALL utiliser `useLocation` de React Router pour déterminer la route active sans déclencher de rendu inutile.

---

### Requirement 4 : Indicateur de badge sur le Panier

**User Story:** En tant qu'utilisateur mobile, je veux voir le nombre d'articles dans mon panier directement sur le raccourci Panier, afin de savoir sans naviguer si mon panier contient des articles.

#### Acceptance Criteria

1. WHEN le nombre d'articles dans le panier est supérieur à 0, THE BottomNav SHALL afficher une pastille numérique sur le raccourci "Panier" indiquant le nombre d'articles.
2. WHEN le nombre d'articles dans le panier est égal à 0, THE BottomNav SHALL masquer la pastille numérique sur le raccourci "Panier".
3. WHEN le nombre d'articles dans le panier est supérieur à 99, THE BottomNav SHALL afficher "99+" dans la pastille numérique.
4. THE BottomNav SHALL lire le compteur d'articles depuis `useCartStore` via le sélecteur `getItemCount()`.

---

### Requirement 5 : Accessibilité et zone de touche

**User Story:** En tant qu'utilisateur mobile, je veux que chaque bouton de la barre soit facile à appuyer, afin d'éviter les erreurs de navigation sur petit écran.

#### Acceptance Criteria

1. THE BottomNav SHALL définir une zone de touche minimale de 44 × 44 px pour chaque raccourci, conformément aux recommandations WCAG 2.5.5.
2. THE BottomNav SHALL attribuer un attribut `aria-label` explicite à chaque raccourci décrivant sa destination (ex. `"Accueil"`, `"Catalogue"`, `"Panier"`, `"Mon compte"`, `"Historique"`).
3. THE BottomNav SHALL attribuer `aria-current="page"` au raccourci correspondant à la route active.
4. THE BottomNav SHALL utiliser des icônes accompagnées d'un label textuel court pour chaque raccourci.

---

### Requirement 6 : Adaptation du contenu principal

**User Story:** En tant qu'utilisateur mobile, je veux que le contenu de la page ne soit pas masqué derrière la barre de navigation, afin de pouvoir lire l'intégralité de la page.

#### Acceptance Criteria

1. THE ClientLayout SHALL ajouter un padding inférieur au contenu principal (`<main>`) égal à la hauteur du BottomNav (64 px) lorsque la largeur de l'écran est inférieure à 768 px, afin d'éviter que le contenu soit masqué.
2. THE Footer SHALL rester visible au-dessus du BottomNav, le padding inférieur du `<main>` assurant que le Footer n'est pas recouvert.
