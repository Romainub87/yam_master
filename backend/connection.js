import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Charger .env.local si disponible, sinon .env
dotenv.config({ path: '.env.local' });

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
});

export default {
    query: (text, params) => pool.query(text, params),
};