import {
  DateBehaviour,
  AgreementRepository,
  SubscriptionBehaviour,
  SubscriptionRepository,
  SubscriptionEvent,
  SubscriptionValuesFactory,
  SubscriptionCompositeEntity,
  SubscriptionProductFetcher,
  PubsubProducer,
  CatalogService,
  CartService,
  CancellationReasonRepository,
  SubscriptionMessagePublisher,
  TranslationLayerService,
  PlanFrequencyRepository,
  LastCancelledSubscription,
  MembershipRepository,
  MembershipCompositeEntity,
  UpdateSubscriptionScheduleInput,
} from '../types';
import {
  AgentId,
  CancellationSelectionEntity,
  CancellationSelectionInput,
  DayOfWeek,
  SubscriptionEntity,
  SubscriptionId,
  SubscriptionInput,
  UserId,
  STATE_ACTIVE,
  STATE_TRIAL,
  TYPE_MEMBERSHIP,
  TYPE_SCHEDULED,
  OldPlanId,
  PlanId,
  SubscriptionType,
  PlanFrequencyId,
  PlanFrequencyEntity,
} from '@makegoodfood/gf3-types';
import {
  EVENT_CANCELLATION,
  SUBSCRIPTION_CREATED_EVENT_TYPE,
  SUBSCRIPTION_CREATED_EVENT_VERSION,
  SUBSCRIPTION_RENEWAL_EVENT_TYPE,
  SUBSCRIPTION_RENEWAL_EVENT_VERSION,
  WOW_ONE_YEAR_TRIAL_MEMBERSHIP_ID,
  WOW_ONE_YEAR_TRIAL_TERMS_ID,
  WOW_ONE_YEAR_TRIAL_AGREEMENT_IP,
  FREQUENCY_TYPE_DAY,
} from './constants';
import DomainEvent from '../event/DomainEvent';
import IllegalSubscriptionUpdateError from '../errors/IllegalSubscriptionUpdateError';
import InvalidUpdateError from '../errors/InvalidUpdateError';
import ValidationError from '../errors/ValidationError';
import { transitionSubscriptionState } from './transitionSubscriptionState';
import pubsubConfigs from '../../config/pubsub';
import DeliveryDay from './valueObjects/DeliveryDay';
import CancellationSelectionEditValue from './valueObjects/CancellationSelectionEditValue';
import { v4 as uuidv4 } from 'uuid';
import SubscriptionComposite from './SubscriptionComposite';
import ResourceNotFound from '../errors/ResourceNotFound';
import Subscription from './Subscription';
import SubresourceNotFound from '../errors/SubresourceNotFound';
import Membership from '../membership/Membership';
import PlanFrequency from '../planFrequency/PlanFrequency';

export default class SubscriptionBehaviourImpl implements SubscriptionBehaviour {
  protected dateBehaviour: DateBehaviour;
  protected subscriptionRepository: SubscriptionRepository;
  protected agreementRepository: AgreementRepository;
  protected membershipRepository: MembershipRepository;
  protected subscriptionValuesFactory: SubscriptionValuesFactory;
  protected pubsubProducer: PubsubProducer;
  protected cartService: CartService;
  protected catalogService: CatalogService;
  protected cancellationReasonRepository: CancellationReasonRepository;
  protected subscriptionMessagePublisher: SubscriptionMessagePublisher;
  protected translationLayerService: TranslationLayerService;
  protected planFrequencyRepository: PlanFrequencyRepository;
  protected subscriptionProductFetcher: SubscriptionProductFetcher;

  public constructor({
    dateBehaviour,
    subscriptionRepository,
    agreementRepository,
    membershipRepository,
    subscriptionValuesFactory,
    pubsubProducer,
    cartService,
    catalogService,
    cancellationReasonRepository,
    subscriptionMessagePublisher,
    translationLayerService,
    planFrequencyRepository,
    subscriptionProductFetcher,
  }: {
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
  }) {
    this.dateBehaviour = dateBehaviour;
    this.subscriptionRepository = subscriptionRepository;
    this.agreementRepository = agreementRepository;
    this.membershipRepository = membershipRepository;
    this.subscriptionValuesFactory = subscriptionValuesFactory;
    this.pubsubProducer = pubsubProducer;
    this.cartService = cartService;
    this.catalogService = catalogService;
    this.cancellationReasonRepository = cancellationReasonRepository;
    this.subscriptionMessagePublisher = subscriptionMessagePublisher;
    this.translationLayerService = translationLayerService;
    this.planFrequencyRepository = planFrequencyRepository;
    this.subscriptionProductFetcher = subscriptionProductFetcher;
  }

