import BaseDomainError from './BaseDomainError';

export default class SubscriptionInvalidStateTransition extends BaseDomainError {
  public name: string;
  public constructor(subscriptionType: string, currentState: string, event: string) {
    super(
      `${subscriptionType} type subscription in state ${currentState} is not allowed to transition with ${event}`,
    );
    this.name = this.constructor.name;
  }
}
