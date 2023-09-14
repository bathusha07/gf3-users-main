import BaseDomainError from './BaseDomainError';

export const UNEXPECTED_RESPONSE = 'Unexpected response from remote service.';

export default class ServiceError extends BaseDomainError {
  public name: string;
  public constructor(
    serviceName: string,
    public message: string,
    statusCode = 500,
    meta: unknown = undefined,
  ) {
    super(message, statusCode, meta);
    this.name = this.constructor.name;
    this.message = `${serviceName} service error: ${message}`;
  }
}
