import {
  AgentId,
  CancellationReasonEntity,
  CancellationReasonId,
  CancellationReasonInput,
  CancellationSelectionEntity,
  CancellationSelectionInput,
  DayOfWeek,
  UserId,
  SubscriptionEntity,
  SubscriptionId,
  SubscriptionInput,
  AddressEntity,
  PreferenceEntity,
  SubscriptionProduct,
  OldPlanId,
  PlanId,
  SubscriptionType,
  MembershipEntity,
  MembershipPriceEntity,
  PlanFrequencyId,
} from '@makegoodfood/gf3-types';

export interface SubscriptionBehaviour {
  cancelSubscription: (
    id: SubscriptionId,
    inputs: CancellationSelectionInput[],
    agentId?: AgentId,
  ) => Promise<CancellationSelectionEntity[]>;
  cancelUserSubscriptions: (
    userId: UserId,
    reasons: Omit<CancellationSelectionInput, 'subscription_id'>[],
    agentId?: AgentId,
  ) => Promise<void>;
  createSubscription: (input: SubscriptionInput) => Promise<SubscriptionEntity>;
  createSubscriptionFromLastCancelledSubscription: (
    userId: UserId,
    type: SubscriptionType,
    now: Date,
    oldPlanId?: OldPlanId,
    agentId?: AgentId,
  ) => Promise<SubscriptionEntity>;
  curateScheduledSubscriptions: (now: Date) => Promise<void>;
  checkSubscriptionsDueForRenewal: (now: Date) => Promise<void>;
  extendSubscriptionTrial: (id: SubscriptionId, trialEnd: Date) => Promise<SubscriptionEntity>;
  getCancellationSelections: (id: SubscriptionId) => Promise<CancellationSelectionEntity[]>;
  getSubscription: (id: SubscriptionId) => Promise<SubscriptionEntity>;
  getSubscriptionMembership: (
    id: SubscriptionId,
  ) => Promise<(MembershipEntity & { price: MembershipPriceEntity }) | null>;
  getUserSubscriptions: (id: UserId) => Promise<SubscriptionEntity[]>;
  transitionSubscriptionState: (
    subscription: SubscriptionEntity,
    event: SubscriptionEvent,
    now: Date,
  ) => SubscriptionEntity;
  updateSubscriptionCoupon: (
    id: SubscriptionId,
    couponCode: string | null,
    agentId?: AgentId,
  ) => Promise<SubscriptionEntity>;
  updateSubscriptionDeliveryDay: (
    id: SubscriptionId,
    deliveryDay: DayOfWeek,
    isAfterhours: boolean,
    agentId?: AgentId,
  ) => Promise<SubscriptionEntity>;
  updateSubscriptionDeliverySchedule: (
    input: UpdateSubscriptionScheduleInput,
  ) => Promise<SubscriptionEntity>;
  updateSubscriptionPlan: (
    id: SubscriptionId,
    planId: PlanId,
    oldPlanId: number,
    agentId?: AgentId,
  ) => Promise<SubscriptionEntity>;
  updateSubscriptionState: (
    id: SubscriptionId,
    event: SubscriptionEvent,
    agentId?: AgentId,
  ) => Promise<SubscriptionEntity>;
  getLastCancelledSubscription: (
    userId: UserId,
    type?: SubscriptionType,
  ) => Promise<LastCancelledSubscription | null>;
  createMembershipSubscriptionTrial: (userId: UserId) => Promise<SubscriptionEntity>;
}

export interface CancellationReasonBehaviour {
  createReason: (input: CancellationReasonInput) => Promise<CancellationReasonEntity>;
  updateReason: (input: CancellationReasonEntity) => Promise<CancellationReasonEntity>;
  deleteReason: (id: CancellationReasonId) => Promise<void>;
  getReasons: (opts?: GetCancellationReasonsOptions) => Promise<CancellationReasonEntity[]>;
}

