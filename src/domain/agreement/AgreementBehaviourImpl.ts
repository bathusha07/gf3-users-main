import { AgreementBehaviour, AgreementRepository } from '../types/agreement';
import { AgreementEntity, AgreementInput } from '@makegoodfood/gf3-types';

export default class AgreementBehaviourImpl implements AgreementBehaviour {
  protected agreementRepository: AgreementRepository;

  public constructor({ agreementRepository }: { agreementRepository: AgreementRepository }) {
    this.agreementRepository = agreementRepository;
  }

  public createAgreement = async (input: AgreementInput): Promise<AgreementEntity> => {
    const matchingAgreement = await this.agreementRepository.getMatchingAgreement(input);
    if (matchingAgreement) {
      return matchingAgreement;
    }

    return await this.agreementRepository.createAgreement(input);
  };
}
