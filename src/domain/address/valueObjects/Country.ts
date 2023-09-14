import ValueObjectValidationError from '../../errors/ValueObjectValidationError';
import { Country } from '../../types';

const ALLOWED_COUNTRY_CODES = ['CA'];

export default class CountryValueObject implements Country {
  private code: string;

  public constructor(code: string) {
    this.code = this.validateCode(code);
  }

  public getCode(): string {
    return this.code;
  }

  private validateCode(code: string): string {
    if (!ALLOWED_COUNTRY_CODES.includes(code)) {
      throw new ValueObjectValidationError(
        `Invalid country code. Code must be one of: ${ALLOWED_COUNTRY_CODES.toString()}`,
      );
    }

    return code;
  }
}
