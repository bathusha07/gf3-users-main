import faker from 'faker';
import { SubscriptionEntity, SubscriptionInput, VALID_DAYS } from '@makegoodfood/gf3-types';
import Subscription from '../../src/domain/subscription/Subscription';
import { SubscriptionValue } from '../../src/domain/types';
import generateMembership from './membership';
import generatePlan from './plan';

const generateSubscription = (options?: Partial<SubscriptionEntity>): Subscription => {
  return new Subscription({
    id: faker.datatype.uuid(),
    user_id: faker.datatype.uuid(),
    card_id: faker.datatype.uuid(),
    address_id: faker.datatype.uuid(),
    agreement_id: faker.datatype.number(),
    state: faker.random.arrayElement([
      'ACTIVE',
      'CANCELLATION',
      'TRIAL',
      'TRIAL_ENDED',
      'UNPAID',
      'CANCELLED',
      'PAUSED',
      'SUSPENDED',
    ]),
    subscription_type: faker.random.arrayElement(['SCHEDULED', 'PRODUCT', 'MEMBERSHIP']),
    product_id: faker.datatype.uuid(),
    frequency_type: faker.random.arrayElement(['DAY', 'MONTH', 'YEAR']),
    frequency_value: faker.datatype.number(),
    next_cycle: faker.date.future(),
    send_notification: faker.datatype.boolean(),
    started_at: faker.date.past(),
    ...options,
  });
};

export const generateSubscriptionInput = (
  options?: Partial<SubscriptionInput>,
): SubscriptionInput => {
  return {
    user_id: faker.datatype.uuid(),
    card_id: faker.datatype.uuid(),
    address_id: faker.datatype.uuid(),
    subscription_type: faker.random.arrayElement(['SCHEDULED', 'PRODUCT', 'MEMBERSHIP']),
    product_id: faker.datatype.uuid(),
    send_notification: faker.datatype.boolean(),
    terms_id: faker.datatype.uuid(),
    ip_address: faker.internet.ip(),
    ...options,
  };
};

export const generateMembershipSubscriptionValue = (
  options?: Partial<SubscriptionValue>,
): SubscriptionValue => {
  return {
    createValues: {
      state: faker.random.arrayElement(['ACTIVE', 'TRIAL']),
      product_id: faker.datatype.uuid(),
      frequency_type: faker.random.arrayElement(['DAY', 'MONTH', 'YEAR']),
      frequency_value: faker.datatype.number(),
      next_cycle: faker.date.future(),
      delivery_day: null,
    },
    product: generateMembership(),
    ...options,
  };
};

export const generateScheduledSubscriptionValue = (
  options?: Partial<SubscriptionValue>,
): SubscriptionValue => {
  return {
    createValues: {
      state: 'ACTIVE',
      product_id: faker.datatype.uuid(),
      frequency_type: faker.random.arrayElement(['DAY', 'MONTH', 'YEAR']),
      frequency_value: faker.datatype.number(),
      next_cycle: faker.date.future(),
      delivery_day: faker.random.arrayElement(VALID_DAYS),
    },
    product: generatePlan(),
    ...options,
  };
};

export default generateSubscription;
