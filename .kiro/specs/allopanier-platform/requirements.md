# Requirements Document

## Introduction

AlloPanier est une plateforme de commerce électronique et de livraison à domicile destinée au marché béninois. Elle permet aux particuliers, familles, restaurants, hôtels et entreprises de commander des produits du quotidien et d'être livrés à domicile selon un calendrier de livraison défini. La plateforme est composée de trois espaces : l'Application Client (mobile), l'Application Livreur (mobile) et l'Administration Web. Le paiement s'effectue uniquement à la livraison en espèces pour la première version.

Les polices d'interface utilisateur sont **Poppins** et **Century Gothic**. Les termes utilisés dans ce document (Application_Client, Application_Livreur, Administration_Web, Client, Livreur, Administrateur, Panier, Commande, Mission, Tournée, Catalogue, Stock, Favoris, Créneau, Reçu, Commission, FCFA, GPS, Système) sont définis dans le glossaire en fin de document.

## Requirements

### Requirement 1: Inscription du Client

**User Story:** En tant que nouvel utilisateur, je veux créer un compte sur l'Application_Client, afin de pouvoir commander des produits et être livré à domicile.

#### Acceptance Criteria

1. THE Application_Client SHALL afficher un formulaire d'inscription contenant les champs : Nom, Prénom, Numéro de téléphone, Mot de passe et Confirmation du mot de passe.
2. WHEN le Client soumet le formulaire d'inscription, THE Application_Client SHALL valider que tous les champs obligatoires sont remplis avant de créer le compte.
3. WHEN le Client saisit un numéro de téléphone déjà enregistré, THE Application_Client SHALL afficher un message d'erreur indiquant que ce numéro est déjà associé à un compte existant.
4. WHEN le Mot de passe et la Confirmation du mot de passe ne correspondent pas, THE Application_Client SHALL afficher un message d'erreur demandant au Client de les faire correspondre.
5. WHEN le formulaire d'inscription est valide et soumis, THE Application_Client SHALL créer le compte et rediriger le Client vers l'étape de saisie de l'adresse de livraison.

### Requirement 2: Adresse de livraison

**User Story:** En tant que Client, je veux enregistrer mon adresse de livraison via GPS, recherche ou épingle sur carte, afin que les livreurs puissent me retrouver facilement.

#### Acceptance Criteria

1. THE Application_Client SHALL permettre au Client de saisir son adresse de livraison lors de l'inscription ou ultérieurement depuis son profil.
2. WHEN le Client choisit l'option "Utiliser ma position actuelle", THE Application_Client SHALL récupérer les coordonnées GPS du terminal mobile et pré-remplir les champs Commune, Quartier et Coordonnées GPS.
3. WHEN le Client choisit l'option "Rechercher une adresse", THE Application_Client SHALL afficher un champ de recherche connecté à Google Maps permettant de trouver et sélectionner une adresse.
4. WHEN le Client choisit l'option "Déplacer l'épingle", THE Application_Client SHALL afficher une carte interactive permettant de positionner manuellement une épingle pour désigner l'adresse de livraison.
5. THE Application_Client SHALL enregistrer les informations suivantes pour chaque adresse : Commune, Quartier, Repère (point remarquable facultatif) et Coordonnées GPS (latitude, longitude).
6. IF la récupération des coordonnées GPS échoue, THEN THE Application_Client SHALL afficher un message d'erreur et proposer les alternatives de saisie manuelle ou par carte.

### Requirement 3: Connexion du Client

**User Story:** En tant que Client enregistré, je veux me connecter à l'Application_Client manuellement ou automatiquement, afin d'accéder à mon compte et à mes commandes.

#### Acceptance Criteria

1. THE Application_Client SHALL proposer une connexion manuelle par saisie du numéro de téléphone et du mot de passe.
2. WHEN le Client se connecte avec des identifiants valides, THE Application_Client SHALL maintenir la session active et permettre la reconnexion automatique lors des ouvertures suivantes.
3. WHEN le Client saisit un numéro de téléphone ou un mot de passe incorrect, THE Application_Client SHALL afficher un message d'erreur générique sans préciser lequel des deux champs est erroné.
4. WHILE une session active est mémorisée sur le terminal, THE Application_Client SHALL connecter automatiquement le Client sans demander ses identifiants.

### Requirement 4: Navigation dans le Catalogue

**User Story:** En tant que Client, je veux parcourir un catalogue organisé par catégories et sous-catégories, afin de trouver facilement les produits que je souhaite commander.

#### Acceptance Criteria

