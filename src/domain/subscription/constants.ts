import { STATE_ACTIVE, STATE_TRIAL, SubscriptionState } from '@makegoodfood/gf3-types';
import { SubscriptionEvent } from '../types';

export const ACTION_NULL_BILLING_CYCLE = 'NULL_BILLING_CYCLE';
export const ACTION_NEXT_CHARGE_DATE = 'NEXT_CHARGE_DATE';

export const EVENT_FAILED = 'failed';
export const EVENT_PAUSE = 'pause';
export const EVENT_TRIAL = 'trial';
export const EVENT_ENDTRIAL = 'endtrial';
export const EVENT_ACTIVATE = 'activate';
export const EVENT_CANCELLATION = 'cancellation';
export const EVENT_CANCEL = 'cancel';
export const VALID_EVENTS: SubscriptionEvent[] = [
  EVENT_FAILED,
  EVENT_PAUSE,
  EVENT_TRIAL,
  EVENT_ENDTRIAL,
  EVENT_ACTIVATE,
  EVENT_CANCELLATION,
  EVENT_CANCEL,
];

export const ACTIVE_SUBSCRIPTION_STATES: SubscriptionState[] = [STATE_ACTIVE, STATE_TRIAL];

export const SUBSCRIPTION_RENEWAL_EVENT_TYPE = 'subscription-renewal';
export const SUBSCRIPTION_RENEWAL_EVENT_VERSION = 1;
export const SUBSCRIPTION_CREATED_EVENT_TYPE = 'user-subscription-created';
export const SUBSCRIPTION_CREATED_EVENT_VERSION = 1;
export const SUBSCRIPTION_DELIVERY_DAY_UPDATED_EVENT_TYPE =
  'user-subscription-delivery-day-updated';
export const SUBSCRIPTION_DELIVERY_DAY_UPDATED_EVENT_VERSION = 1;

export const STR_SUBSCRIPTION_TYPE = 'subscription_type';

export const WOW_ONE_YEAR_TRIAL_MEMBERSHIP_ID = '6e224910-a9c8-4b8f-8263-20c17c2b5f78';
export const WOW_ONE_YEAR_TRIAL_TERMS_ID = 'd9021c50-1ae1-496e-8411-c09797858844';
export const WOW_ONE_YEAR_TRIAL_AGREEMENT_IP = 'internal admin action';

export const FREQUENCY_TYPE_DAY = 'DAY';
