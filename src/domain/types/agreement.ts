import { AgreementId, AgreementInput, AgreementEntity } from '@makegoodfood/gf3-types';

export interface AgreementBehaviour {
  createAgreement: (input: AgreementInput) => Promise<AgreementEntity>;
}

export interface AgreementRepository {
  createAgreement: (agreement: AgreementInput) => Promise<AgreementEntity>;
  getAgreement: (id: AgreementId) => Promise<AgreementEntity>;
  getMatchingAgreement: (agreement: AgreementInput) => Promise<AgreementEntity | null>;
  exists: (id: AgreementId) => Promise<boolean>;
}