export interface SubscriptionRepository {
  createSubscription: (input: SubscriptionEntity) => Promise<SubscriptionEntity>;
  getSubscription: (id: SubscriptionId) => Promise<SubscriptionEntity>;
  getActiveUserSubscriptions: (id: UserId) => Promise<SubscriptionEntity[]>;
  getUserSubscriptions: (id: UserId) => Promise<SubscriptionEntity[]>;
  getSubscriptionsDueForCuration: (now: Date) => Promise<SubscriptionEntity[]>;
  getSubscriptionsDueForRenewal: (now: Date) => Promise<SubscriptionEntity[]>;
  getMatchingSubscription: (input: SubscriptionEntity) => Promise<SubscriptionEntity | null>;
  updateSubscription: (input: SubscriptionEntity) => Promise<SubscriptionEntity>;
  updateSubscriptionWithCancellationSelections: (
    subscription: SubscriptionEntity,
    input: CancellationSelectionInput[],
  ) => Promise<CancellationSelectionEntity[]>;
  getCancellationSelectionsBySubscriptionId: (
    id: SubscriptionId,
  ) => Promise<CancellationSelectionEntity[]>;
  getSubscriptionComposite: (id: SubscriptionId) => Promise<SubscriptionCompositeEntity>;
  getLastCancelledSubscription: (
    userId: UserId,
    type?: SubscriptionType,
  ) => Promise<SubscriptionEntity | null>;
}

export interface CancellationReasonRepository {
  getReason: (id: CancellationReasonId) => Promise<CancellationReasonEntity>;
  getReasons: (opts?: GetCancellationReasonsOptions) => Promise<CancellationReasonEntity[]>;
  createReason: (input: CancellationReasonInput) => Promise<CancellationReasonEntity>;
  updateReason: (input: CancellationReasonEntity) => Promise<CancellationReasonEntity>;
  deleteReason: (id: CancellationReasonId, now: Date) => Promise<void>;
}

export interface SubscriptionProductFetcher {
  getSubscriptionProduct: (input: SubscriptionEntity) => Promise<SubscriptionProduct>;
}

export interface SubscriptionValuesFactory {
  subscriptionValues: (input: SubscriptionInput) => Promise<SubscriptionValue>;
}

export interface DeliveryDayValueObject {
  getDeliveryDay: () => DayOfWeek;
  validate: (day: DayOfWeek) => DayOfWeek;
}

export interface CancellationSelectionValueObject {
  validate: (reason: CancellationReasonEntity) => CancellationSelectionEntity['edit_value'];
}

export interface GetCancellationReasonsOptions {
  is_user_visible?: boolean;
}

export interface SubscriptionMessagePublisher {
  dispatchCurationJob: (subscriptionComposite: SubscriptionCompositeEntity) => Promise<void>;
}

export interface SubscriptionCompositeEntity {
  subscription: SubscriptionEntity;
  address: AddressEntity | null;
  preferences: PreferenceEntity[];
}

export interface SubscriptionValue {
  createValues: SubscriptionCreateValues;
  product: SubscriptionProduct;
}

export interface LastCancelledSubscription {
  create_payload: Omit<SubscriptionInput, 'ip_address'> | null;
  product: SubscriptionProduct | null;
}

export type SubscriptionCreateValues = Pick<
  SubscriptionEntity,
  'product_id' | 'frequency_type' | 'frequency_value' | 'state' | 'next_cycle' | 'delivery_day'
>;

export type SubscriptionEvent =
  | 'failed'
  | 'pause'
  | 'trial'
  | 'endtrial'
  | 'activate'
  | 'cancellation'
  | 'cancel';

export type UpdateSubscriptionScheduleInput = {
  id: SubscriptionId;
  delivery_day: DayOfWeek;
  plan_frequency_id: PlanFrequencyId;
  initial_cycle_date?: Date;
  agent_id?: AgentId;
};