1. THE Application_Client SHALL organiser les produits dans les catégories suivantes : Agroalimentaire, Épicerie, Boissons, Produits frais, Électroménager, Lumière et Énergie, Technologie.
2. THE Application_Client SHALL organiser la catégorie Agroalimentaire en sous-catégories : Céréales, Condiments, Fruits et légumes, Produits alimentaires divers.
3. THE Application_Client SHALL organiser la catégorie Produits frais en sous-catégories : Produits de la mer, Produits d'élevage.
4. WHEN le Client consulte la fiche d'un produit, THE Application_Client SHALL afficher : une grande photo, le Nom, le Prix unitaire, le Prix de gros (si applicable), la Quantité de gros (si applicable) et le Stock disponible.
5. WHEN le Stock d'un produit est égal à zéro, THE Application_Client SHALL afficher ce produit comme indisponible et désactiver le bouton d'ajout au Panier.
6. WHERE un produit de la catégorie Agroalimentaire a une disponibilité définie par l'Administrateur, THE Application_Client SHALL afficher le statut de disponibilité sur la fiche produit.

### Requirement 5: Recherche avec auto-complétion

**User Story:** En tant que Client, je veux une recherche intelligente avec auto-complétion, afin de trouver rapidement un produit sans connaître son nom exact.

#### Acceptance Criteria

1. THE Application_Client SHALL proposer un champ de recherche accessible depuis toutes les pages du Catalogue.
2. WHEN le Client saisit au moins 2 caractères dans le champ de recherche, THE Application_Client SHALL afficher des suggestions de produits correspondant au nom saisi en moins de 500 ms.
3. THE Application_Client SHALL effectuer la recherche sur le nom du produit et sur la catégorie du produit.
4. WHEN le Client saisit "vent", THE Application_Client SHALL inclure dans les suggestions tous les produits dont le nom contient la chaîne "vent" tels que Ventilateur rechargeable, Ventilateur mural et Ventilateur solaire.
5. IF la recherche ne retourne aucun résultat, THEN THE Application_Client SHALL afficher un message indiquant qu'aucun produit ne correspond à la recherche et proposer des catégories de navigation alternatives.

### Requirement 6: Gestion du Panier

**User Story:** En tant que Client, je veux gérer mon panier d'achats, afin de préparer et ajuster ma commande avant de la valider.

#### Acceptance Criteria

1. THE Application_Client SHALL permettre au Client d'ajouter un produit au Panier depuis la fiche produit ou depuis les résultats de recherche.
2. THE Application_Client SHALL afficher dans le Panier : la liste des articles, les quantités, le prix unitaire par article, le montant sous-total et les frais de livraison estimés.
3. WHEN le Client modifie la quantité d'un article dans le Panier, THE Application_Client SHALL recalculer immédiatement le montant total et les frais de livraison.
4. WHEN le Client supprime un article du Panier, THE Application_Client SHALL retirer cet article et recalculer le montant total.
5. WHEN le Panier est vide, THE Application_Client SHALL afficher un message indiquant que le panier est vide et proposer un lien vers le Catalogue.

### Requirement 7: Choix du Créneau de livraison

**User Story:** En tant que Client, je veux choisir un jour et un créneau horaire de livraison lors de la validation de ma commande, afin d'être livré au moment qui me convient.

#### Acceptance Criteria

1. WHEN le Client valide son Panier, THE Application_Client SHALL proposer la sélection d'un jour de livraison parmi : Mardi, Jeudi, Samedi, Dimanche.
2. THE Application_Client SHALL proposer deux Créneaux de livraison pour chaque jour : Matin de 08h00 à 12h00 et Après-midi de 14h00 à 18h00.
3. THE Application_Client SHALL calculer et afficher les frais de livraison en fonction du poids total de la commande selon le barème pour la zone Abomey-Calavi : poids inférieur ou égal à 100 kg correspond à 1 000 FCFA ; poids de 100 kg à 250 kg correspond à 1 500 FCFA ; poids de 250 kg à 350 kg correspond à 2 000 FCFA ; poids de 350 kg à 450 kg correspond à 2 500 FCFA ; poids de 450 kg à 550 kg correspond à 3 000 FCFA ; poids de 550 kg à 650 kg correspond à 3 500 FCFA ; poids supérieur à 650 kg correspond à 3 500 FCFA majoré de 500 FCFA par tranche complète de 100 kg au-delà de 650 kg.
4. THE Application_Client SHALL afficher un récapitulatif de commande contenant : les articles, les quantités, le montant total produits, les frais de livraison, le montant total à payer, l'adresse de livraison et le Créneau choisi.
5. WHEN le Client confirme la commande, THE Application_Client SHALL enregistrer la commande avec un numéro unique, la date, le statut En attente et les informations du Créneau sélectionné.

