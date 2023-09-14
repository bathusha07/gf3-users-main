import { PrismaClient } from '@prisma/client';
import DeleteNotAllowed from '../../../domain/errors/DeleteNotAllowed';

const HARD_DELETE_EXCEPTIONS = ['Preference'];

const applySoftDeleteMiddleware = (prisma: PrismaClient): void => {
  prisma.$use(async (params, next) => {
    if (
      (params.action == 'delete' || params.action == 'deleteMany') &&
      params.model &&
      !HARD_DELETE_EXCEPTIONS.includes(params.model)
    ) {
      throw new DeleteNotAllowed();
    }
    return next(params);
  });
};

export default applySoftDeleteMiddleware;
