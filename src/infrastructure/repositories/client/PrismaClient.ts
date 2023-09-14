import { PrismaClient } from '@prisma/client';
import applySoftDeleteMiddleware from './SoftDeleteMiddleware';

const prisma = new PrismaClient();
applySoftDeleteMiddleware(prisma);

export default prisma;