### Requirement 8: Paiement à la livraison

**User Story:** En tant que Client, je veux payer ma commande en espèces à la livraison, afin de régler le montant total au moment de la réception de mes produits.

#### Acceptance Criteria

1. THE Application_Client SHALL indiquer clairement lors de la passation de commande que le seul mode de paiement disponible est le paiement en espèces à la livraison.
2. WHEN le Livreur remet les produits au Client, THE Application_Livreur SHALL permettre au Livreur d'enregistrer le montant encaissé couvrant les produits et les frais de livraison.
3. WHEN le paiement est enregistré par le Livreur, THE Application_Livreur SHALL mettre à jour le statut de la Commande à Livrée et payée.

### Requirement 9: Historique des commandes

**User Story:** En tant que Client, je veux consulter l'historique de mes commandes, afin de suivre mes achats passés et leur statut.

#### Acceptance Criteria

1. THE Application_Client SHALL afficher une section Historique des commandes listant toutes les commandes passées par le Client.
2. THE Application_Client SHALL afficher pour chaque commande : le numéro de commande, la date de commande, la liste des produits commandés, le montant total et le statut courant.
3. THE Application_Client SHALL afficher les statuts possibles suivants pour une commande : En attente, Confirmée, En cours de livraison, Livrée et payée, Annulée.

### Requirement 10: Rechargement d'une commande passée

**User Story:** En tant que Client, je veux recharger une commande passée dans mon panier, afin de gagner du temps lors de commandes récurrentes.

#### Acceptance Criteria

1. WHEN le Client sélectionne l'option Commander à nouveau sur une commande de son historique, THE Application_Client SHALL charger les articles de cette commande dans un nouveau Panier.
2. THE Application_Client SHALL permettre au Client d'ajouter, retirer ou modifier les quantités des articles chargés avant de valider la nouvelle commande.
3. WHEN un article de la commande rechargée n'est plus disponible en stock, THE Application_Client SHALL indiquer cet article comme indisponible dans le Panier et permettre au Client de le supprimer.

### Requirement 11: Gestion des Favoris

**User Story:** En tant que Client, je veux enregistrer mes produits préférés dans une liste de Favoris, afin de les retrouver rapidement à chaque ouverture de l'application.

#### Acceptance Criteria

1. THE Application_Client SHALL permettre au Client de marquer ou démarquer un produit comme favori depuis la fiche produit.
2. WHEN le Client ouvre l'Application_Client, THE Application_Client SHALL afficher en premier la liste des produits Favoris du Client avant les autres sections de navigation.
3. THE Application_Client SHALL permettre au Client d'ajouter directement un produit favori au Panier depuis la liste des Favoris.
4. WHEN le Client supprime un produit de ses Favoris, THE Application_Client SHALL retirer ce produit de la liste des Favoris sans affecter les commandes en cours.

### Requirement 12: Connexion du Livreur

**User Story:** En tant que Livreur, je veux me connecter à l'Application_Livreur avec des identifiants créés par l'Administrateur, afin d'accéder à mes missions de livraison.

#### Acceptance Criteria

1. THE Application_Livreur SHALL proposer un écran de connexion par saisie d'identifiant et de mot de passe.
2. WHEN le Livreur saisit des identifiants valides créés par l'Administrateur, THE Application_Livreur SHALL ouvrir la session et afficher le tableau de bord du Livreur.
3. WHEN le Livreur saisit des identifiants invalides, THE Application_Livreur SHALL afficher un message d'erreur générique sans révéler lequel des deux champs est incorrect.
4. THE Administration_Web SHALL être le seul canal par lequel les comptes Livreur peuvent être créés.

### Requirement 13: Gestion des Missions et itinéraires

**User Story:** En tant que Livreur, je veux consulter mes missions, mes commandes et mes itinéraires, afin d'effectuer mes livraisons de manière organisée.

#### Acceptance Criteria

