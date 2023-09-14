import { TYPE_MEMBERSHIP, TYPE_SCHEDULED } from '@makegoodfood/gf3-types';
import faker from 'faker';
import UserComposite from '../../src/domain/user/UserComposite';
import generateAddress from './address';
import generatePreference from './preference';
import generateSubscription from './subscription';
import generateUser from './user';

const generateUserComposite = (options?: Partial<UserComposite>): UserComposite => {
  const user = generateUser();
  const addresses = [
    generateAddress({ user_id: user.id, is_default: true }),
    ...Array.from(
      {
        length: faker.datatype.number({
          min: 1,
          max: 3,
        }),
      },
      () => generateAddress({ user_id: user.id, is_default: false }),
    ),
  ];

  const subscriptions = [
    ...Array.from(
      {
        length: faker.datatype.number({
          min: 1,
          max: 2,
        }),
      },
      () => generateSubscription({ user_id: user.id, subscription_type: TYPE_SCHEDULED }),
    ),
    ...Array.from(
      {
        length: faker.datatype.number({
          min: 1,
          max: 2,
        }),
      },
      () => generateSubscription({ user_id: user.id, subscription_type: TYPE_MEMBERSHIP }),
    ),
  ];

  const preferences = [
    ...Array.from(
      {
        length: faker.datatype.number({
          min: 1,
          max: 2,
        }),
      },
      () => generatePreference({ user_id: user.id, subscription_id: null }),
    ),
    ...Array.from(
      {
        length: faker.datatype.number({
          min: 1,
          max: 2,
        }),
      },
      () => generatePreference({ user_id: user.id, subscription_id: faker.datatype.uuid() }),
    ),
  ];

  return new UserComposite({
    user: user,
    addresses: addresses,
    subscriptions: subscriptions,
    preferences: preferences,
    ...options,
  });
};

export const generateEmptyUserComposite = (options?: Partial<UserComposite>): UserComposite => {
  const user = generateUser();
  return new UserComposite({
    user: user,
    addresses: [],
    subscriptions: [],
    preferences: [],
    ...options,
  });
};

export default generateUserComposite;
