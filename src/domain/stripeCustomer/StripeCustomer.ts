import { StripeCustomerEntity, StripeCustomerId, UserId } from '@makegoodfood/gf3-types';

export default class StripeCustomer implements StripeCustomerEntity {
  public user_id: UserId;
  public stripe_customer_id: StripeCustomerId;

  public constructor({ user_id, stripe_customer_id }: StripeCustomerEntity) {
    this.user_id = user_id;
    this.stripe_customer_id = stripe_customer_id;
  }
}