  public getSubscription = async (id: SubscriptionId): Promise<SubscriptionEntity> => {
    const subscription = await this.subscriptionRepository.getSubscription(id);
    return {
      ...subscription,
      product: await this.subscriptionProductFetcher.getSubscriptionProduct(subscription),
    };
  };

  public getSubscriptionMembership = async (
    id: SubscriptionId,
  ): Promise<MembershipCompositeEntity | null> => {
    const { subscription, address } = await this.subscriptionRepository.getSubscriptionComposite(
      id,
    );

    if (subscription.subscription_type !== TYPE_MEMBERSHIP || !address) {
      throw new SubresourceNotFound(Membership.name, subscription.product_id);
    }

    return this.membershipRepository.getMembershipCompositeForProvince(
      subscription.product_id,
      address.province_code,
    );
  };

  public getUserSubscriptions = async (id: UserId): Promise<SubscriptionEntity[]> =>
    Promise.all(
      (await this.subscriptionRepository.getUserSubscriptions(id)).map(async (subscription) => {
        return {
          ...subscription,
          product: await this.subscriptionProductFetcher.getSubscriptionProduct(subscription),
        };
      }),
    );

  public createSubscription = async (input: SubscriptionInput): Promise<SubscriptionEntity> => {
    const { terms_id, user_id, ip_address } = input;

    const agreement = await this.agreementRepository.createAgreement({
      terms_id,
      user_id,
      ip_address,
    });

    const subscriptionValues = await this.subscriptionValuesFactory.subscriptionValues(input);

    const subscriptionToCreate: SubscriptionEntity = {
      id: uuidv4(),
      user_id: input.user_id,
      card_id: input.card_id,
      address_id: input.address_id,
      agreement_id: agreement.id,
      subscription_type: input.subscription_type,
      send_notification: input.send_notification,
      started_at: this.dateBehaviour.getCurrentDate(),
      ...subscriptionValues.createValues,
    };

    await this.createSubscriptionOnTranslationLayer(subscriptionToCreate, input);
    const subscription = await this.subscriptionRepository.createSubscription(subscriptionToCreate);

    void this.pubsubProducer.publish(
      new DomainEvent<SubscriptionEntity>({
        payload: subscription,
        topic: pubsubConfigs.topics.subscriptionCreated,
        type: SUBSCRIPTION_CREATED_EVENT_TYPE,
        version: SUBSCRIPTION_CREATED_EVENT_VERSION,
      }),
    );

    console.log('[SubscriptionAction] Subscription created', {
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      product_id: subscription.product_id,
    });

    return {
      ...subscription,
      product: subscriptionValues.product,
    };
  };

  private createSubscriptionOnTranslationLayer = async (
    subscription: SubscriptionEntity,
    input: SubscriptionInput,
  ): Promise<void> => {
    switch (subscription.subscription_type) {
      case TYPE_MEMBERSHIP:
        await this.translationLayerService.createMembershipSubscription(subscription);
        break;
      case TYPE_SCHEDULED:
        if (!input.old_plan_id) {
          throw new ValidationError(
            `Missing old_plan_id. Value must be passed for ${TYPE_SCHEDULED} subscriptions.`,
          );
        }
        await this.translationLayerService.createScheduledSubscription({
          subscription,
          old_plan_id: input.old_plan_id,
          initial_cycle_date: input.initial_cycle_date,
          invite_uuid: input.invite_uuid,
          referrer_id: input.referrer_id,
        });
        break;
    }
  };

  public createSubscriptionFromLastCancelledSubscription = async (
    userId: UserId,
    subscriptionType: SubscriptionType,
    now: Date,
    oldPlanId?: OldPlanId,
    agentId?: AgentId,
  ): Promise<SubscriptionEntity> => {
    const lastSubscription = await this.subscriptionRepository.getLastCancelledSubscription(
      userId,
      subscriptionType,
    );
    if (!lastSubscription) {
      throw new ResourceNotFound(Subscription.name, userId);
    }

    // using Subscription constructor to trim created_at, updated_at timestamps
    const subscriptionToCreate: SubscriptionEntity = new Subscription({
      ...lastSubscription,
      id: uuidv4(),
      state: STATE_ACTIVE,
      started_at: now,
    });
    switch (subscriptionType) {
      case TYPE_MEMBERSHIP:
        await this.translationLayerService.createMembershipSubscription(subscriptionToCreate);
        break;
      case TYPE_SCHEDULED:
        if (!oldPlanId) {
          throw new ValidationError(
            `Missing old_plan_id. Value must be passed for ${TYPE_SCHEDULED} subscriptions.`,
          );
        }
        await this.translationLayerService.createScheduledSubscription({
          subscription: this.setReactivatedSubscriptionToWeeklyCadence(subscriptionToCreate),
          old_plan_id: oldPlanId,
          agent_id: agentId,
        });
        break;
    }
    const subscription = await this.subscriptionRepository.createSubscription(subscriptionToCreate);

    void this.pubsubProducer.publish(
      new DomainEvent<SubscriptionEntity>({
        payload: subscription,
        topic: pubsubConfigs.topics.subscriptionCreated,
        type: SUBSCRIPTION_CREATED_EVENT_TYPE,
        version: SUBSCRIPTION_CREATED_EVENT_VERSION,
      }),
    );

    console.log('[SubscriptionAction] Subscription created from last cancelled', {
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      product_id: subscription.product_id,
      last_subscription_id: lastSubscription.id,
    });

    return subscription;
  };

