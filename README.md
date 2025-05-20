# Documentation technique du projet

## Stack technique

Le projet utilise les technologies suivantes:

- **React Native** & **Expo**: Développement d’applications mobiles multiplateformes (iOS/Android).
- **Node.js**: Environnement d’exécution pour le backend.
- **SQL**: Base de données relationnelle (PostgreSQL).
- **npm**: Gestionnaire de paquets.
- **Prisma**: ORM pour la gestion de la base de données.

## Lancer le projet

### Cloner le dépôt

```bash
git clone https://github.com/Romainub87/yam_master.git
cd yam_master
```


### 1. Installation des dépendances

```bash
npm install
cd backend
npm install
```

### 2. Configuration de la base de données

Lancer le conteneur docker

```bash
docker compose up -d
```
Renseignez les variables d’environnement dans **.env**.

Générez le schéma et appliquez les migrations:

```bash
cd backend
npm run generate:postgres
npm run migrate:postgres
```

### 3. Démarrage des serveurs
Lancer le serveuur front:

```bash
npm run start
```
Lancer le serveur backend:

```bash
cd backend
npm run dev
```

## Architecture du projet
- **app/**: Application mobile avec routage basé sur les fichiers.
- **assets/**: Ressources statiques (images, polices).
- **components/**: Composants réutilisables de l’application.
- **hooks/**: Hooks personnalisés pour la gestion de l’état et des effets.
- **context/**: Contexte React pour la gestion de l’état global.
- **backend/**: API REST, logique métier, accès à la base de données via Prisma.
- **prisma/**: Modèle de données et migrations pour la base de données.
- **.env**: Variables d’environnement pour la configuration de l’application.
- **.env.example**: Exemple de fichier d’environnement.