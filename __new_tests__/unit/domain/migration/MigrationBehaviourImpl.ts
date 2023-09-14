import { mock, mockClear } from 'jest-mock-extended';
import {
  DayOfWeek,
  SubscriptionState,
  STATE_ACTIVE,
  TYPE_MEMBERSHIP,
  TYPE_SCHEDULED,
} from '@makegoodfood/gf3-types';
import MigrationBehaviourImpl from '../../../../src/domain/migration/MigrationBehaviourImpl';
import {
  AddressRepository,
  AgreementRepository,
  CardRepository,
  MembershipRepository,
  StripeCustomerRepository,
  SubscriptionRepository,
  TermsRepository,
  UserBehaviour,
  UserRepository,
  PreferenceRepository,
} from '../../../../src/domain/types';
import SubresourceNotFound from '../../../../src/domain/errors/SubresourceNotFound';
import generateAddress from '../../../factories/address';
import generateAgreement from '../../../factories/agreement';
import generateCard from '../../../factories/card';
import generateMembership from '../../../factories/membership';
import generateStripeCustomer from '../../../factories/stripeCustomer';
import generateSubscription from '../../../factories/subscription';
import generateTerms from '../../../factories/terms';
import generateUser from '../../../factories/user';
import generateUserOutput from '../../../factories/userOutput';

