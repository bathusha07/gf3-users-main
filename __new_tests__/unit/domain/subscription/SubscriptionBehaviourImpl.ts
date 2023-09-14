import {
  STATE_ACTIVE,
  STATE_TRIAL,
  SubscriptionEntity,
  TYPE_MEMBERSHIP,
  TYPE_SCHEDULED,
} from '@makegoodfood/gf3-types';
import { DayOfWeek } from '@prisma/client';
import { mock, mockClear } from 'jest-mock-extended';
import SubscriptionBehaviourImpl from '../../../../src/domain/subscription/SubscriptionBehaviourImpl';
import {
  AgreementRepository,
  CancellationReasonRepository,
  CartService,
  CatalogService,
  DateBehaviour,
  MembershipRepository,
  PlanFrequencyRepository,
  PubsubProducer,
  SubscriptionMessagePublisher,
  SubscriptionProductFetcher,
  SubscriptionRepository,
  SubscriptionValuesFactory,
  TranslationLayerService,
} from '../../../../src/domain/types';
import generateAddress from '../../../factories/address';
import generateAgreement from '../../../factories/agreement';
import generateCancellationReason from '../../../factories/cancellationReason';
import generateMembership from '../../../factories/membership';
import generatePlan from '../../../factories/plan';
import generatePreference from '../../../factories/preference';
import generateSubscription, {
  generateMembershipSubscriptionValue,
  generateScheduledSubscriptionValue,
  generateSubscriptionInput,
} from '../../../factories/subscription';
import IllegalSubscriptionUpdateError from '../../../../src/domain/errors/IllegalSubscriptionUpdateError';
import ResourceNotFound from '../../../../src/domain/errors/ResourceNotFound';
import SubresourceNotFound from '../../../../src/domain/errors/SubresourceNotFound';
import RecordCreationConflict from '../../../../src/domain/errors/RecordCreationConflict';

type SubscriptionBehaviourImplConstructor = {
  dateBehaviour: DateBehaviour;
  subscriptionRepository: SubscriptionRepository;
  agreementRepository: AgreementRepository;
  membershipRepository: MembershipRepository;
  subscriptionValuesFactory: SubscriptionValuesFactory;
  pubsubProducer: PubsubProducer;
  cartService: CartService;
  catalogService: CatalogService;
  cancellationReasonRepository: CancellationReasonRepository;
  subscriptionMessagePublisher: SubscriptionMessagePublisher;
  translationLayerService: TranslationLayerService;
  planFrequencyRepository: PlanFrequencyRepository;
  subscriptionProductFetcher: SubscriptionProductFetcher;
};