  private setReactivatedSubscriptionToWeeklyCadence = (
    subscription: SubscriptionEntity,
  ): SubscriptionEntity => {
    subscription.frequency_type = FREQUENCY_TYPE_DAY;
    subscription.frequency_value = 7;
    return subscription;
  };

  public curateScheduledSubscriptions = async (now: Date): Promise<void> => {
    const subscriptionsDue = await this.subscriptionRepository.getSubscriptionsDueForCuration(now);
    if (subscriptionsDue.length) {
      subscriptionsDue.forEach(async () => {
        const recipes = await this.catalogService.getCuratedRecipes();
        await this.cartService.createCartFromCuratedRecipes(recipes);
      });
    }
  };

  public checkSubscriptionsDueForRenewal = async (now: Date): Promise<void> => {
    const subscriptionsDue = await this.subscriptionRepository.getSubscriptionsDueForRenewal(now);
    if (subscriptionsDue.length) {
      subscriptionsDue.forEach(async (subscription) => {
        const event = new DomainEvent<SubscriptionEntity>({
          payload: subscription,
          topic: pubsubConfigs.topics.subscriptionRenewal,
          type: SUBSCRIPTION_RENEWAL_EVENT_TYPE,
          version: SUBSCRIPTION_RENEWAL_EVENT_VERSION,
        });
        await this.pubsubProducer.publish(event);
      });
    }
  };

  public updateSubscriptionCoupon = async (
    id: SubscriptionId,
    couponCode: string | null,
    agentId?: AgentId,
  ): Promise<SubscriptionEntity> => {
    const subscription = await this.subscriptionRepository.getSubscription(id);
    if (subscription.coupon_code === couponCode) {
      return subscription;
    }

    const subscriptionToUpdate = {
      ...subscription,
      coupon_code: couponCode,
    };
    await this.translationLayerService.updateGf2User(
      { id: subscription.user_id },
      undefined,
      couponCode,
      agentId,
    );
    const updatedSubscription = await this.subscriptionRepository.updateSubscription(
      subscriptionToUpdate,
    );

    return updatedSubscription;
  };

  public updateSubscriptionState = async (
    id: SubscriptionId,
    event: SubscriptionEvent,
    agentId?: AgentId,
  ): Promise<SubscriptionEntity> => {
    const subscription = await this.subscriptionRepository.getSubscription(id);

    const nextSubscription = this.transitionSubscriptionState(
      subscription,
      event,
      this.dateBehaviour.getCurrentDate(),
    );

    const isNextSubscriptionSame =
      subscription.state === nextSubscription.state &&
      subscription.next_cycle === nextSubscription.next_cycle;

    if (isNextSubscriptionSame) {
      return subscription;
    }

    await this.translationLayerService.updateSubscriptionState(
      subscription.user_id,
      subscription.id,
      event,
      agentId,
    );

    return await this.subscriptionRepository.updateSubscription(nextSubscription);
  };

  public updateSubscriptionDeliveryDay = async (
    id: SubscriptionId,
    deliveryDay: DayOfWeek,
    isAfterhours = false,
    agentId?: AgentId,
  ): Promise<SubscriptionEntity> => {
    const { subscription, address, preferences } = await this.getScheduledSubscriptionComposite(
      id,
      'delivery_day',
    );
    if (subscription.delivery_day === deliveryDay && subscription.is_afterhours === isAfterhours) {
      return {
        ...subscription,
        product: await this.subscriptionProductFetcher.getSubscriptionProduct(subscription),
      };
    }

    const subscriptionToUpdate = {
      ...subscription,
      delivery_day: new DeliveryDay(deliveryDay).getDeliveryDay(),
      is_afterhours: isAfterhours,
    };
    await this.translationLayerService.updateSubscriptionDeliveryDay(subscriptionToUpdate, agentId);
    const updatedSubscription = await this.subscriptionRepository.updateSubscription(
      subscriptionToUpdate,
    );

    void (await this.subscriptionMessagePublisher.dispatchCurationJob(
      new SubscriptionComposite({ subscription: updatedSubscription, address, preferences }),
    ));

    return {
      ...updatedSubscription,
      product: await this.subscriptionProductFetcher.getSubscriptionProduct(updatedSubscription),
    };
  };

