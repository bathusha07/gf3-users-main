import { mock, mockClear } from 'jest-mock-extended';
import UserBehaviourImpl from '../../../../src/domain/user/UserBehaviourImpl';
import {
  PubsubProducer,
  SubscriptionProductFetcher,
  TranslationLayerService,
  UserRepository,
} from '../../../../src/domain/types';
import generatePlan from '../../../factories/plan';
import generateUser from '../../../factories/user';
import generateUserComposite, {
  generateEmptyUserComposite,
} from '../../../factories/userComposite';
import { CartStatus, CartType } from '@makegoodfood/gf3-types';
import UniqueConstraintError from '../../../../src/domain/errors/UniqueConstraintError';
import generateSubscription from '../../../factories/subscription';
import InvalidUpdateError from '../../../../src/domain/errors/InvalidUpdateError';
import { ANONYMIZED_USER_PREFIX } from '../../../../src/domain/user/constants';
import { FirebaseService } from '../../../../src/domain/types/firebase';
import { FirebaseError } from 'firebase-admin/lib/utils/error';

describe('UserBehaviourImpl', () => {
  const dummyAgentId = 'c5e9a287-75fc-47bf-b071-cd9e42334ace';
  const dummyUser = generateUser();
  const { id: dummyId, ...dummyUserInput } = dummyUser;
  const dummyCreateUserInput = { ...dummyUserInput, fsa: 'H2T' };
  const dummyUpdateUserInput = { email: 'new@example.com' };

  const mocks = {
    pubsubProducer: mock<PubsubProducer>(),
    subscriptionProductFetcher: mock<SubscriptionProductFetcher>({
      getSubscriptionProduct: jest.fn().mockReturnValue(generatePlan()),
    }),
    translationLayerService: mock<TranslationLayerService>(),
    userRepository: mock<UserRepository>(),
    firebaseService: mock<FirebaseService>(),
  };

  afterEach(() => {
    Object.values(mocks).forEach(mockClear);
  });

  describe('cancelUser', () => {
    const dummyGf2CancellationSelections = {
      reason_id: 2,
      notes: 'Dummy notes',
    };

    test('it should cancel the user via both the translation layer and user repository', async () => {
      const userBehaviourImpl = new UserBehaviourImpl(mocks);
      void (await userBehaviourImpl.cancelUser(dummyId, dummyGf2CancellationSelections));

      expect(mocks.translationLayerService.cancelUser).toBeCalledTimes(1);
    });

    test('it should send the agent ID to the translation layer if passed', async () => {
      const userBehaviourImpl = new UserBehaviourImpl(mocks);
      void (await userBehaviourImpl.cancelUser(
        dummyId,
        dummyGf2CancellationSelections,
        dummyAgentId,
      ));
      expect(mocks.translationLayerService.cancelUser).toBeCalledWith(
        dummyId,
        dummyGf2CancellationSelections,
        dummyAgentId,
      );
    });
  });

  describe('getUser', () => {
    test('Returned payload should contain base user fields plus relations', async () => {
      const activeScheduledSubscription = generateSubscription({
        state: 'ACTIVE',
        subscription_type: 'SCHEDULED',
      });
      const cancelledScheduledSubscription = generateSubscription({
        state: 'CANCELLED',
        subscription_type: 'SCHEDULED',
      });
      const activeMembershipSubscription = generateSubscription({
        state: 'TRIAL',
        subscription_type: 'MEMBERSHIP',
      });
      const cancellationMembershipSubscription = generateSubscription({
        state: 'CANCELLATION',
        subscription_type: 'MEMBERSHIP',
      });
      const dummyUserComposite = generateUserComposite({
        subscriptions: [
          activeScheduledSubscription,
          cancelledScheduledSubscription,
          activeMembershipSubscription,
          cancellationMembershipSubscription,
        ],
      });
      const dummyAbridgedCarts = [
        {
          id: '1234',
          delivery_date: '2021-01-01 00:00:00',
          type: 'STANDARD' as CartType,
          status: 'ACTIVE' as CartStatus,
          item_count: 3,
        },
        {
          id: '4321',
          delivery_date: '2021-02-10 00:00:00',
          type: 'CURATED' as CartType,
          status: 'ACTIVE' as CartStatus,
          item_count: 12,
        },
      ];

      const expectedOutput = {
        ...dummyUserComposite.user,
        default_postal_code: dummyUserComposite.addresses[0].postal_code,
        addresses: dummyUserComposite.addresses,
        address_ids: dummyUserComposite.addresses.map((address) => address.id),
        subscriptions: [
          /* eslint-disable @typescript-eslint/no-unsafe-assignment */
          { ...activeScheduledSubscription, product: expect.anything() },
          { ...activeMembershipSubscription, product: expect.anything() },
          /* eslint-enable @typescript-eslint/no-unsafe-assignment */
        ],
        membership_subscription_ids: [activeMembershipSubscription.id],
        scheduled_subscription_ids: [activeScheduledSubscription.id],
        carts: dummyAbridgedCarts,
        preference_tags: dummyUserComposite.preferences
          .filter((preference) => preference.subscription_id === null)
          .map((preference) => preference.tag),
      };
      const localMocks = {
        ...mocks,
        userRepository: mock<UserRepository>({
          getUserComposite: jest.fn(() => Promise.resolve(dummyUserComposite)),
        }),
        translationLayerService: mock<TranslationLayerService>({
          getUserCarts: jest.fn(() => Promise.resolve(dummyAbridgedCarts)),
        }),
      };
      const userBehaviour = new UserBehaviourImpl(localMocks);
      const userOutput = await userBehaviour.getUser(dummyUserComposite.user.id);
      expect(userOutput).toStrictEqual(expectedOutput);
    });

    test('User with no relations should return empty arrays', async () => {
      const dummyUserComposite = generateEmptyUserComposite();
      const expectedOutput = {
        ...dummyUserComposite.user,
        default_postal_code: null,
        address_ids: [],
        addresses: [],
        membership_subscription_ids: [],
        scheduled_subscription_ids: [],
        subscriptions: [],
        carts: [],
        preference_tags: [],
      };
      const localMocks = {
        ...mocks,
        userRepository: mock<UserRepository>({
          getUserComposite: jest.fn(() => Promise.resolve(dummyUserComposite)),
        }),
        translationLayerService: mock<TranslationLayerService>({
          getUserCarts: jest.fn(() => Promise.resolve([])),
        }),
      };
      const userBehaviour = new UserBehaviourImpl(localMocks);
      const userOutput = await userBehaviour.getUser(dummyUserComposite.user.id);
      expect(userOutput).toStrictEqual(expectedOutput);
    });
  });

  describe('createUser', () => {
    beforeEach(() => {
      Object.values(mocks).forEach(mockClear);
    });
    test('Return matching user if exists', async () => {
      mocks.userRepository = mock<UserRepository>({
        getMatchingUser: jest.fn(() => Promise.resolve(dummyUser)),
      });
      const userBehaviour = new UserBehaviourImpl(mocks);
      const createdUser = await userBehaviour.createUser(dummyCreateUserInput);
      expect(createdUser).toStrictEqual(dummyUser);
    });

    test('Return created user complete with id in uuid format', async () => {
      mocks.userRepository = mock<UserRepository>({
        getMatchingUser: jest.fn(() => Promise.resolve(null)),
        createUser: jest.fn((userToCreate) => Promise.resolve(userToCreate)),
      });
      const userBehaviour = new UserBehaviourImpl(mocks);
      const createdUser = await userBehaviour.createUser(dummyCreateUserInput);
      expect(createdUser.id).toMatch(
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      );
      expect(createdUser).toStrictEqual({ id: createdUser.id, ...dummyUserInput });
    });

    test('Throw unique exception if email exists', async () => {
      mocks.userRepository = mock<UserRepository>({
        getMatchingUser: jest.fn(() => Promise.resolve(null)),
        emailExists: jest.fn(() => Promise.resolve(true)),
      });
      const userBehaviour = new UserBehaviourImpl(mocks);
      expect(mocks.translationLayerService.createGf2User).toBeCalledTimes(0);
      await expect(userBehaviour.createUser(dummyCreateUserInput)).rejects.toThrowError(
        UniqueConstraintError,
      );
    });

    test('Throw unique exception if firebaseId exists', async () => {
      mocks.userRepository = mock<UserRepository>({
        getMatchingUser: jest.fn(() => Promise.resolve(null)),
        emailExists: jest.fn(() => Promise.resolve(false)),
        firebaseIdExists: jest.fn(() => Promise.resolve(true)),
      });
      const userBehaviour = new UserBehaviourImpl(mocks);
      expect(mocks.translationLayerService.createGf2User).toBeCalledTimes(0);
      await expect(userBehaviour.createUser(dummyCreateUserInput)).rejects.toThrowError(
        UniqueConstraintError,
      );
    });
  });

  describe('updateUser', () => {
    beforeEach(() => {
      Object.values(mocks).forEach(mockClear);
    });

    test('If existing user matches update, return existing user as is', async () => {
      mocks.userRepository = mock<UserRepository>({
        getUser: jest.fn(() => Promise.resolve(dummyUser)),
      });
      const userBehaviour = new UserBehaviourImpl(mocks);
      const updatedUser = await userBehaviour.updateUser(dummyId, dummyUserInput);
      expect(updatedUser).toStrictEqual(dummyUser);
    });

    test('Update user should only send the fields that changed to translation layer', async () => {
      mocks.userRepository = mock<UserRepository>({
        getUser: jest.fn(() => Promise.resolve(dummyUser)),
        updateUser: jest.fn(() => Promise.resolve({ ...dummyUser, ...dummyUpdateUserInput })),
      });
      const userBehaviour = new UserBehaviourImpl(mocks);
      void (await userBehaviour.updateUser(dummyId, dummyUpdateUserInput));
      expect(mocks.translationLayerService.updateGf2User).toBeCalledWith(
        {
          id: dummyUser.id,
          ...dummyUpdateUserInput,
        },
        undefined,
        undefined,
        undefined,
      );
    });

    test('Update user send the agentId to translation layer if passed', async () => {
      const dummyAgentId = '57a236ee-2ea5-4329-a0c1-c0805d2401cf';
      mocks.userRepository = mock<UserRepository>({
        getUser: jest.fn(() => Promise.resolve(dummyUser)),
        updateUser: jest.fn(() => Promise.resolve({ ...dummyUser, ...dummyUpdateUserInput })),
      });
      const userBehaviour = new UserBehaviourImpl(mocks);
      void (await userBehaviour.updateUser(dummyId, dummyUpdateUserInput, dummyAgentId));
      expect(mocks.translationLayerService.updateGf2User).toBeCalledWith(
        {
          id: dummyUser.id,
          ...dummyUpdateUserInput,
        },
        undefined,
        undefined,
        dummyAgentId,
      );
    });

    test('Return updated user with modified fields', async () => {
      const dummyUpdatedUser = generateUser();
      const { id: dummyUserUpdateId, ...dummyUserUpdateInput } = dummyUpdatedUser;
      mocks.userRepository = mock<UserRepository>({
        getUser: jest.fn(() => Promise.resolve(generateUser())),
        updateUser: jest.fn(() => Promise.resolve(dummyUpdatedUser)),
      });
      const userBehaviour = new UserBehaviourImpl(mocks);
      const updatedUser = await userBehaviour.updateUser(dummyUserUpdateId, dummyUserUpdateInput);
      expect(updatedUser).toStrictEqual(dummyUpdatedUser);
    });
  });

  describe('anonymizeUser', () => {
    test('should anonymize a non-anonymized user', async () => {
      mocks.userRepository = mock<UserRepository>({
        getUser: jest.fn(() => Promise.resolve(dummyUser)),
        anonymizePersonalData: jest.fn(() => Promise.resolve()),
      });
      const userBehaviour = new UserBehaviourImpl(mocks);
      await userBehaviour.anonymizeUser(dummyUser.id);
      expect(mocks.userRepository.getUser).toHaveBeenCalledWith(dummyUser.id);
      expect(mocks.userRepository.anonymizePersonalData).toHaveBeenCalled();
    });

    test('Should throw InvalidUpdateError for an already anonymized user', async () => {
      const anonymizedFBid = `${ANONYMIZED_USER_PREFIX}${dummyUser.firebase_id}`;
      mocks.userRepository = mock<UserRepository>({
        getUser: jest.fn(() => Promise.resolve({ ...dummyUser, firebase_id: anonymizedFBid })),
        anonymizePersonalData: jest.fn(() => Promise.resolve()),
      });
      const userBehaviour = new UserBehaviourImpl(mocks);
      const attemptToAnonymize = async () => {
        await userBehaviour.anonymizeUser(dummyId);
      };
      await expect(attemptToAnonymize).rejects.toThrow(InvalidUpdateError);
    });

    test('Should throw FirebaseError if there is a problem with deleting firebase user', async () => {
      mocks.userRepository = mock<UserRepository>({
        getUser: jest.fn(() => Promise.resolve(dummyUser)),
        anonymizePersonalData: jest.fn(() => Promise.resolve()),
      });
      mocks.firebaseService = mock<FirebaseService>({
        deleteUser: jest.fn(() =>
          Promise.reject(
            new FirebaseError({ message: 'Firebase Error', code: 'app/firebase-error' }),
          ),
        ),
      });
      const userBehaviour = new UserBehaviourImpl(mocks);
      const attemptToAnonymize = async () => {
        await userBehaviour.anonymizeUser(dummyId);
      };
      await expect(attemptToAnonymize).rejects.toThrow(FirebaseError);
    });
  });
});
