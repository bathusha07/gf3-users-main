import axios, { AxiosInstance } from 'axios';
import {
  AbridgedCart,
  AddressEntity,
  AgentId,
  CancellationSelectionGf2Input,
  SubscriptionEntity,
  SubscriptionId,
  TYPE_MEMBERSHIP,
  UserId,
  UserInput,
  PreferenceTag,
} from '@makegoodfood/gf3-types';
import InfrastructureService from '../../InfrastructureService';
import {
  AnonUserInput,
  SubscriptionEvent,
  TranslationCreateScheduledSubscription,
  TranslationCreateUser,
  TranslationLayerService,
  TranslationUpdateDeliverySchedule,
} from '../../../domain/types';
import {
  TRANSLATION_LAYER_SERVICE_NAME,
  TRANSLATION_LAYER_SERVICE_URL,
  TRANSLATION_LAYER_AUTH_TOKEN,
  TRANSLATION_LAYER_HOST,
} from './index';
import ServiceError from '../../../domain/errors/ServiceError';
import { abridgedCartsValidation } from '../../../utils/validation';

const MEMBERSHIP_CODE_WOW = 'wow';

export default class TranslationLayerServiceImpl
  extends InfrastructureService
  implements TranslationLayerService {
  protected axiosClient: AxiosInstance;

  public constructor() {
    super();
    this.axiosClient = axios.create({
      baseURL: `${TRANSLATION_LAYER_SERVICE_URL}/api/translation`,
      headers: {
        Authorization: `Bearer ${TRANSLATION_LAYER_AUTH_TOKEN}`,
        Host: `${TRANSLATION_LAYER_HOST}`,
      },
    });
  }

  public cancelUser = this.responseHandler(
    async (
      userId: UserId,
      reasons?: CancellationSelectionGf2Input,
      agentId?: AgentId,
    ): Promise<void> => {
      void (await this.axiosClient.post(`/user/${userId}/cancel`, {
        agent_id: agentId,
        reasons: reasons,
        // TODO: handle sending reasons. Should this be the same data used in this service (ie
        // CancellationSelection) or more gf2-friendly reason ids/text to be saved in
        // account_actions and related tables?
      }));
    },
  );

  public anonymizeGf2User = this.responseHandler(
    async (userId: UserId, anonymizeUser: AnonUserInput): Promise<void> => {
      void (await this.axiosClient.post(`/user/${userId}/anonymize`, anonymizeUser));
    },
  );

  public createGf2User = this.responseHandler(
    async (user: TranslationCreateUser): Promise<void> => {
      void (await this.axiosClient.post('/user', {
        id: user.id,
        email: user.email,
        language: user.language,
        fsa: user.fsa,
        referrer_id: user.referrer_id,
      }));
    },
  );

  public createStandardCart = this.responseHandler(
    async (userId: UserId, fsa: string): Promise<void> => {
      void (await this.axiosClient.post(`/cart/user/${userId}/standard`, {
        fsa,
      }));
    },
  );

  public createMembershipSubscription = this.responseHandler(
    async (subscription: SubscriptionEntity): Promise<void> => {
      const translatedSubscription = {
        subscription_id: subscription.id,
        type: subscription.subscription_type,
        user_id: subscription.user_id,
        membership_code: MEMBERSHIP_CODE_WOW,
      };
      void (await this.axiosClient.post('/subscription', translatedSubscription));
    },
  );

  public createScheduledSubscription = this.responseHandler(
    async (input: TranslationCreateScheduledSubscription): Promise<void> => {
      const translatedSubscription = {
        subscription_id: input.subscription.id,
        type: input.subscription.subscription_type,
        user_id: input.subscription.user_id,
        plan_id: input.old_plan_id,
        delivery_day: input.subscription.delivery_day,
        plan_frequency_type: input.subscription.frequency_type,
        plan_frequency_value: input.subscription.frequency_value,
        initial_cycle_date: input.initial_cycle_date,
        coupon_code: input.subscription.coupon_code,
        invite_uuid: input.invite_uuid,
        referrer_id: input.referrer_id,
        agent_id: input.agent_id,
      };
      void (await this.axiosClient.post('/subscription', translatedSubscription));
    },
  );

  public cancelSubscription = this.responseHandler(
    async (subscription: SubscriptionEntity, agentId?: AgentId): Promise<void> => {
      const translatedSubscription = {
        subscription_id: subscription.id,
        type: subscription.subscription_type,
        user_id: subscription.user_id,
        ...(subscription.subscription_type == TYPE_MEMBERSHIP
          ? { membership_code: MEMBERSHIP_CODE_WOW }
          : {}),
        agent_id: agentId,
      };

      void (await this.axiosClient.delete('/subscription', {
        data: translatedSubscription,
      }));
    },
  );

  public extendSubscriptionTrial = this.responseHandler(
    async (subscription: SubscriptionEntity): Promise<void> => {
      void (await this.axiosClient.patch('/subscription/trial', {
        user_id: subscription.user_id,
        membership_code: MEMBERSHIP_CODE_WOW,
        trial_end_date: subscription.next_cycle,
      }));
    },
  );

  public updateGf2User = this.responseHandler(
    async (
      user: Partial<UserInput> & { id: UserId },
      address?: AddressEntity,
      couponCode?: string | null,
      agentId?: AgentId,
    ): Promise<void> => {
      void (await this.axiosClient.patch('/user', {
        ...user,
        address,
        coupon_code: couponCode,
        remove_coupon: couponCode === null,
        agent_id: agentId,
      }));
    },
  );

  public updateSubscriptionDeliveryDay = this.responseHandler(
    async (subscription: SubscriptionEntity, agentId?: AgentId): Promise<void> => {
      void (await this.axiosClient.patch('/subscription/delivery-day', {
        user_id: subscription.user_id,
        delivery_day: subscription.delivery_day,
        is_afterhours: subscription.is_afterhours,
        agent_id: agentId,
      }));
    },
  );

  public updateSubscriptionPlan = this.responseHandler(
    async (userId: UserId, oldPlanId: number, agentId?: AgentId): Promise<void> => {
      void (await this.axiosClient.patch('/subscription/plan', {
        user_id: userId,
        plan_id: oldPlanId,
        agent_id: agentId,
      }));
    },
  );

  public updateSubscriptionDeliverySchedule = this.responseHandler(
    async (input: TranslationUpdateDeliverySchedule): Promise<void> => {
      void (await this.axiosClient.patch('/subscription/delivery-schedule', {
        user_id: input.subscription.user_id,
        delivery_day: input.subscription.delivery_day,
        agent_id: input.agent_id,
        plan_frequency_type: input.subscription.frequency_type,
        plan_frequency_value: input.subscription.frequency_value,
        initial_cycle_date: input.initial_cycle_date,
      }));
    },
  );

  public updateSubscriptionState = this.responseHandler(
    async (
      userId: UserId,
      subscriptionId: SubscriptionId,
      event: SubscriptionEvent,
      agentId?: AgentId,
    ): Promise<void> => {
      void (await this.axiosClient.post(`/subscription/${event}`, {
        user_id: userId,
        subscription_id: subscriptionId,
        agent_id: agentId,
      }));
    },
  );

  public updateUserPaymentDetails = this.responseHandler(
    async (userId: UserId, stripeId: string, cardFingerprint?: string | null): Promise<void> => {
      void (await this.axiosClient.patch(`user/${userId}/payment_details`, {
        stripe_id: stripeId,
        stripe_card_fingerprint: cardFingerprint,
      }));
    },
  );

  public updateUserPreferences = this.responseHandler(
    async (userId: UserId, preferences: PreferenceTag[]): Promise<void> => {
      void (await this.axiosClient.patch(`user/${userId}/preferences`, {
        preferences,
      }));
    },
  );

  public getUserCarts = async (userId: UserId): Promise<AbridgedCart[]> => {
    const response = await this.axiosClient.get(`cart/user/${userId}`);
    return (await abridgedCartsValidation.validate(response.data)) ?? [];
  };

  protected handleError = (error: Error): Error => {
    if (!axios.isAxiosError(error)) {
      return error;
    }

    if (error.response) {
      try {
        console.error(JSON.stringify(error));
      } catch (error) {
        // Ignore circular JSON errors if they occur for any reason
      }
      const statusCode = error.response.status;
      return new ServiceError(
        TRANSLATION_LAYER_SERVICE_NAME,
        `${statusCode}`,
        error.response.status,
        error.response.data,
      );
    }
    return new ServiceError(
      TRANSLATION_LAYER_SERVICE_NAME,
      `Could not be reached: ${error.message}`,
    );
  };
}
