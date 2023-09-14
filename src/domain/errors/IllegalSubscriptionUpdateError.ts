import BaseDomainError from './BaseDomainError';

export default class IllegalSubscriptionUpdateError extends BaseDomainError {
  public name: string;
  public constructor(public subscriptionType: string, fieldName: string) {
    super(`Cannot update field ${fieldName} on a ${subscriptionType} type subscription`);
    this.name = this.constructor.name;
  }
}