describe('MigrationBehaviourImpl', () => {
  const dummyUser = generateUser();
  const dummyUserOutput = generateUserOutput({ ...dummyUser });
  const dummyPreference = ['beef', 'spicy_food'];
  const dummyMigrationInput = {
    user: dummyUser,
    address: generateAddress(),
    card: {
      stripe_card_id: 'card_testxtest',
      stripe_customer_id: 'cus_testytest',
      stripe_card_token: '00598dbd-9d81-4994-880c-4679bf748448',
    },
    mealkitSubscription: {
      gf3_subscription_id: null,
      ip_address: '1.1.1.1',
      started_at: new Date(),
      plan_id: '36fcc118-3aad-4983-af25-bf00606a8a0e',
      delivery_day: 'WEDNESDAY' as DayOfWeek,
      is_afterhours: false,
      coupon_code: 'GETITCHEAP',
      state: STATE_ACTIVE as SubscriptionState,
    },
    wowSubscription: {
      gf3_subscription_id: null,
      ip_address: '1.1.1.1',
      state: STATE_ACTIVE as SubscriptionState,
      started_at: new Date(),
    },
    preference: dummyPreference,
  };

  const mocks = {
    addressRepository: mock<AddressRepository>({
      createAddress: jest.fn(() => Promise.resolve(generateAddress())),
      getUserAddresses: jest.fn(() => Promise.resolve([])),
    }),
    agreementRepository: mock<AgreementRepository>({
      createAgreement: jest.fn(() => Promise.resolve(generateAgreement())),
    }),
    cardRepository: mock<CardRepository>({
      createCard: jest.fn(() => Promise.resolve(generateCard())),
      getUserCards: jest.fn(() => Promise.resolve([])),
      setUserDefaultCard: jest.fn(() => Promise.resolve()),
    }),
    membershipRepository: mock<MembershipRepository>({
      getMembershipByCode: jest.fn(() => Promise.resolve(generateMembership())),
    }),
    stripeCustomerRepository: mock<StripeCustomerRepository>({
      createStripeCustomer: jest.fn(),
      getStripeCustomerByUserId: jest.fn(() => Promise.resolve(null)),
    }),
    subscriptionRepository: mock<SubscriptionRepository>({
      createSubscription: jest.fn(() => Promise.resolve(generateSubscription())),
      getUserSubscriptions: jest.fn(() => Promise.resolve([])),
    }),
    termsRepository: mock<TermsRepository>({
      getTermsByName: jest.fn(() => Promise.resolve(generateTerms())),
    }),
    userBehaviour: mock<UserBehaviour>({
      findMatchingUser: jest.fn(() => Promise.resolve(null)),
      getUser: jest.fn(() => Promise.resolve(dummyUserOutput)),
    }),
    userRepository: mock<UserRepository>({
      createUser: jest.fn(() => Promise.resolve(dummyUser)),
    }),
    preferenceRepository: mock<PreferenceRepository>({}),
  };

  describe('migrateUser', () => {
    beforeEach(() => {
      Object.values(mocks).forEach(mockClear);
    });

    test('it should not create resources that already exist except for subscriptions', async () => {
      const dummyScheduledSubscription = generateSubscription({
        subscription_type: TYPE_SCHEDULED,
        state: STATE_ACTIVE,
      });
      const localMocks = {
        ...mocks,
        addressRepository: mock<AddressRepository>({
          ...mocks.addressRepository,
          getUserAddresses: jest.fn(() => Promise.resolve([generateAddress()])),
        }),
        cardRepository: mock<CardRepository>({
          ...mocks.cardRepository,
          getUserCards: jest.fn(() => Promise.resolve([generateCard()])),
        }),
        stripeCustomerRepository: mock<StripeCustomerRepository>({
          ...mocks.stripeCustomerRepository,
          getStripeCustomerByUserId: jest.fn(() => Promise.resolve(generateStripeCustomer())),
        }),
        subscriptionRepository: mock<SubscriptionRepository>({
          ...mocks.subscriptionRepository,
          getUserSubscriptions: jest
            .fn()
            .mockReturnValueOnce(Promise.resolve([dummyScheduledSubscription]))
            .mockReturnValueOnce(
              Promise.resolve([generateSubscription({ subscription_type: TYPE_MEMBERSHIP })]),
            ),
        }),
        userBehaviour: mock<UserBehaviour>({
          ...mocks.userBehaviour,
          findMatchingUser: jest.fn(() => Promise.resolve(dummyUser)),
        }),
      };

      const migrationBehaviour = new MigrationBehaviourImpl(localMocks);
      await migrationBehaviour.migrateUser(dummyMigrationInput);

      expect(localMocks.userRepository.createUser).not.toHaveBeenCalled();
      expect(localMocks.addressRepository.createAddress).not.toHaveBeenCalled();
      expect(localMocks.stripeCustomerRepository.createStripeCustomer).not.toHaveBeenCalled();
      expect(localMocks.cardRepository.createCard).not.toHaveBeenCalled();
      expect(localMocks.agreementRepository.createAgreement).toHaveBeenCalled();
      expect(localMocks.subscriptionRepository.createSubscription).toHaveBeenCalled();
    });

    test('it should not create a card if card data not passed', async () => {
      const { card, ...dummyInputWithoutCard } = dummyMigrationInput;
      const migrationBehaviour = new MigrationBehaviourImpl(mocks);
      await migrationBehaviour.migrateUser(dummyInputWithoutCard);
      expect(mocks.cardRepository.createCard).not.toHaveBeenCalled();
    });

    test('it should not create wow or mealkit subscriptions if subscription data not passed', async () => {
      const {
        mealkitSubscription,
        wowSubscription,
        ...dummyInputWithoutWowSubscription
      } = dummyMigrationInput;
      const migrationBehaviour = new MigrationBehaviourImpl(mocks);
      await migrationBehaviour.migrateUser(dummyInputWithoutWowSubscription);
      expect(mocks.subscriptionRepository.createSubscription).not.toHaveBeenCalled();
    });

    test('it should throw an error if the wow-monthly membership does not exist', async () => {
      const localMocks = {
        ...mocks,
        membershipRepository: mock<MembershipRepository>({
          ...mocks.membershipRepository,
          getMembershipByCode: jest.fn(() => Promise.resolve(null)),
        }),
      };
      const migrationBehaviour = new MigrationBehaviourImpl(localMocks);

      await expect(migrationBehaviour.migrateUser(dummyMigrationInput)).rejects.toThrowError(
        SubresourceNotFound,
      );
    });

    test('it should create all resources and return the result of getUser if successful', async () => {
      const migrationBehaviour = new MigrationBehaviourImpl(mocks);
      const got = await migrationBehaviour.migrateUser(dummyMigrationInput);

      expect(got).toStrictEqual(dummyUserOutput);
      expect(mocks.userRepository.createUser).toHaveBeenCalled();
      expect(mocks.addressRepository.createAddress).toHaveBeenCalled();
      expect(mocks.stripeCustomerRepository.createStripeCustomer).toHaveBeenCalled();
      expect(mocks.cardRepository.createCard).toHaveBeenCalled();
      expect(mocks.cardRepository.setUserDefaultCard).toHaveBeenCalled();
      expect(mocks.agreementRepository.createAgreement).toHaveBeenCalled();
      expect(mocks.subscriptionRepository.createSubscription).toHaveBeenCalledTimes(2);
    });
  });
});