1. THE Application_Livreur SHALL afficher la liste des Missions affectées au Livreur connecté, triées par date et Créneau de livraison.
2. WHEN le Livreur sélectionne une Mission, THE Application_Livreur SHALL afficher la liste des Commandes associées avec l'adresse de chaque Client et le montant à encaisser.
3. THE Application_Livreur SHALL intégrer Google Maps pour afficher l'itinéraire de livraison pour chaque Mission.
4. WHEN le Livreur confirme la livraison d'une Commande, THE Application_Livreur SHALL enregistrer l'heure de confirmation et mettre à jour le statut de la Commande.
5. WHEN le Livreur enregistre un paiement reçu, THE Application_Livreur SHALL calculer et afficher le montant de la Commission correspondante.

### Requirement 14: Gestion des produits du Catalogue

**User Story:** En tant qu'Administrateur, je veux créer et gérer les produits du Catalogue, afin de maintenir une offre à jour et correctement paramétrée.

#### Acceptance Criteria

1. THE Administration_Web SHALL permettre à l'Administrateur de créer un produit en renseignant : Photo, Nom, Catégorie et sous-catégorie le cas échéant, Description, Prix unitaire, Prix de gros facultatif, Quantité de gros facultative, Conditionnement comprenant Quantité plus Type parmi Sachet, Carton ou Sac plus Prix unitaire plus Prix de gros, Quantité en stock et Stock minimum d'alerte.
2. WHERE le produit appartient à la catégorie Agroalimentaire, THE Administration_Web SHALL permettre à l'Administrateur de définir un statut de disponibilité pour ce produit.
3. WHEN la Quantité en stock d'un produit atteint ou passe en dessous du Stock minimum d'alerte, THE Administration_Web SHALL afficher une alerte visible dans le tableau de bord de l'Administrateur.
4. THE Administration_Web SHALL permettre à l'Administrateur de modifier ou désactiver un produit existant.
5. WHEN un produit est désactivé par l'Administrateur, THE Application_Client SHALL cesser d'afficher ce produit dans le Catalogue et dans les résultats de recherche.

### Requirement 15: Gestion des stocks

**User Story:** En tant qu'Administrateur, je veux gérer les stocks de chaque produit, afin de garantir que les Clients ne commandent pas des produits indisponibles.

#### Acceptance Criteria

1. WHEN une Commande est confirmée, THE Système SHALL décrémenter automatiquement la Quantité en stock de chaque produit commandé selon les quantités réservées.
2. WHEN une Commande est annulée, THE Système SHALL réincrémenter la Quantité en stock des produits correspondants.
3. THE Administration_Web SHALL afficher en temps réel la Quantité en stock de chaque produit.
4. WHEN la Quantité en stock d'un produit atteint zéro, THE Système SHALL marquer automatiquement ce produit comme indisponible dans l'Application_Client.

### Requirement 16: Création des Missions de livraison

**User Story:** En tant qu'Administrateur, je veux visualiser les commandes sur une carte et créer des Missions de livraison, afin d'optimiser les tournées et affecter les Livreurs efficacement.

#### Acceptance Criteria

1. THE Administration_Web SHALL afficher sur une carte interactive toutes les Commandes en attente de Mission, avec une épingle positionnée aux coordonnées GPS de chaque Client.
2. THE Administration_Web SHALL permettre à l'Administrateur de regrouper les Commandes par zone géographique sur la carte.
3. WHEN l'Administrateur sélectionne un ensemble de Commandes sur la carte, THE Administration_Web SHALL permettre de créer une Mission et d'affecter cette Mission à un Livreur et à un véhicule.
4. WHEN une Mission est créée et affectée, THE Application_Livreur SHALL rendre la Mission visible pour le Livreur concerné.

### Requirement 17: Gestion des comptes Livreurs

**User Story:** En tant qu'Administrateur, je veux créer et gérer les comptes Livreurs, afin de contrôler l'accès à l'Application_Livreur et suivre leurs performances.

#### Acceptance Criteria

1. THE Administration_Web SHALL permettre à l'Administrateur d'ajouter un nouveau Livreur en renseignant : Nom, Prénom, Numéro de téléphone et Mot de passe initial.
2. THE Administration_Web SHALL permettre à l'Administrateur de modifier les informations d'un Livreur existant.
3. THE Administration_Web SHALL permettre à l'Administrateur de désactiver un compte Livreur, empêchant toute connexion ultérieure sur l'Application_Livreur.
4. THE Administration_Web SHALL afficher l'historique des livraisons effectuées par chaque Livreur.

### Requirement 18: Calcul automatique des Commissions

**User Story:** En tant qu'Administrateur, je veux que les commissions des Livreurs soient calculées automatiquement, afin de faciliter leur rémunération et de disposer de rapports précis.

#### Acceptance Criteria

