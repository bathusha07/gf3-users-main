import { PrismaClient } from '@prisma/client';
import ResourceNotFound from '../../domain/errors/ResourceNotFound';
import Terms from '../../domain/terms/Terms';
import { TermsRepository } from '../../domain/types';
import { TermsEntity, TermsId } from '@makegoodfood/gf3-types';

export default class PrismaTermsRepository implements TermsRepository {
  public prismaClient: PrismaClient;
  private resourceName = Terms.name;

  public constructor({ prismaClient }: { prismaClient: PrismaClient }) {
    this.prismaClient = prismaClient;
  }

  public getTerms = async (id: TermsId): Promise<TermsEntity> => {
    const terms = await this.prismaClient.terms.findUnique({
      where: { id },
    });
    if (!terms) {
      throw new ResourceNotFound(this.resourceName, id);
    }
    return terms;
  };

  public getTermsByName = async (name: string): Promise<TermsEntity> => {
    const terms = await this.prismaClient.terms.findFirst({
      where: { name },
    });
    if (!terms) {
      throw new ResourceNotFound(this.resourceName, name);
    }
    return terms;
  };
}
