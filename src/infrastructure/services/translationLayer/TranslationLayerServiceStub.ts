/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import {
  AbridgedCart,
  AddressEntity,
  AgentId,
  CancellationSelectionGf2Input,
  OldPlanId,
  PreferenceTag,
  SubscriptionEntity,
  SubscriptionId,
  UserId,
  UserInput,
} from '@makegoodfood/gf3-types';
import {
  AnonUserInput,
  SubscriptionEvent,
  TranslationCreateScheduledSubscription,
  TranslationCreateUser,
  TranslationLayerService,
  TranslationUpdateDeliverySchedule,
} from '../../../domain/types';

export default class TranslationLayerServiceStub implements TranslationLayerService {
  public cancelUser = async (
    userId: UserId,
    reasons?: CancellationSelectionGf2Input,
    agentId?: AgentId,
  ): Promise<void> => {};

  public anonymizeGf2User = async (
    userId: UserId,
    anonymizeUser: AnonUserInput,
  ): Promise<void> => {};
  public createGf2User = async (user: TranslationCreateUser): Promise<void> => {};
  public createMembershipSubscription = async (
    subscription: SubscriptionEntity,
  ): Promise<void> => {};
  public createScheduledSubscription = async (
    input: TranslationCreateScheduledSubscription,
  ): Promise<void> => {};
  public createStandardCart = async (userId: UserId, fsa: string): Promise<void> => {};
  public cancelSubscription = async (
    subscription: SubscriptionEntity,
    agentId?: AgentId,
  ): Promise<void> => {};
  public extendSubscriptionTrial = async (subscription: SubscriptionEntity): Promise<void> => {};
  public updateGf2User = async (
    user: Partial<UserInput> & { id: UserId },
    address?: AddressEntity,
    couponCode?: string | null,
    agentId?: AgentId,
  ): Promise<void> => {};
  public updateSubscriptionDeliveryDay = async (
    subscription: SubscriptionEntity,
    agentId?: AgentId,
  ): Promise<void> => {};
  public updateSubscriptionPlan = async (
    userId: UserId,
    oldPlanId: number,
    agentId?: AgentId,
  ): Promise<void> => {};
  public updateSubscriptionDeliverySchedule = async (
    input: TranslationUpdateDeliverySchedule,
  ): Promise<void> => {};
  public updateSubscriptionState = async (
    userId: UserId,
    subscriptionId: SubscriptionId,
    event: SubscriptionEvent,
    agentId?: AgentId,
  ): Promise<void> => {};
  public updateUserPaymentDetails = async (userId: UserId, stripeId: string): Promise<void> => {};
  public updateUserPreferences = async (
    userId: UserId,
    preferences: PreferenceTag[],
  ): Promise<void> => {};
  public getUserCarts = async (userId: UserId): Promise<AbridgedCart[]> => {
    return [];
  };
}