1. WHEN une livraison est validée par le Livreur, THE Système SHALL calculer automatiquement la Commission due au Livreur selon le barème de commissions défini dans l'Administration_Web.
2. THE Administration_Web SHALL afficher l'historique des gains de chaque Livreur, détaillant la Commission par livraison.
3. THE Administration_Web SHALL générer un rapport journalier des Commissions par Livreur.

### Requirement 19: Tableau de bord Administrateur

**User Story:** En tant qu'Administrateur, je veux disposer d'un tableau de bord centralisé, afin de surveiller et gérer l'ensemble des activités de la plateforme.

#### Acceptance Criteria

1. THE Administration_Web SHALL afficher un tableau de bord présentant des indicateurs clés : nombre de commandes du jour, chiffre d'affaires du jour, nombre de livraisons en cours, nombre de livraisons terminées et alertes de stock.
2. THE Administration_Web SHALL permettre à l'Administrateur de gérer depuis le tableau de bord : les produits, les catégories, les stocks, les commandes, les clients, les livreurs, les véhicules et les tournées.
3. THE Administration_Web SHALL afficher des statistiques de ventes filtrables par période : jour, semaine ou mois.

### Requirement 20: Génération du Reçu imprimable

**User Story:** En tant qu'Administrateur ou Livreur, je veux générer un reçu imprimable pour chaque commande livrée, afin de le remettre au Client et de l'associer au colis.

#### Acceptance Criteria

1. WHEN une Commande est confirmée comme livrée, THE Système SHALL générer un Reçu contenant : le numéro de commande, la date et le Créneau de livraison, la liste des produits avec quantités et prix unitaires, le montant total produits, les frais de livraison et le montant total payé.
2. THE Administration_Web SHALL permettre à l'Administrateur d'imprimer le Reçu d'une Commande au format papier.
3. THE Application_Livreur SHALL permettre au Livreur d'accéder au Reçu d'une Commande depuis le détail de la Mission.

### Requirement 21: Interface simple et accessible

**User Story:** En tant qu'utilisateur de la plateforme, je veux une interface simple et accessible, afin de pouvoir utiliser AlloPanier même avec une faible expérience des outils numériques.

#### Acceptance Criteria

1. THE Système SHALL utiliser les polices Poppins et Century Gothic pour l'ensemble des interfaces de la plateforme incluant l'Application_Client, l'Application_Livreur et l'Administration_Web.
2. THE Application_Client SHALL afficher des étiquettes de texte lisibles accompagnant chaque icône de navigation pour faciliter la compréhension des personnes peu habituées aux interfaces numériques.
3. THE Application_Client SHALL adapter son affichage aux résolutions d'écran des smartphones Android et iOS les plus courants sur le marché béninois.
4. THE Système SHALL afficher tous les prix et montants en FCFA en appliquant un séparateur de milliers pour la lisibilité.


---

## Glossary

- **Application_Client** : Application mobile destinée aux clients finaux pour parcourir, commander et suivre leurs livraisons.
- **Application_Livreur** : Application mobile destinée aux livreurs pour gérer leurs missions et confirmer les livraisons.
- **Administration_Web** : Interface web destinée aux administrateurs pour gérer l'ensemble de la plateforme.
- **Client** : Utilisateur enregistré sur l'Application_Client.
- **Livreur** : Agent de livraison dont le compte est créé par l'Administrateur.
- **Administrateur** : Gestionnaire de la plateforme ayant accès à l'Administration_Web.
- **Panier** : Ensemble d'articles sélectionnés par le Client avant de passer commande.
- **Commande** : Ensemble de produits validés par le Client et prêts à être livrés.
- **Mission** : Ensemble de commandes regroupées et affectées à un Livreur pour une tournée.
- **Tournée** : Itinéraire optimisé regroupant plusieurs livraisons dans une même zone géographique.
- **FCFA** : Franc CFA, monnaie utilisée au Bénin.
- **GPS** : Système de positionnement global utilisé pour localiser les adresses de livraison.
- **Système** : La plateforme AlloPanier dans son ensemble (Application_Client, Application_Livreur et Administration_Web).
- **Catalogue** : Ensemble des produits disponibles à la vente sur la plateforme.
- **Stock** : Quantité disponible d'un produit dans le Catalogue.
- **Favoris** : Liste de produits marqués comme préférés par le Client.
- **Créneau** : Plage horaire de livraison choisie par le Client (matin ou après-midi).
- **Reçu** : Document récapitulatif imprimable d'une commande livrée.
- **Commission** : Montant calculé automatiquement et versé au Livreur après validation d'une livraison.
