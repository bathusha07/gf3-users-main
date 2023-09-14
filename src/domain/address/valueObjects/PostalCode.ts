import { PostalCode } from '../../types';

export default class PostalCodeValueObject implements PostalCode {
  private postalCode: string;

  public constructor(postalCode: string) {
    this.postalCode = postalCode;
  }

  public getPostalCode(): string {
    return this.postalCode;
  }

  public getFSA(): string {
    return this.postalCode.substring(0, 3);
  }
}