describe('SubscriptionBehaviourImpl', () => {
  const dummyPlan = generatePlan();
  const dummyOldPlanId = 20;
  const dummySubscription = generateSubscription({
    subscription_type: TYPE_SCHEDULED,
    state: 'ACTIVE',
    delivery_day: 'FRIDAY',
    product_id: dummyPlan.id,
    is_afterhours: false,
  });
  const dummySubscriptionComposite = {
    subscription: dummySubscription,
    preferences: [generatePreference(), generatePreference()],
    address: generateAddress(),
  };
  const dummyMembership = generateMembership();
  const dummyAgreement = generateAgreement();
  const dummyNow = new Date();
  const dummyUserId = 'b2d7438f-1ffe-4d01-a7aa-4fded9f6c3a7';
  const dummyAgentId = '57a236ee-2ea5-4329-a0c1-c0805d2401cf';
  const dummyCancellationSelections = [
    {
      subscription_id: dummySubscription.id,
      reason_id: 1,
      edit_value: 'test1',
    },
  ];

  const mocks = {
    dateBehaviour: mock<DateBehaviour>(),
    subscriptionRepository: mock<SubscriptionRepository>({
      createSubscription: jest.fn((x) => Promise.resolve(x)),
      getActiveUserSubscriptions: jest.fn(() => Promise.resolve([dummySubscription])),
      getLastCancelledSubscription: jest.fn(() => Promise.resolve(dummySubscription)),
      getSubscription: jest.fn(() => Promise.resolve(dummySubscription)),
      getSubscriptionComposite: jest.fn(() => Promise.resolve(dummySubscriptionComposite)),
      updateSubscription: jest.fn((x) => Promise.resolve(x)),
    }),
    agreementRepository: mock<AgreementRepository>({
      createAgreement: jest.fn(() => Promise.resolve(generateAgreement())),
    }),
    subscriptionValuesFactory: mock<SubscriptionValuesFactory>(),
    pubsubProducer: mock<PubsubProducer>(),
    cartService: mock<CartService>(),
    catalogService: mock<CatalogService>(),
    cancellationReasonRepository: mock<CancellationReasonRepository>(),
    subscriptionMessagePublisher: mock<SubscriptionMessagePublisher>(),
    subscriptionProductFetcher: mock<SubscriptionProductFetcher>(),
    translationLayerService: mock<TranslationLayerService>(),
    planFrequencyRepository: mock<PlanFrequencyRepository>(),
    membershipRepository: mock<MembershipRepository>(),
  };

  afterEach(() => {
    Object.values(mocks).forEach(mockClear);
  });

  describe('cancelSubscription', () => {
    test('it should forward the Agent UUID to Translation Layer if passed', async () => {
      const localMocks = {
        ...mocks,
        cancellationReasonRepository: mock<CancellationReasonRepository>({
          getReason: jest.fn(() => Promise.resolve(generateCancellationReason())),
        }),
      };
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
      void (await subscriptionBehaviour.cancelSubscription(
        dummySubscription.id,
        dummyCancellationSelections,
        dummyAgentId,
      ));
      expect(mocks.translationLayerService.cancelSubscription).toBeCalledWith(
        dummySubscription,
        dummyAgentId,
      );
    });
  });

  describe('cancelUserSubscriptions', () => {
    test('each subscription is cancelled', async () => {
      const localMocks = {
        ...mocks,
        subscriptionRepository: mock<SubscriptionRepository>({
          getActiveUserSubscriptions: jest.fn(() =>
            Promise.resolve([
              generateSubscription({ state: 'ACTIVE' }),
              generateSubscription({ state: 'ACTIVE' }),
            ]),
          ),
        }),
        cancellationReasonRepository: mock<CancellationReasonRepository>({
          getReason: jest.fn(() =>
            Promise.resolve(
              generateCancellationReason({ id: dummyCancellationSelections[0].reason_id }),
            ),
          ),
        }),
      };
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
      void (await subscriptionBehaviour.cancelUserSubscriptions(
        dummyUserId,
        dummyCancellationSelections,
      ));

      expect(
        localMocks.subscriptionRepository.updateSubscriptionWithCancellationSelections,
      ).toBeCalledTimes(2);
      expect(localMocks.translationLayerService.cancelSubscription).toBeCalledTimes(2);
    });

    test('it should forward the Agent UUID to Translation Layer if passed', async () => {
      const localSubscription = generateSubscription({ state: 'ACTIVE' });
      const localMocks = {
        ...mocks,
        subscriptionRepository: mock<SubscriptionRepository>({
          getActiveUserSubscriptions: jest.fn(() => Promise.resolve([localSubscription])),
        }),
        cancellationReasonRepository: mock<CancellationReasonRepository>({
          getReason: jest.fn(() =>
            Promise.resolve(
              generateCancellationReason({ id: dummyCancellationSelections[0].reason_id }),
            ),
          ),
        }),
      };
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
      void (await subscriptionBehaviour.cancelUserSubscriptions(
        dummyUserId,
        dummyCancellationSelections,
        dummyAgentId,
      ));
      expect(mocks.translationLayerService.cancelSubscription).toBeCalledWith(
        localSubscription,
        dummyAgentId,
      );
    });
  });

  describe('createSubscription', () => {
    describe('membership subscription', () => {
      test('output should include a membership entity as the product', async () => {
        const dummySubscriptionInput = generateSubscriptionInput({
          subscription_type: TYPE_MEMBERSHIP,
        });
        const localMocks = {
          ...mocks,
          subscriptionValuesFactory: mock<SubscriptionValuesFactory>({
            subscriptionValues: jest.fn(() =>
              Promise.resolve(
                generateMembershipSubscriptionValue({
                  product: dummyMembership,
                }),
              ),
            ),
          }),
        };
        const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
        const subscription = await subscriptionBehaviour.createSubscription(dummySubscriptionInput);
        expect(subscription.product).toStrictEqual(dummyMembership);
      });
    });

    test('should throw a RecordCreationConflict error when attempting to duplicate a subscription record', async () => {
      const dummySubscriptionInput = generateSubscriptionInput({
        subscription_type: TYPE_MEMBERSHIP,
      });
      mocks.subscriptionValuesFactory.subscriptionValues.mockImplementationOnce(() =>
        Promise.resolve(
          generateMembershipSubscriptionValue({
            product: dummyMembership,
          }),
        ),
      );
      mocks.subscriptionRepository.createSubscription.mockImplementationOnce(() =>
        Promise.reject(new RecordCreationConflict('Subscription')),
      );
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(mocks);
      const attemptToCreate = async () => {
        await subscriptionBehaviour.createSubscription(dummySubscriptionInput);
      };
      await expect(attemptToCreate).rejects.toThrow(RecordCreationConflict);
    });

    describe('scheduled subscription', () => {
      test('output should include a plan entity as the product', async () => {
        const dummySubscriptionInput = generateSubscriptionInput({
          subscription_type: TYPE_SCHEDULED,
          old_plan_id: 20,
        });
        const localMocks = {
          ...mocks,
          subscriptionValuesFactory: mock<SubscriptionValuesFactory>({
            subscriptionValues: jest.fn(() =>
              Promise.resolve(
                generateScheduledSubscriptionValue({
                  product: dummyPlan,
                }),
              ),
            ),
          }),
        };
        const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
        const subscription = await subscriptionBehaviour.createSubscription(dummySubscriptionInput);
        expect(subscription.product).toStrictEqual(dummyPlan);
      });

      test('should call translation-layer service with old_plan_id and invite_uuid and referrer_id', async () => {
        const invite_uuid = 'uuid';
        const referrer_id = 'referrer_uji';
        const dummySubscriptionInput = generateSubscriptionInput({
          subscription_type: TYPE_SCHEDULED,
          old_plan_id: dummyOldPlanId,
          invite_uuid,
          referrer_id,
        });
        const localMocks = {
          ...mocks,
          subscriptionValuesFactory: mock<SubscriptionValuesFactory>({
            subscriptionValues: jest.fn(() =>
              Promise.resolve(
                generateScheduledSubscriptionValue({
                  product: dummyPlan,
                }),
              ),
            ),
          }),
        };

        const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
        await subscriptionBehaviour.createSubscription(dummySubscriptionInput);
        expect(localMocks.translationLayerService.createScheduledSubscription).toBeCalledWith({
          subscription: expect.anything() as SubscriptionEntity,
          old_plan_id: dummyOldPlanId,
          initial_cycle_date: undefined,
          invite_uuid: invite_uuid,
          referrer_id: referrer_id,
        });
      });
    });
  });

  describe('createSubscriptionFromLastCancelledSubscription', () => {
    test('it throws an exception if no previous subscription exists', async () => {
      const localMocks = {
        ...mocks,
        subscriptionRepository: mock<SubscriptionRepository>({
          getLastCancelledSubscription: jest.fn(() => Promise.resolve(null)),
        }),
      };

      const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
      const attemptToUncancel = async () => {
        await subscriptionBehaviour.createSubscriptionFromLastCancelledSubscription(
          'mock-user-id',
          'SCHEDULED',
          new Date(),
          dummyOldPlanId,
        );
      };
      await expect(attemptToUncancel).rejects.toThrow(ResourceNotFound);
    });

    test('it creates a new SCHEDULED-type subscription both locally and on Translation Layer, and returns it', async () => {
      const dummyLastCancelledSubscription = generateSubscription({
        subscription_type: TYPE_SCHEDULED,
        state: 'CANCELLED',
        delivery_day: 'FRIDAY',
        product_id: dummyPlan.id,
        is_afterhours: false,
        frequency_type: 'DAY',
        frequency_value: 7,
      });
      const localMocks = {
        ...mocks,
        subscriptionRepository: mock<SubscriptionRepository>({
          ...mocks.subscriptionRepository,
          getLastCancelledSubscription: jest.fn(() =>
            Promise.resolve(dummyLastCancelledSubscription),
          ),
        }),
      };
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
      const createdSubscription = await subscriptionBehaviour.createSubscriptionFromLastCancelledSubscription(
        'mock-user-id',
        'SCHEDULED',
        dummyNow,
        dummyOldPlanId,
      );
      expect(mocks.translationLayerService.createScheduledSubscription).toHaveBeenCalledWith({
        subscription: expect.anything() as SubscriptionEntity,
        old_plan_id: dummyOldPlanId,
        initial_cycle_date: undefined,
        invite_uuid: undefined,
        referrer_id: undefined,
      });
      expect(createdSubscription).toMatchObject({
        ...dummyLastCancelledSubscription,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        id: expect.stringMatching(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/),
        started_at: dummyNow,
        state: STATE_ACTIVE,
      });
      expect(createdSubscription.id).not.toEqual(dummySubscription.id);
    });

    test('it always creates a subscription with a weekly cadence', async () => {
      const dummyLastCancelledSubscription = generateSubscription({
        subscription_type: TYPE_SCHEDULED,
        state: 'CANCELLED',
        delivery_day: 'FRIDAY',
        product_id: dummyPlan.id,
        is_afterhours: false,
        frequency_type: 'DAY',
        frequency_value: 14,
      });
      const localMocks = {
        ...mocks,
        subscriptionRepository: mock<SubscriptionRepository>({
          ...mocks.subscriptionRepository,
          getLastCancelledSubscription: jest.fn(() =>
            Promise.resolve(dummyLastCancelledSubscription),
          ),
        }),
      };
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
      const createdSubscription = await subscriptionBehaviour.createSubscriptionFromLastCancelledSubscription(
        'mock-user-id',
        'SCHEDULED',
        dummyNow,
        dummyOldPlanId,
      );
      expect(mocks.translationLayerService.createScheduledSubscription).toHaveBeenCalledWith({
        subscription: expect.anything() as SubscriptionEntity,
        old_plan_id: dummyOldPlanId,
        initial_cycle_date: undefined,
        invite_uuid: undefined,
        referrer_id: undefined,
      });
      expect(createdSubscription).toMatchObject({
        ...dummyLastCancelledSubscription,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        id: expect.stringMatching(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/),
        started_at: dummyNow,
        state: STATE_ACTIVE,
        frequency_value: 7,
      });
      expect(createdSubscription.id).not.toEqual(dummySubscription.id);
    });

    test('it forwards the agent UUID to the Translation Layer if passed', async () => {
      const mockAgentId = '6e63b51b-5407-4410-9c78-793e27aca82d';
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(mocks);
      await subscriptionBehaviour.createSubscriptionFromLastCancelledSubscription(
        'mock-user-id',
        'SCHEDULED',
        dummyNow,
        dummyOldPlanId,
        mockAgentId,
      );
      expect(mocks.translationLayerService.createScheduledSubscription).toHaveBeenCalledWith({
        subscription: expect.anything() as SubscriptionEntity,
        old_plan_id: dummyOldPlanId,
        initial_cycle_date: undefined,
        invite_uuid: undefined,
        referrer_id: undefined,
        agent_id: mockAgentId,
      });
    });

    test('it creates a MEMBERSHIP-type subscription both locally and on Translation Layer, and returns it', async () => {
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(mocks);
      const createdSubscription = await subscriptionBehaviour.createSubscriptionFromLastCancelledSubscription(
        'mock-user-id',
        'MEMBERSHIP',
        dummyNow,
        dummyOldPlanId,
      );
      expect(mocks.translationLayerService.createMembershipSubscription).toHaveBeenCalledWith(
        expect.anything(),
      );
      expect(createdSubscription).toMatchObject({
        ...dummySubscription,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        id: expect.stringMatching(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/),
        started_at: dummyNow,
        state: STATE_ACTIVE,
      });
      expect(createdSubscription.id).not.toEqual(dummySubscription.id);
    });
  });

  describe('getSubscription', () => {
    test('membership subscription should include a membership entity as the product', async () => {
      const dummySubscription = generateSubscription({
        subscription_type: TYPE_MEMBERSHIP,
      });
      const localMocks = {
        ...mocks,
        subscriptionProductFetcher: mock<SubscriptionProductFetcher>({
          getSubscriptionProduct: jest.fn(() => Promise.resolve(dummyMembership)),
        }),
        subscriptionRepository: mock<SubscriptionRepository>({
          getSubscription: jest.fn(() => Promise.resolve(dummySubscription)),
        }),
      };
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
      const subscription = await subscriptionBehaviour.getSubscription(dummySubscription.id);
      expect(localMocks.subscriptionProductFetcher.getSubscriptionProduct).toBeCalledTimes(1);
      expect(subscription.product).toStrictEqual(dummyMembership);
    });

    test('scheduled subscription should include a plan entity as the product', async () => {
      const dummySubscription = generateSubscription({
        subscription_type: TYPE_SCHEDULED,
      });
      const localMocks = {
        ...mocks,
        subscriptionProductFetcher: mock<SubscriptionProductFetcher>({
          getSubscriptionProduct: jest.fn(() => Promise.resolve(dummyPlan)),
        }),
        subscriptionRepository: mock<SubscriptionRepository>({
          getSubscription: jest.fn(() => Promise.resolve(dummySubscription)),
        }),
      };
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
      const subscription = await subscriptionBehaviour.getSubscription(dummySubscription.id);
      expect(localMocks.subscriptionProductFetcher.getSubscriptionProduct).toBeCalledTimes(1);
      expect(subscription.product).toStrictEqual(dummyPlan);
    });
  });

  describe('getSubscriptionMembership', () => {
    test('should throw a SubresourceNotFound error if subscription_type is not MEMBERSHIP', async () => {
      const mockBehaviors: Partial<SubscriptionBehaviourImplConstructor> = ({
        subscriptionRepository: {
          getSubscriptionComposite: jest.fn(() =>
            Promise.resolve({
              subscription: { subscription_type: 'INVALID TYPE' },
            }),
          ),
        },
      } as unknown) as SubscriptionBehaviourImplConstructor;

      const subscriptionBehaviour = new SubscriptionBehaviourImpl(
        mockBehaviors as SubscriptionBehaviourImplConstructor,
      );

      await expect(
        subscriptionBehaviour.getSubscriptionMembership('test-subscription-id'),
      ).rejects.toThrow(SubresourceNotFound);
    });

    test('should throw a SubresourceNotFound error if address is empty', async () => {
      const mockBehaviors: Partial<SubscriptionBehaviourImplConstructor> = ({
        subscriptionRepository: {
          getSubscriptionComposite: jest.fn(() =>
            Promise.resolve({
              subscription: { subscription_type: 'MEMBERSHIP' },
              address: undefined,
            }),
          ),
        },
      } as unknown) as SubscriptionBehaviourImplConstructor;

      const subscriptionBehaviour = new SubscriptionBehaviourImpl(
        mockBehaviors as SubscriptionBehaviourImplConstructor,
      );

      await expect(
        subscriptionBehaviour.getSubscriptionMembership('test-subscription-id'),
      ).rejects.toThrow(SubresourceNotFound);
    });

    test('should call getMembershipCompositeForProvince with the correct parameters', async () => {
      const membershipRepository = {
        getMembershipCompositeForProvince: jest.fn(() => Promise.resolve()),
      };

      const mockBehaviors: Partial<SubscriptionBehaviourImplConstructor> = ({
        subscriptionRepository: {
          getSubscriptionComposite: jest.fn(() =>
            Promise.resolve({
              subscription: { subscription_type: 'MEMBERSHIP', product_id: 'test-product-id' },
              address: { province_code: 'province code' },
            }),
          ),
        },
        membershipRepository,
      } as unknown) as SubscriptionBehaviourImplConstructor;

      const spy = jest.spyOn(membershipRepository, 'getMembershipCompositeForProvince');

      const subscriptionBehaviour = new SubscriptionBehaviourImpl(
        mockBehaviors as SubscriptionBehaviourImplConstructor,
      );

      await subscriptionBehaviour.getSubscriptionMembership('test-subscription-id');

      expect(spy).toHaveBeenCalledWith('test-product-id', 'province code');
    });
  });

  describe('getUserSubscriptions', () => {
    test('it should include a product for each subscription', async () => {
      const dummyMembershipSubscription = generateSubscription({
        subscription_type: TYPE_MEMBERSHIP,
      });
      const dummyScheduledSubscription = generateSubscription({
        subscription_type: TYPE_SCHEDULED,
      });

      const localMocks = {
        ...mocks,
        subscriptionRepository: mock<SubscriptionRepository>({
          getUserSubscriptions: jest.fn(() =>
            Promise.resolve([dummyMembershipSubscription, dummyScheduledSubscription]),
          ),
        }),
        subscriptionProductFetcher: mock<SubscriptionProductFetcher>({
          getSubscriptionProduct: jest
            .fn()
            .mockReturnValueOnce(Promise.resolve(dummyMembership))
            .mockReturnValueOnce(Promise.resolve(dummyPlan)),
        }),
      };
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
      const subscriptions = await subscriptionBehaviour.getUserSubscriptions('dummy-user-id');
      expect(localMocks.subscriptionProductFetcher.getSubscriptionProduct).toBeCalledTimes(2);
      expect(subscriptions[0].product).toStrictEqual(dummyMembership);
      expect(subscriptions[1].product).toStrictEqual(dummyPlan);
    });
  });

  describe('updateSubscriptionCoupon', () => {
    const dummyUpdateCoupon = 'GET_FREE_STUFF';
    const dummySubscriptionWithUpdatedCoupon = {
      ...dummySubscription,
      coupon_code: dummyUpdateCoupon,
    };

    test('it should return the subscription early when the coupon_code matches update', async () => {
      const localMocks = {
        ...mocks,
        subscriptionRepository: mock<SubscriptionRepository>({
          ...mocks.subscriptionRepository,
          getSubscription: jest.fn(() => Promise.resolve(dummySubscriptionWithUpdatedCoupon)),
        }),
      };
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
      const got = await subscriptionBehaviour.updateSubscriptionCoupon(
        dummySubscription.id,
        dummyUpdateCoupon,
      );
      expect(got).toStrictEqual(dummySubscriptionWithUpdatedCoupon);
      expect(localMocks.translationLayerService.updateGf2User).not.toBeCalled();
      expect(localMocks.subscriptionRepository.updateSubscription).not.toBeCalled();
    });

    test('it should return the updated subscription', async () => {
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(mocks);
      const got = await subscriptionBehaviour.updateSubscriptionCoupon(
        dummySubscription.id,
        dummyUpdateCoupon,
      );
      expect(got).toStrictEqual(dummySubscriptionWithUpdatedCoupon);
    });

    test('it should send the Agent UUID to translation layer if passed', async () => {
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(mocks);
      void (await subscriptionBehaviour.updateSubscriptionCoupon(
        dummySubscription.id,
        dummyUpdateCoupon,
        dummyAgentId,
      ));
      expect(mocks.translationLayerService.updateGf2User).toBeCalledWith(
        { id: dummySubscription.user_id },
        undefined,
        dummyUpdateCoupon,
        dummyAgentId,
      );
    });
  });

  describe('updateSubscriptionDeliveryDay', () => {
    test('it should throw an error if the subscription is of incompatible type', async () => {
      const input = {
        delivery_day: 'SUNDAY',
        subscription_id: dummySubscriptionComposite.subscription.id,
      };
      const localMocks = {
        ...mocks,
        subscriptionRepository: mock<SubscriptionRepository>({
          ...mocks.subscriptionRepository,
          getSubscriptionComposite: jest.fn(() =>
            Promise.resolve({
              ...dummySubscriptionComposite,
              subscription: generateSubscription({ subscription_type: TYPE_MEMBERSHIP }),
            }),
          ),
        }),
      };
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
      const attemptToUpdate = async () => {
        await subscriptionBehaviour.updateSubscriptionDeliveryDay(
          input.subscription_id,
          input.delivery_day as DayOfWeek,
        );
      };
      await expect(attemptToUpdate).rejects.toThrow(IllegalSubscriptionUpdateError);
    });

    test('it should publish an updatedSubscriptionDeliveryDay event and make a call to translation layer on a successful update', async () => {
      const input = {
        delivery_day: 'SUNDAY',
        subscription_id: dummySubscriptionComposite.subscription.id,
      };
      const localMocks = {
        ...mocks,
        subscriptionProductFetcher: mock<SubscriptionProductFetcher>({
          getSubscriptionProduct: jest.fn(() => Promise.resolve(dummyPlan)),
        }),
      };

      const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
      const subscription = await subscriptionBehaviour.updateSubscriptionDeliveryDay(
        input.subscription_id,
        input.delivery_day as DayOfWeek,
      );
      expect(mocks.subscriptionMessagePublisher.dispatchCurationJob).toBeCalledWith(
        expect.objectContaining({
          subscription: expect.objectContaining({ delivery_day: input.delivery_day }) as unknown,
          preferences: expect.arrayContaining(dummySubscriptionComposite.preferences) as unknown,
          address: dummySubscriptionComposite.address,
        }),
      );
      expect(localMocks.translationLayerService.updateSubscriptionDeliveryDay).toBeCalledTimes(1);
      expect(localMocks.subscriptionProductFetcher.getSubscriptionProduct).toBeCalledTimes(1);
      expect(subscription.product).toStrictEqual(dummyPlan);
    });

    test('it should send the Agent UUID to the translation layer if passed', async () => {
      const newDeliveryDay = 'SUNDAY';
      const input = {
        delivery_day: newDeliveryDay,
        subscription_id: dummySubscriptionComposite.subscription.id,
      };
      const dummyAgentId = '57a236ee-2ea5-4329-a0c1-c0805d2401cf';
      const localMocks = {
        ...mocks,
        subscriptionProductFetcher: mock<SubscriptionProductFetcher>({
          getSubscriptionProduct: jest.fn(() => Promise.resolve(dummyPlan)),
        }),
      };
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
      void (await subscriptionBehaviour.updateSubscriptionDeliveryDay(
        input.subscription_id,
        input.delivery_day as DayOfWeek,
        false,
        dummyAgentId,
      ));
      expect(localMocks.translationLayerService.updateSubscriptionDeliveryDay).toBeCalledWith(
        { ...dummySubscription, delivery_day: newDeliveryDay },
        dummyAgentId,
      );
    });

    test('it should not publish an event if nothing is updated', async () => {
      const input = {
        delivery_day: dummySubscriptionComposite.subscription.delivery_day,
        subscription_id: dummySubscriptionComposite.subscription.id,
      };
      const localMocks = {
        ...mocks,
        subscriptionProductFetcher: mock<SubscriptionProductFetcher>({
          getSubscriptionProduct: jest.fn(() => Promise.resolve(dummyPlan)),
        }),
      };

      const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
      const subscription = await subscriptionBehaviour.updateSubscriptionDeliveryDay(
        input.subscription_id,
        input.delivery_day as DayOfWeek,
      );
      expect(mocks.subscriptionMessagePublisher.dispatchCurationJob).toBeCalledTimes(0);
      expect(localMocks.subscriptionProductFetcher.getSubscriptionProduct).toBeCalledTimes(1);
      expect(subscription.product).toStrictEqual(dummyPlan);
    });
  });

  describe('updateSubscriptionPlan', () => {
    test('it should throw an error if the subscription is of incompatible type', async () => {
      const localMocks = {
        ...mocks,
        subscriptionRepository: mock<SubscriptionRepository>({
          ...mocks.subscriptionRepository,
          getSubscriptionComposite: jest.fn(() =>
            Promise.resolve({
              ...dummySubscriptionComposite,
              subscription: generateSubscription({ subscription_type: TYPE_MEMBERSHIP }),
            }),
          ),
        }),
      };
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
      const attemptToUpdate = async () => {
        await subscriptionBehaviour.updateSubscriptionPlan(
          dummySubscriptionComposite.subscription.id,
          dummyPlan.id,
          1,
        );
      };
      await expect(attemptToUpdate).rejects.toThrow(IllegalSubscriptionUpdateError);
    });

    test('it should return the subscription as-is if it is already assigned the submitted product_id', async () => {
      const localMocks = {
        ...mocks,
        subscriptionProductFetcher: mock<SubscriptionProductFetcher>({
          getSubscriptionProduct: jest.fn(() => Promise.resolve(dummyPlan)),
        }),
      };
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
      const { product, ...subscription } = await subscriptionBehaviour.updateSubscriptionPlan(
        dummySubscriptionComposite.subscription.id,
        dummyPlan.id,
        1,
      );
      expect(mocks.subscriptionRepository.updateSubscription).not.toHaveBeenCalled();
      expect(subscription).toEqual(dummySubscription);
      expect(product).toStrictEqual(dummyPlan);
    });

    test('it should fire a re-curation event and return the updated subscription if the plan is updated', async () => {
      const dummyUpdatePlan = generatePlan();
      const localMocks = {
        ...mocks,
        subscriptionProductFetcher: mock<SubscriptionProductFetcher>({
          getSubscriptionProduct: jest.fn(() => Promise.resolve(dummyUpdatePlan)),
        }),
      };
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
      const { product, ...subscription } = await subscriptionBehaviour.updateSubscriptionPlan(
        dummySubscriptionComposite.subscription.id,
        dummyUpdatePlan.id,
        2,
      );
      expect(mocks.subscriptionRepository.updateSubscription).toHaveBeenCalled();
      expect(mocks.subscriptionMessagePublisher.dispatchCurationJob).toHaveBeenCalled();
      expect(subscription).toEqual({
        ...dummySubscription,
        product_id: dummyUpdatePlan.id,
      });
      expect(product).toStrictEqual(dummyUpdatePlan);
    });

    test('it should send the Agent UUID to translation layer if passed', async () => {
      const dummyUpdatePlan = generatePlan();
      const dummyOldPlanId = 3;
      const localMocks = {
        ...mocks,
        subscriptionProductFetcher: mock<SubscriptionProductFetcher>({
          getSubscriptionProduct: jest.fn(() => Promise.resolve(dummyUpdatePlan)),
        }),
      };
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
      void (await subscriptionBehaviour.updateSubscriptionPlan(
        dummySubscriptionComposite.subscription.id,
        dummyUpdatePlan.id,
        dummyOldPlanId,
        dummyAgentId,
      ));
      expect(mocks.translationLayerService.updateSubscriptionPlan).toBeCalledWith(
        dummySubscriptionComposite.subscription.user_id,
        dummyOldPlanId,
        dummyAgentId,
      );
    });
  });

  describe('extendSubscriptionTrial', () => {
    test('output should include a membership entity as the product', async () => {
      const dummySubscription = generateSubscription({
        subscription_type: TYPE_MEMBERSHIP,
        state: STATE_TRIAL,
      });
      const localMocks = {
        ...mocks,
        subscriptionProductFetcher: mock<SubscriptionProductFetcher>({
          getSubscriptionProduct: jest.fn(() => Promise.resolve(dummyMembership)),
        }),
        subscriptionRepository: mock<SubscriptionRepository>({
          getSubscription: jest.fn(() => Promise.resolve(dummySubscription)),
        }),
        dateBehaviour: mock<DateBehaviour>({
          isDateWithinAYearAfter: jest.fn(() => true),
        }),
      };
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
      const subscription = await subscriptionBehaviour.extendSubscriptionTrial(
        dummySubscription.id,
        new Date(),
      );
      expect(localMocks.subscriptionProductFetcher.getSubscriptionProduct).toBeCalledTimes(1);
      expect(subscription.product).toStrictEqual(dummyMembership);
    });
  });

  describe('getLastCancelledSubscription', () => {
    test('if there is a subscription that was cancelled it should return the input values for that subscription', async () => {
      const localMocks = {
        ...mocks,
        subscriptionProductFetcher: mock<SubscriptionProductFetcher>({
          getSubscriptionProduct: jest.fn(() => Promise.resolve(dummyPlan)),
        }),
        subscriptionRepository: mock<SubscriptionRepository>({
          getLastCancelledSubscription: jest.fn(() => Promise.resolve(dummySubscription)),
        }),
        planFrequencyRepository: mock<PlanFrequencyRepository>({
          getPlanFrequencyId: jest.fn(() => Promise.resolve(1)),
        }),
        agreementRepository: mock<AgreementRepository>({
          getAgreement: jest.fn(() => Promise.resolve(dummyAgreement)),
        }),
      };

      const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
      const got = await subscriptionBehaviour.getLastCancelledSubscription('a_user_id');
      expect(got?.product).toStrictEqual(dummyPlan);
      expect(got?.create_payload?.card_id).toEqual(dummySubscription.card_id);
      expect(got?.create_payload?.user_id).toEqual(dummySubscription.user_id);
      expect(got?.create_payload?.address_id).toEqual(dummySubscription.address_id);
      expect(got?.create_payload?.subscription_type).toEqual(dummySubscription.subscription_type);
      expect(got?.create_payload?.product_id).toEqual(dummySubscription.product_id);
      expect(got?.create_payload?.send_notification).toEqual(dummySubscription.send_notification);
      expect(got?.create_payload?.delivery_day).toEqual(dummySubscription.delivery_day);
      expect(got?.create_payload?.terms_id).toEqual(dummyAgreement.terms_id);
      expect(got?.create_payload?.plan_frequency_id).toEqual(1);
    });

    test('if user has not cancelled before then return null fields', async () => {
      const localMocks = {
        ...mocks,
        subscriptionRepository: mock<SubscriptionRepository>({
          getLastCancelledSubscription: jest.fn(() => Promise.resolve(null)),
        }),
      };
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
      const got = await subscriptionBehaviour.getLastCancelledSubscription('a_user_id');
      expect(got).toBeNull();
    });
  });

  describe('createMembershipSubscriptionTrial', () => {
    test('it should create a trial membership subscription for the user', async () => {
      const dummyUserId = 'b2d7438f-1ffe-4d01-a7aa-4fded9f6c3a7';
      const dummyMembershipSubscriptionValues = generateMembershipSubscriptionValue({
        product: dummyMembership,
      });
      dummyMembershipSubscriptionValues.createValues.state = STATE_TRIAL;
      const localMocks = {
        ...mocks,
        subscriptionValuesFactory: mock<SubscriptionValuesFactory>({
          subscriptionValues: jest.fn(() => Promise.resolve(dummyMembershipSubscriptionValues)),
        }),
      };
      const subscriptionBehaviour = new SubscriptionBehaviourImpl(localMocks);
      const subscription = await subscriptionBehaviour.createMembershipSubscriptionTrial(
        dummyUserId,
      );
      expect(subscription.state).toStrictEqual(STATE_TRIAL);
      expect(subscription.subscription_type).toStrictEqual(TYPE_MEMBERSHIP);
    });
  });
});
