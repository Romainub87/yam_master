import dotenv from 'dotenv';

import { PrismaClient } from '@prisma/client';

dotenv.config({path: '../.env'});

const db = new PrismaClient();

export default db;
