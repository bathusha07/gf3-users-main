import { NotFoundError } from '../types';
import BaseDomainError from './BaseDomainError';

export default class SubresourceNotFound extends BaseDomainError implements NotFoundError {
  public name: string;
  public constructor(
    public resourceName: string,
    public resourceId: number | string,
    statusCode = 422,
  ) {
    super(`${resourceName} with ID: ${resourceId} not found`, statusCode);
    this.name = this.constructor.name;
  }
}
