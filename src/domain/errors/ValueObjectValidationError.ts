import BaseDomainError from './BaseDomainError';

export default class ValueObjectValidationError extends BaseDomainError {
  public name: string;
  public constructor(public message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
