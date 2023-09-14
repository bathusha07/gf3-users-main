import { MembershipRepository, PlanRepository, SubscriptionProductFetcher } from '../types';
import {
  SubscriptionEntity,
  SubscriptionProduct,
  TYPE_MEMBERSHIP,
  TYPE_SCHEDULED,
} from '@makegoodfood/gf3-types';
import Membership from '../membership/Membership';
import Plan from '../plan/Plan';
import SubresourceNotFound from '../errors/SubresourceNotFound';

export default class SubscriptionProductFetcherImpl implements SubscriptionProductFetcher {
  protected membershipRepository: MembershipRepository;
  protected planRepository: PlanRepository;

  public constructor({
    membershipRepository,
    planRepository,
  }: {
    membershipRepository: MembershipRepository;
    planRepository: PlanRepository;
  }) {
    this.membershipRepository = membershipRepository;
    this.planRepository = planRepository;
  }

  public getSubscriptionProduct = async (
    subscription: SubscriptionEntity,
  ): Promise<SubscriptionProduct> => {
    let subscriptionProduct;
    switch (subscription.subscription_type) {
      case TYPE_MEMBERSHIP:
        subscriptionProduct = await this.membershipRepository.getMembership(
          subscription.product_id,
        );
        if (!subscriptionProduct) {
          throw new SubresourceNotFound(Membership.name, subscription.subscription_type);
        }
        break;
      case TYPE_SCHEDULED:
        subscriptionProduct = await this.planRepository.getPlan(subscription.product_id);
        if (!subscriptionProduct) {
          throw new SubresourceNotFound(Plan.name, subscription.subscription_type);
        }
        break;
      default:
        throw new SubresourceNotFound(Membership.name, subscription.subscription_type);
    }
    return subscriptionProduct;
  };
}