  public updateSubscriptionDeliverySchedule = async (
    input: UpdateSubscriptionScheduleInput,
  ): Promise<SubscriptionEntity> => {
    const { subscription, address, preferences } = await this.getScheduledSubscriptionComposite(
      input.id,
      'delivery_day',
    );

    const planFrequency = await this.validatePlanFrequency(input.plan_frequency_id);

    const subscriptionToUpdate = {
      ...subscription,
      delivery_day: new DeliveryDay(input.delivery_day).getDeliveryDay(),
      frequency_type: planFrequency.frequency_type,
      frequency_value: planFrequency.frequency_value,
    };
    await this.translationLayerService.updateSubscriptionDeliverySchedule({
      subscription: subscriptionToUpdate,
      agent_id: input.agent_id,
      initial_cycle_date: input.initial_cycle_date,
    });
    const updatedSubscription = await this.subscriptionRepository.updateSubscription(
      subscriptionToUpdate,
    );

    void (await this.subscriptionMessagePublisher.dispatchCurationJob(
      new SubscriptionComposite({ subscription: updatedSubscription, address, preferences }),
    ));

    return {
      ...updatedSubscription,
      product: await this.subscriptionProductFetcher.getSubscriptionProduct(updatedSubscription),
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

  public updateSubscriptionPlan = async (
    id: SubscriptionId,
    planId: PlanId,
    oldPlanId: number,
    agentId?: AgentId,
  ): Promise<SubscriptionEntity> => {
    const { subscription, address, preferences } = await this.getScheduledSubscriptionComposite(
      id,
      'product_id',
    );
    if (subscription.product_id === planId) {
      return {
        ...subscription,
        product: await this.subscriptionProductFetcher.getSubscriptionProduct(subscription),
      };
    }

    const subscriptionToUpdate = {
      ...subscription,
      product_id: planId,
    };
    await this.translationLayerService.updateSubscriptionPlan(
      subscriptionToUpdate.user_id,
      oldPlanId,
      agentId,
    );
    const updatedSubscription = await this.subscriptionRepository.updateSubscription(
      subscriptionToUpdate,
    );

    void (await this.subscriptionMessagePublisher.dispatchCurationJob(
      new SubscriptionComposite({ subscription: updatedSubscription, address, preferences }),
    ));

    return {
      ...updatedSubscription,
      product: await this.subscriptionProductFetcher.getSubscriptionProduct(updatedSubscription),
    };
  };

  private getScheduledSubscriptionComposite = async (
    id: SubscriptionId,
    updatedField: string,
  ): Promise<SubscriptionCompositeEntity> => {
    const composite = await this.subscriptionRepository.getSubscriptionComposite(id);

    if (composite.subscription.subscription_type !== TYPE_SCHEDULED) {
      throw new IllegalSubscriptionUpdateError(
        composite.subscription.subscription_type,
        updatedField,
      );
    }

    return composite;
  };

  public transitionSubscriptionState = (
    subscription: SubscriptionEntity,
    event: SubscriptionEvent,
    now: Date,
  ): SubscriptionEntity =>
    transitionSubscriptionState(subscription, event, now, this.dateBehaviour.calculateNextCycle);

  public cancelSubscription = async (
    id: SubscriptionId,
    selections: CancellationSelectionInput[],
    agentId?: AgentId,
  ): Promise<CancellationSelectionEntity[]> => {
    const subscription = await this.subscriptionRepository.getSubscription(id);
    const nextSubscription = this.transitionSubscriptionState(
      subscription,
      EVENT_CANCELLATION,
      this.dateBehaviour.getCurrentDate(),
    );

    selections.forEach(async (input) => {
      const reason = await this.cancellationReasonRepository.getReason(input.reason_id);
      new CancellationSelectionEditValue(input).validate(reason);
    });

    await this.translationLayerService.cancelSubscription(subscription, agentId);
    const cancelledSubscription = await this.subscriptionRepository.updateSubscriptionWithCancellationSelections(
      nextSubscription,
      selections,
    );

    console.log('[SubscriptionAction] Subscription cancelled', {
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      agent_id: agentId,
    });

    return cancelledSubscription;
  };

  public cancelUserSubscriptions = async (
    userId: UserId,
    reasons: Omit<CancellationSelectionInput, 'subscription_id'>[],
    agentId?: AgentId,
  ): Promise<void> => {
    const subscriptions = await this.subscriptionRepository.getActiveUserSubscriptions(userId);

    for (const subscription of subscriptions) {
      const reasonsWithSubscriptionId = reasons.map((reason) => ({
        ...reason,
        subscription_id: subscription.id,
      }));

      for (const reasonWithSubscriptionId of reasonsWithSubscriptionId) {
        const reason = await this.cancellationReasonRepository.getReason(
          reasonWithSubscriptionId.reason_id,
        );
        new CancellationSelectionEditValue(reasonWithSubscriptionId).validate(reason);
      }

      const nextSubscription = this.transitionSubscriptionState(
        subscription,
        EVENT_CANCELLATION,
        this.dateBehaviour.getCurrentDate(),
      );

      await this.translationLayerService.cancelSubscription(subscription, agentId);
      await this.subscriptionRepository.updateSubscriptionWithCancellationSelections(
        nextSubscription,
        reasonsWithSubscriptionId,
      );

      console.log('[SubscriptionAction] Subscription cancelled', {
        user_id: subscription.user_id,
        subscription_id: subscription.id,
        agent_id: agentId,
      });
    }
  };

  public getCancellationSelections = async (
    id: SubscriptionId,
  ): Promise<CancellationSelectionEntity[]> => {
    return await this.subscriptionRepository.getCancellationSelectionsBySubscriptionId(id);
  };

  public extendSubscriptionTrial = async (
    id: SubscriptionId,
    trialEnd: Date,
  ): Promise<SubscriptionEntity> => {
    const subscription = await this.subscriptionRepository.getSubscription(id);

    if (subscription.state !== STATE_TRIAL) {
      throw new InvalidUpdateError(
        `Cannot extend trial for a subscription that is not currently in ${STATE_TRIAL} state`,
      );
    }

    if (this.dateBehaviour.isDateInPast(trialEnd)) {
      throw new InvalidUpdateError(`Cannot extend trial as it is in the past`);
    }

    if (!this.dateBehaviour.isDateWithinAYearAfter(trialEnd, subscription.started_at)) {
      throw new InvalidUpdateError(
        `Cannot extend trial as it is more than one year from the subscription start date`,
      );
    }

    const subscriptionToUpdate = {
      ...subscription,
      next_cycle: trialEnd,
    };

    await this.translationLayerService.extendSubscriptionTrial(subscriptionToUpdate);
    const updatedSubscription = await this.subscriptionRepository.updateSubscription(
      subscriptionToUpdate,
    );

    return {
      ...updatedSubscription,
      product: await this.subscriptionProductFetcher.getSubscriptionProduct(subscription),
    };
  };

  public getLastCancelledSubscription = async (
    userId: UserId,
    type?: SubscriptionType,
  ): Promise<LastCancelledSubscription | null> => {
    const lastSubscription = await this.subscriptionRepository.getLastCancelledSubscription(
      userId,
      type,
    );
    if (!lastSubscription) {
      return null;
    }
    const product = await this.subscriptionProductFetcher.getSubscriptionProduct(lastSubscription);
    const {
      user_id,
      card_id,
      address_id,
      subscription_type,
      product_id,
      send_notification,
      delivery_day,
      agreement_id,
      frequency_type,
      frequency_value,
    } = lastSubscription;
    const subscriptionAgreement = await this.agreementRepository.getAgreement(agreement_id);
    const planFrequencyId = await this.planFrequencyRepository.getPlanFrequencyId(
      frequency_type,
      frequency_value,
    );
    return {
      product,
      create_payload: {
        card_id,
        user_id,
        address_id,
        subscription_type,
        product_id,
        send_notification,
        delivery_day,
        terms_id: subscriptionAgreement.terms_id,
        plan_frequency_id: planFrequencyId ?? undefined,
      },
    };
  };

  public createMembershipSubscriptionTrial = async (
    userId: UserId,
  ): Promise<SubscriptionEntity> => {
    const subscriptionInput = {
      user_id: userId,
      subscription_type: TYPE_MEMBERSHIP as SubscriptionType,
      product_id: WOW_ONE_YEAR_TRIAL_MEMBERSHIP_ID,
      send_notification: true,
      terms_id: WOW_ONE_YEAR_TRIAL_TERMS_ID,
      ip_address: WOW_ONE_YEAR_TRIAL_AGREEMENT_IP,
    };
    return this.createSubscription(subscriptionInput);
  };
}
