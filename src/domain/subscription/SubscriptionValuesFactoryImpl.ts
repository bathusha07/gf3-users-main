import SubresourceNotFound from '../errors/SubresourceNotFound';
import {
  DateBehaviour,
  MembershipRepository,
  PlanRepository,
  SubscriptionValue,
  PlanFrequencyRepository,
  SubscriptionValuesFactory,
} from '../types';
import {
  PlanFrequencyEntity,
  PlanFrequencyId,
  SubscriptionInput,
  SubscriptionState,
  STATE_ACTIVE,
  STATE_TRIAL,
  TYPE_MEMBERSHIP,
  TYPE_SCHEDULED,
} from '@makegoodfood/gf3-types';
import DeliveryDay from './valueObjects/DeliveryDay';
import ValidationError from '../errors/ValidationError';
import PlanFrequency from '../planFrequency/PlanFrequency';
import Membership from '../membership/Membership';
import Plan from '../plan/Plan';

export default class SubscriptionValuesFactoryImpl implements SubscriptionValuesFactory {
  protected membershipRepository: MembershipRepository;
  protected planRepository: PlanRepository;
  protected planFrequencyRepository: PlanFrequencyRepository;
  protected dateBehaviour: DateBehaviour;

  public constructor({
    membershipRepository,
    planRepository,
    planFrequencyRepository,
    dateBehaviour,
  }: {
    membershipRepository: MembershipRepository;
    planRepository: PlanRepository;
    planFrequencyRepository: PlanFrequencyRepository;
    dateBehaviour: DateBehaviour;
  }) {
    this.membershipRepository = membershipRepository;
    this.planRepository = planRepository;
    this.planFrequencyRepository = planFrequencyRepository;
    this.dateBehaviour = dateBehaviour;
  }

  public subscriptionValues = async (input: SubscriptionInput): Promise<SubscriptionValue> => {
    const subscriptionType = input.subscription_type;

    switch (subscriptionType) {
      case TYPE_MEMBERSHIP:
        return await this.membershipSubscriptionValues(input);
      case TYPE_SCHEDULED:
        return await this.scheduledSubscriptionValues(input);
      default:
        throw new SubresourceNotFound(Membership.name, input.subscription_type);
    }
  };

  private membershipSubscriptionValues = async (
    input: SubscriptionInput,
  ): Promise<SubscriptionValue> => {
    const membership = await this.membershipRepository.getMembership(input.product_id);
    if (!membership) {
      throw new SubresourceNotFound(Membership.name, input.product_id);
    }

    let state: SubscriptionState;
    let next_cycle: Date;
    if (membership.trial_value === 0) {
      state = STATE_ACTIVE;
      next_cycle = this.dateBehaviour.calculateNextCycle(
        membership.frequency_type,
        membership.frequency_value,
        this.dateBehaviour.getCurrentDate(),
      );
    } else {
      state = STATE_TRIAL;
      next_cycle = this.dateBehaviour.calculateNextCycle(
        membership.trial_type,
        membership.trial_value,
        this.dateBehaviour.getCurrentDate(),
      );
    }

    const createValues = Object.freeze({
      product_id: membership.id,
      frequency_type: membership.frequency_type,
      frequency_value: membership.frequency_value,
      state,
      next_cycle,
      delivery_day: null,
    });

    return {
      createValues,
      product: membership,
    };
  };

  private scheduledSubscriptionValues = async (
    input: SubscriptionInput,
  ): Promise<SubscriptionValue> => {
    if (!input.address_id) {
      throw new ValidationError(
        `Mising address_id. ${TYPE_SCHEDULED} subscriptions must have an address_id.`,
      );
    }

    const plan = await this.planRepository.getPlan(input.product_id);
    if (!plan) {
      throw new SubresourceNotFound(Plan.name, input.product_id);
    }

    if (input.plan_frequency_id === undefined) {
      throw new ValidationError(
        `Missing PlanFrequency id. Value must be passed for ${TYPE_SCHEDULED} subscriptions.`,
      );
    }
    const planFrequency = await this.validatePlanFrequency(input.plan_frequency_id);

    const state: SubscriptionState = STATE_ACTIVE;
    const next_cycle = this.dateBehaviour.calculateNextCycle(
      planFrequency.frequency_type,
      planFrequency.frequency_value,
      this.dateBehaviour.getCurrentDate(),
    );

    const delivery_day = new DeliveryDay(input.delivery_day).getDeliveryDay();

    const createValues = Object.freeze({
      product_id: plan.id,
      frequency_type: planFrequency.frequency_type,
      frequency_value: planFrequency.frequency_value,
      state,
      next_cycle,
      delivery_day,
      coupon_code: input.coupon_code,
    });

    return {
      createValues,
      product: plan,
    };
  };

  private validatePlanFrequency = async (
    planFrequencyId: PlanFrequencyId,
  ): Promise<PlanFrequencyEntity> => {
    const planFrequency = await this.planFrequencyRepository.getPlanFrequency(planFrequencyId);
    if (!planFrequency) {
      throw new SubresourceNotFound(PlanFrequency.name, planFrequencyId);
    }
    return planFrequency;
  };
}
