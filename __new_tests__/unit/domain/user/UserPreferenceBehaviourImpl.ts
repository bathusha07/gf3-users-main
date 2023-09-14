import { mock, mockClear } from 'jest-mock-extended';
import PreferenceBehaviourImpl from '../../../../src/domain/user/PreferenceBehaviourImpl';
import {
  PreferenceEntity,
  SubscriptionEntity,
  TYPE_MEMBERSHIP,
  TYPE_SCHEDULED,
} from '@makegoodfood/gf3-types';
import {
  UserRepository,
  SubscriptionRepository,
  PreferenceRepository,
  AddressRepository,
  SubscriptionMessagePublisher,
  TranslationLayerService,
} from '../../../../src/domain/types';
import generateUser from '../../../factories/user';
import generateSubscription from '../../../factories/subscription';
import generatePreference from '../../../factories/preference';
import BaseDomainError from '../../../../src/domain/errors/BaseDomainError';
import generateAddress from '../../../factories/address';

describe('UserPreferenceBehaviourImpl', () => {
  const dummyUser = generateUser();
  const userSubscription = generateSubscription({ user_id: dummyUser.id });
  const otherSubscription = generateSubscription();
  const dummyAddress = generateAddress();

  let dummySubscription: SubscriptionEntity;

  let existingPreferences: PreferenceEntity[];

  const mocks = {
    userRepository: mock<UserRepository>({
      getUser: jest.fn(() => Promise.resolve(dummyUser)),
    }),
    subscriptionRepository: mock<SubscriptionRepository>({
      getSubscription: jest.fn(() => Promise.resolve(dummySubscription)),
    }),
    preferenceRepository: mock<PreferenceRepository>({
      getByUserIdAndSubscriptionId: jest.fn(() => Promise.resolve(existingPreferences)),
      upsert: jest.fn(({ toInsert }) =>
        Promise.resolve([...existingPreferences, ...(toInsert as PreferenceEntity[])]),
      ),
    }),
    addressRepository: mock<AddressRepository>({
      getAddress: jest.fn(() => Promise.resolve(dummyAddress)),
    }),
    subscriptionMessagePublisher: mock<SubscriptionMessagePublisher>(),
    translationLayerService: mock<TranslationLayerService>({
      updateUserPreferences: jest.fn(() => Promise.resolve()),
    }),
  };
  const userPreferenceBehaviour = new PreferenceBehaviourImpl(mocks);

  beforeEach(() => {
    dummySubscription = userSubscription;
    existingPreferences = [];
  });

  afterEach(() => {
    Object.values(mocks).forEach(mockClear);
  });

  describe('updatePreferences', () => {
    test('should throw an error when given a subscription that does not belong to the given user', async () => {
      dummySubscription = otherSubscription;
      const input = {
        userId: dummyUser.id,
        subscriptionId: otherSubscription.id,
        tags: ['lamb'],
      };
      const attemptToUpdate = async () => {
        await userPreferenceBehaviour.upsert(input);
      };
      await expect(attemptToUpdate).rejects.toThrow(BaseDomainError);
      expect(mocks.translationLayerService.updateUserPreferences).toBeCalledTimes(0);
    });

    test('should insert a user-level preference at user level', async () => {
      const input = {
        userId: dummyUser.id,
        subscriptionId: null,
        tags: ['lamb'],
      };
      void (await userPreferenceBehaviour.upsert(input));
      const updateCallArg = mocks.preferenceRepository.upsert.mock.calls[0][0];
      expect(updateCallArg.toInsert.length).toEqual(1);
      expect(updateCallArg.toInsert[0].user_id).toEqual(dummyUser.id);
      expect(updateCallArg.toInsert[0].subscription_id).toBeNull();
      expect(mocks.translationLayerService.updateUserPreferences).toBeCalledTimes(1);
    });

    test('should insert a subscription-level preference at subscription level', async () => {
      const input = {
        userId: dummyUser.id,
        subscriptionId: dummySubscription.id,
        tags: ['lamb'],
      };
      void (await userPreferenceBehaviour.upsert(input));
      const updateCallArg = mocks.preferenceRepository.upsert.mock.calls[0][0];
      expect(updateCallArg.toInsert.length).toEqual(1);
      expect(updateCallArg.toInsert[0].user_id).toEqual(dummyUser.id);
      expect(updateCallArg.toInsert[0].subscription_id).toEqual(dummySubscription.id);
    });

    test('should insert all preferences, given there are none existing', async () => {
      const input = {
        userId: dummyUser.id,
        subscriptionId: dummySubscription.id,
        tags: ['lamb', 'pre-cut'],
      };
      void (await userPreferenceBehaviour.upsert(input));
      const updateCallArg = mocks.preferenceRepository.upsert.mock.calls[0][0];
      expect(updateCallArg.toInsert.length).toEqual(2);
      expect(updateCallArg.toInsert[0].tag).toEqual('lamb');
      expect(updateCallArg.toInsert[1].tag).toEqual('pre-cut');
    });

    test('should only insert preferences that are not existing', async () => {
      existingPreferences = [generatePreference()];
      const input = {
        userId: dummyUser.id,
        subscriptionId: dummySubscription.id,
        tags: [existingPreferences[0].tag, 'pre-cut'],
      };
      void (await userPreferenceBehaviour.upsert(input));
      const updateCallArg = mocks.preferenceRepository.upsert.mock.calls[0][0];
      expect(updateCallArg.toInsert.length).toEqual(1);
      expect(updateCallArg.toInsert[0].tag).toEqual('pre-cut');
    });

    test('should delete existing preference that is not in input set', async () => {
      existingPreferences = [generatePreference()];
      const input = {
        userId: dummyUser.id,
        subscriptionId: dummySubscription.id,
        tags: ['pre-cut'],
      };
      void (await userPreferenceBehaviour.upsert(input));
      const updateCallArg = mocks.preferenceRepository.upsert.mock.calls[0][0];
      expect(updateCallArg.toDelete.length).toEqual(1);
      expect(updateCallArg.toDelete[0].tag).toEqual(existingPreferences[0].tag);
    });

    test('if subscription_id is set and is SCHEDULED subscription, it publishes a preference updated event', async () => {
      const dummyScheduledSubscription = generateSubscription({
        subscription_type: TYPE_SCHEDULED,
        user_id: dummyUser.id,
      });
      const input = {
        userId: dummyUser.id,
        subscriptionId: dummyScheduledSubscription.id,
        tags: ['VEG'],
      };

      mocks.subscriptionRepository.getSubscription.mockResolvedValueOnce(
        dummyScheduledSubscription,
      );
      void (await userPreferenceBehaviour.upsert(input));
      expect(mocks.subscriptionMessagePublisher.dispatchCurationJob).toBeCalledWith(
        expect.objectContaining({
          subscription: dummyScheduledSubscription,
          address: dummyAddress,
          preferences: expect.arrayContaining([...existingPreferences]) as unknown,
        }),
      );
    });

    test('if subscription_id is not set, it does not publish an event', async () => {
      const input = {
        userId: dummyUser.id,
        subscriptionId: null,
        tags: ['VEG'],
      };
      void (await userPreferenceBehaviour.upsert(input));
      expect(mocks.subscriptionMessagePublisher.dispatchCurationJob).toBeCalledTimes(0);
    });

    test('if subscription is not scheduled then it does not publish an event', async () => {
      const dummyScheduledSubscription = generateSubscription({
        subscription_type: TYPE_MEMBERSHIP,
        user_id: dummyUser.id,
      });
      const input = {
        userId: dummyUser.id,
        subscriptionId: dummyScheduledSubscription.id,
        tags: ['VEG'],
      };

      mocks.subscriptionRepository.getSubscription.mockResolvedValueOnce(
        dummyScheduledSubscription,
      );
      void (await userPreferenceBehaviour.upsert(input));
      expect(mocks.subscriptionMessagePublisher.dispatchCurationJob).toBeCalledTimes(0);
    });
  });

  describe('getPreferences', () => {
    test('user-level call should request user-level preferences', async () => {
      void (await userPreferenceBehaviour.get(dummyUser.id, null));
      const getCallArgs = mocks.preferenceRepository.getByUserId.mock.calls[0];
      expect(getCallArgs).toEqual([dummyUser.id]);
    });

    test('subscription-level call should request subscription-level preferences', async () => {
      void (await userPreferenceBehaviour.get(dummyUser.id, dummySubscription.id));
      const getCallArgs = mocks.preferenceRepository.getByUserIdAndSubscriptionId.mock.calls[0];
      expect(getCallArgs).toEqual([dummyUser.id, dummySubscription.id]);
    });
  });
});
