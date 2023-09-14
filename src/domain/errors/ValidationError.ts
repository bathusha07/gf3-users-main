import BaseDomainError from './BaseDomainError';

export default class ValidationError extends BaseDomainError {
  public name: string;
  public constructor(message: string, statusCode = 422) {
    super(message, statusCode);
    this.name = this.constructor.name;
  }
}
