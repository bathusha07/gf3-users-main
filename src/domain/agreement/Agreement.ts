import { AgreementEntity, AgreementId, TermsEntity } from '@makegoodfood/gf3-types';

export default class Agreement implements AgreementEntity {
  public id: AgreementId;
  public terms_id: string;
  public user_id: string;
  public ip_address: string;
  public terms?: TermsEntity;

  public constructor({ id, terms_id, user_id, ip_address, terms }: AgreementEntity) {
    this.id = id;
    this.terms_id = terms_id;
    this.user_id = user_id;
    this.ip_address = ip_address;

    if (terms) {
      this.terms = terms;
    }
  }
}
