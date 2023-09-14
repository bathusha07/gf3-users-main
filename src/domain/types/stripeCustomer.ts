import { StripeCustomerEntity, StripeCustomerId, UserId } from '@makegoodfood/gf3-types';

export interface StripeCustomerBehaviour {
  createStripeCustomer: (userId: UserId) => Promise<StripeCustomerEntity>;
  anonymizeStripeCustomer: (userId: UserId) => Promise<void>;
}

export interface StripeCustomerRepository {
  createStripeCustomer: (
    stripeCustomerToCreate: StripeCustomerEntity,
  ) => Promise<StripeCustomerEntity>;
  getStripeCustomerByUserId: (userId: UserId) => Promise<StripeCustomerEntity | null>;
  getStripeCustomerByStripeId: (stripeId: StripeCustomerId) => Promise<StripeCustomerEntity | null>;
  anonymizeStripeCustomer: (stripeId: StripeCustomerId) => Promise<void>;
}
