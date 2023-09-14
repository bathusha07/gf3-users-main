import { mock, mockClear } from 'jest-mock-extended';
import generateMembership from '../../../factories/membership';
import generatePlan from '../../../factories/plan';
import generateSubscription from '../../../factories/subscription';

import SubscriptionProductFetcherImpl from '../../../../src/domain/subscription/SubscriptionProductFetcherImpl';
import { MembershipRepository, PlanRepository } from '../../../../src/domain/types';
import { TYPE_MEMBERSHIP, TYPE_SCHEDULED } from '@makegoodfood/gf3-types';
import SubresourceNotFound from '../../../../src/domain/errors/SubresourceNotFound';

describe('SubscriptionProductFetcherImpl', () => {
  const dummyMembership = generateMembership();
  const dummyPlan = generatePlan();
  const mocks = {
    membershipRepository: mock<MembershipRepository>({
      getMembership: jest.fn().mockReturnValue(dummyMembership),
    }),
    planRepository: mock<PlanRepository>({
      getPlan: jest.fn().mockReturnValue(dummyPlan),
    }),
  };

  const dummyMembershipSubscription = generateSubscription({ subscription_type: TYPE_MEMBERSHIP });
  const dummyScheduledSubscription = generateSubscription({ subscription_type: TYPE_SCHEDULED });

  afterEach(() => {
    Object.values(mocks).forEach(mockClear);
  });

  describe('getSubscriptionProduct', () => {
    describe('when the subscription type is invalid', () => {
      test('it should throw an error', async () => {
        const invalidSubscription = generateSubscription({ subscription_type: undefined });
        const subscriptionProductFetcher = new SubscriptionProductFetcherImpl(mocks);
        const attemptToFetch = async () => {
          await subscriptionProductFetcher.getSubscriptionProduct(invalidSubscription);
        };
        await expect(attemptToFetch).rejects.toThrow(SubresourceNotFound);
      });
    });

    describe('when the subscription type is of type MEMBERSHIP', () => {
      test('it should return a Membership as product if a matching one exists', async () => {
        const subscriptionProductFetcher = new SubscriptionProductFetcherImpl(mocks);
        const product = await subscriptionProductFetcher.getSubscriptionProduct(
          dummyMembershipSubscription,
        );
        expect(product).toStrictEqual(dummyMembership);
      });

      test('it should throw an error if there is no matching Membership', async () => {
        const localMocks = {
          ...mocks,
          membershipRepository: mock<MembershipRepository>({
            getMembership: jest.fn().mockReturnValue(null),
          }),
        };
        const subscriptionProductFetcher = new SubscriptionProductFetcherImpl(localMocks);
        const attemptToFetch = async () => {
          await subscriptionProductFetcher.getSubscriptionProduct(dummyMembershipSubscription);
        };
        await expect(attemptToFetch).rejects.toThrow(SubresourceNotFound);
      });
    });

    describe('when the subscription type is of type SCHEDULED', () => {
      test('it should return a Plan as product if a matching one exists', async () => {
        const subscriptionProductFetcher = new SubscriptionProductFetcherImpl(mocks);
        const product = await subscriptionProductFetcher.getSubscriptionProduct(
          dummyScheduledSubscription,
        );
        expect(product).toStrictEqual(dummyPlan);
      });

      test('it should throw an error if there is no matching Plan', async () => {
        const localMocks = {
          ...mocks,
          planRepository: mock<PlanRepository>({
            getPlan: jest.fn().mockReturnValue(null),
          }),
        };
        const subscriptionProductFetcher = new SubscriptionProductFetcherImpl(localMocks);
        const attemptToFetch = async () => {
          await subscriptionProductFetcher.getSubscriptionProduct(dummyScheduledSubscription);
        };
        await expect(attemptToFetch).rejects.toThrow(SubresourceNotFound);
      });
    });
  });
});
