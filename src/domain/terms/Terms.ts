import { TermsEntity } from '@makegoodfood/gf3-types';

export default class Terms implements TermsEntity {
  public id: string;
  public name: string;

  public constructor(terms: TermsEntity) {
    this.id = terms.id;
    this.name = terms.name;
  }
}
