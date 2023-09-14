import { UserOutput } from '@makegoodfood/gf3-types';
import generateUser from './user';

export const generateUserOutput = (options?: Partial<UserOutput>): UserOutput => {
  const user = generateUser();
  return {
    ...user,
    default_postal_code: 'H2X 2S1',
    address_ids: [],
    addresses: [],
    membership_subscription_ids: [],
    scheduled_subscription_ids: [],
    subscriptions: [],
    carts: [],
    preference_tags: [],
    ...options,
  };
};

export default generateUserOutput;
