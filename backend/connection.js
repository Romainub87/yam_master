const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
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