const { Pool } = require('pg');

// Configuration de la connexion à la base de données
const pool = new Pool({
    user: 'postgres', // Remplacez par votre utilisateur PostgreSQL
    host: 'localhost',         // Adresse de votre serveur PostgreSQL
    database: 'yam_dev',    // Nom de votre base de données
    password: 'root', // Mot de passe de l'utilisateur
    port: 5435,                // Port par défaut de PostgreSQL
});

// Fonction pour exécuter des requêtes
const query = async (text, params) => {
    const client = await pool.connect();
    try {
        return await client.query(text, params);
    } catch (err) {
        console.error('Erreur lors de l\'exécution de la requête', err.stack);
        throw err;
    } finally {
        client.release();
    }
};

module.exports = { query };