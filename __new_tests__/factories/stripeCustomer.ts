import faker from 'faker';
import { StripeCustomerEntity } from '@makegoodfood/gf3-types';
import StripeCustomer from '../../src/domain/stripeCustomer/StripeCustomer';

const generateStripeCustomer = (options?: Partial<StripeCustomerEntity>): StripeCustomer => {
  return new StripeCustomer({
    user_id: faker.datatype.uuid(),
    stripe_customer_id: 'cus_' + faker.random.alphaNumeric(14),
    ...options,
  });
};

export default generateStripeCustomer;
