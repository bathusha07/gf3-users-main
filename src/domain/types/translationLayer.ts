import {
  AbridgedCart,
  AddressEntity,
  AgentId,
  CancellationSelectionGf2Input,
  OldPlanId,
  PreferenceTag,
  SubscriptionEntity,
  SubscriptionId,
  UserEntity,
  UserId,
  UserInput,
} from '@makegoodfood/gf3-types';
import { AnonUserInput, SubscriptionEvent } from '.';

export interface TranslationLayerService {
  cancelUser: (
    userId: UserId,
    reasons?: CancellationSelectionGf2Input,
    agentId?: AgentId,
  ) => Promise<void>;
  anonymizeGf2User: (userId: UserId, anonymizeUser: AnonUserInput) => Promise<void>;
  createGf2User: (user: TranslationCreateUser) => Promise<void>;
  createStandardCart: (userId: UserId, fsa: string) => Promise<void>;
  createMembershipSubscription: (subscription: SubscriptionEntity) => Promise<void>;
  createScheduledSubscription: (input: TranslationCreateScheduledSubscription) => Promise<void>;
  cancelSubscription: (subscription: SubscriptionEntity, agentId?: AgentId) => Promise<void>;
  extendSubscriptionTrial: (subscription: SubscriptionEntity) => Promise<void>;
  updateGf2User: (
    user: Partial<UserInput> & { id: UserId },
    address?: AddressEntity,
    couponCode?: string | null,
    agentId?: AgentId,
  ) => Promise<void>;
  updateSubscriptionDeliveryDay: (
    subscription: SubscriptionEntity,
    agentId?: AgentId,
  ) => Promise<void>;
  updateSubscriptionPlan: (userId: UserId, oldPlanId: number, agentId?: AgentId) => Promise<void>;
  updateSubscriptionDeliverySchedule: (input: TranslationUpdateDeliverySchedule) => Promise<void>;
  updateSubscriptionState: (
    userId: UserId,
    subscriptionId: SubscriptionId,
    event: SubscriptionEvent,
    agentId?: AgentId,
  ) => Promise<void>;
  updateUserPaymentDetails: (
    userId: UserId,
    stripeId: string,
    cardFingerprint?: string | null,
  ) => Promise<void>;
  updateUserPreferences: (userId: UserId, preferences: PreferenceTag[]) => Promise<void>;
  getUserCarts: (userId: UserId) => Promise<AbridgedCart[]>;
}

export type TranslationCreateUser = Pick<UserEntity, 'id' | 'email' | 'language'> & {
  fsa: string;
  referrer_id?: string;
};

export type TranslationCreateScheduledSubscription = {
  subscription: SubscriptionEntity;
  old_plan_id: OldPlanId;
  initial_cycle_date?: Date;
  invite_uuid?: string;
  referrer_id?: string;
  agent_id?: AgentId;
};

export type TranslationUpdateDeliverySchedule = {
  subscription: SubscriptionEntity;
  initial_cycle_date?: Date;
  agent_id?: AgentId;
};
