import BaseDomainError from './BaseDomainError';

export default class EntityInstantiationError extends BaseDomainError {
  public name: string;
  public constructor(public message: string, public entityName: string) {
    super(message);
    this.entityName = entityName;
    this.name = this.constructor.name;
  }
}
