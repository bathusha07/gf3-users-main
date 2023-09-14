import { DomainError } from '../types';

export default class BaseDomainError extends Error implements DomainError {
  public constructor(
    public message: string,
    public statusCode: number = 422,
    public meta: unknown = undefined,
  ) {
    super(message);

    this.meta = meta;
    this.name = this.constructor.name;
    this.message = message;
    this.statusCode = statusCode;
  }
}
