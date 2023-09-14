import { PrismaClient } from '@prisma/client';
import Agreement from '../../domain/agreement/Agreement';
import ResourceNotFound from '../../domain/errors/ResourceNotFound';
import { AgreementRepository, TermsRepository } from '../../domain/types';
import { AgreementEntity, AgreementId, AgreementInput } from '@makegoodfood/gf3-types';

export default class PrismaAgreementRepository implements AgreementRepository {
  public prismaClient: PrismaClient;
  public termsRepository: TermsRepository;
  private resourceName = Agreement.name;

  public constructor({
    prismaClient,
    termsRepository,
  }: {
    prismaClient: PrismaClient;
    termsRepository: TermsRepository;
  }) {
    this.prismaClient = prismaClient;
    this.termsRepository = termsRepository;
  }

  public createAgreement = async (createAgreement: AgreementInput): Promise<AgreementEntity> => {
    const { user_id, terms_id, ip_address } = createAgreement;

    const created = await this.prismaClient.agreement.create({
      data: {
        user_id,
        terms_id,
        ip_address,
      },
      include: {
        terms: true,
      },
    });

    return new Agreement(created);
  };

  public exists = async (id: AgreementId): Promise<boolean> => {
    const count = await this.prismaClient.agreement.count({
      where: { id },
    });
    return count > 0;
  };

  public getAgreement = async (id: AgreementId): Promise<AgreementEntity> => {
    const agreement = await this.prismaClient.agreement.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      include: {
        terms: true,
      },
    });

    if (!agreement) {
      throw new ResourceNotFound(this.resourceName, id);
    }

    return new Agreement(agreement);
  };

  public getMatchingAgreement = async (
    agreement: AgreementInput,
  ): Promise<AgreementEntity | null> => {
    const matching = await this.prismaClient.agreement.findFirst({
      where: {
        terms_id: agreement.terms_id,
        user_id: agreement.user_id,
        ip_address: agreement.ip_address,
        deleted_at: null,
      },
      include: {
        terms: true,
      },
    });

    if (!matching) {
      return null;
    }

    return new Agreement(matching);
  };
}
