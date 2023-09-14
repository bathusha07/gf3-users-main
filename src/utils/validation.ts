import * as yup from 'yup';
import ipRegex from 'ip-regex';
import {
  GetCancellationReasonsOptions,
  MigrationAddressInput,
  MigrationCardInput,
  MigrationMealkitSubscriptionInput,
  MigrationSubscriptionInput,
  UpdateSubscriptionScheduleInput,
} from '../domain/types';
import {
  AbridgedCart,
  AddressInput,
  AgentId,
  AgreementInput,
  CancellationReasonInput,
  CancellationReasonType,
  CancellationSelectionInput,
  CancellationSelectionGf2Input,
  CardCreateMethod,
  CARD_CREATE_METHOD_TOKEN,
  CARD_CREATE_METHOD_INTENT,
  CARD_CREATE_METHOD_CREATED_CARD_TOKEN,
  CreateCardFromTokenInput,
  CreateCardFromIntentInput,
  CreateCardFromCreatedCardTokenInput,
  CreateAlreadyCreatedCardWithStripeCardIdInput,
  DayOfWeek,
  SetupIntentInput,
  SubscriptionInput,
  SubscriptionState,
  PreferenceTag,
  SubscriptionId,
  SubscriptionType,
  UserEntity,
  UserId,
  UserInput,
  CreateUserInput,
  CANCELLATION_REASON_TYPE_STATIC,
  VALID_CANCELLATION_REASON_TYPES,
  VALID_DAYS,
  VALID_TYPES,
  CardId,
  UpdateCardInput,
  PlanIds,
  EN,
  FR,
  STATE_ACTIVE,
  STATE_CANCELLED,
  STATE_TRIAL,
  TYPE_CURATED,
  TYPE_STANDARD,
  SOURCE_TYPE,
  SourceType,
} from '@makegoodfood/gf3-types';

export const optionalUserIdValidation = yup.string().label('user_id').uuid();
export const userIdValidation: yup.SchemaOf<UserId> = optionalUserIdValidation.required();

export const optionalSubscriptionIdValidation = yup.string().label('subscription_id').uuid();
export const subscriptionIdValidation: yup.SchemaOf<SubscriptionId> = optionalSubscriptionIdValidation.required();

export const dateValidation = yup.date().required();

export const deliveryDayValidation = yup.mixed<DayOfWeek>().oneOf(VALID_DAYS);
export const isAfterhoursValidation = yup.boolean().default(false);

export const subscriptionTypeValidation = yup.mixed<SubscriptionType>().oneOf(VALID_TYPES);

const commonCreateAddressRules = {
  address_line_1: yup.string().required(),
  address_line_2: yup.string(),
  company: yup.string().nullable(true),
  city: yup.string().required(),
  province_code: yup.string().length(2).uppercase().required(),
  country_code: yup.string().length(2).uppercase().required(),
  postal_code: yup
    .string()
    .uppercase()
    .required()
    .matches(/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i),
  building_type: yup.string(),
  special_instructions: yup.string().nullable(true),
};
export const addressValidation: yup.SchemaOf<AddressInput> = yup.object({
  ...commonCreateAddressRules,
  user_id: yup.string().uuid().required(),
  is_default: yup.boolean().required(),
});
export const migratedUserAddressValidation: yup.SchemaOf<MigrationAddressInput> = yup.object(
  commonCreateAddressRules,
);

const _fsaValidation = yup
  .string()
  .label('fsa')
  .matches(/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]$/);

export const fsaValidation: yup.SchemaOf<string> = _fsaValidation.required();

export const agreementValidation: yup.SchemaOf<AgreementInput> = yup.object({
  terms_id: yup.string().uuid().required(),
  user_id: yup.string().uuid().required(),
  ip_address: yup
    .string()
    .required()
    .matches(ipRegex({ exact: true })),
});

const _cardIdValidation = yup.string().label('card_id').uuid();
export const cardIdValidation: yup.SchemaOf<CardId> = _cardIdValidation.required();

export const cardCreateMethodValidation: yup.SchemaOf<CardCreateMethod> = yup
  .mixed()
  .required()
  .label('create_method')
  .oneOf([
    CARD_CREATE_METHOD_TOKEN,
    CARD_CREATE_METHOD_INTENT,
    CARD_CREATE_METHOD_CREATED_CARD_TOKEN,
  ]);

const stripeCardTokenRule = yup
  .string()
  .required()
  .matches(/tok_.*/, 'stripe_card_token must start with tok_');
const stripeCustomerIdRule = yup
  .string()
  .required()
  .matches(/cus_.*/, 'stripe_customer_id must start with cus_');
const stripeCardIdRule = yup
  .string()
  .required()
  .matches(/card_.*/, 'stripe_card_id must start with card_');
const commonCardTokenValidation = {
  user_id: yup.string().uuid().required(),
  stripe_card_token: stripeCardTokenRule,
};
export const createCardFromTokenValidation: yup.SchemaOf<CreateCardFromTokenInput> = yup.object({
  ...commonCardTokenValidation,
});
export const createCardFromCreatedCardTokenValidation: yup.SchemaOf<CreateCardFromCreatedCardTokenInput> = yup.object(
  {
    ...commonCardTokenValidation,
    stripe_customer_id: stripeCustomerIdRule,
    stripe_card_id: stripeCardIdRule,
  },
);
export const createAlreadyCreatedCardWithStripeCardIdValidation: yup.SchemaOf<CreateAlreadyCreatedCardWithStripeCardIdInput> = yup.object(
  {
    stripe_customer_id: stripeCustomerIdRule,
    stripe_card_id: stripeCardIdRule,
  },
);
export const createCardFromIntentValidation: yup.SchemaOf<CreateCardFromIntentInput> = yup.object({
  stripe_payment_method_id: yup
    .string()
    .required()
    .matches(/pm_.*/, 'stripe_payment_method_id must start with pm_'),
  stripe_customer_id: stripeCustomerIdRule,
});
export const migratedUserCardValidation: yup.SchemaOf<MigrationCardInput> = yup.object({
  stripe_card_id: stripeCardIdRule,
  stripe_customer_id: stripeCustomerIdRule,
  stripe_card_token: yup.string().required(),
});

export const updateCardValidation: yup.SchemaOf<UpdateCardInput> = yup.object({
  card_id: _cardIdValidation.required(),
  stripe_card_token: stripeCardTokenRule,
});
export const stripeCardIdValidation = stripeCardIdRule;

export const setupIntentValidation: yup.SchemaOf<SetupIntentInput> = yup.object({
  user_id: yup.string().uuid().required(),
  requester_id: yup.string().max(28).required(),
});

export const oldPlanIdValidation = yup.number().min(1).max(21);
export const planIdsValidation: yup.SchemaOf<PlanIds> = yup.object({
  plan_id: yup.string().uuid().required(),
  old_plan_id: oldPlanIdValidation.required(),
});

export const couponCodeValidation = yup.string();
export const subscriptionValidation: yup.SchemaOf<SubscriptionInput> = yup
  .object({
    user_id: yup.string().uuid().required(),
    card_id: yup.string().uuid().required(),
    address_id: yup.string().uuid(),
    terms_id: yup.string().uuid().required(),
    subscription_type: subscriptionTypeValidation.required().defined(),
    product_id: yup.string().required(),
    send_notification: yup.boolean().required(),
    ip_address: yup
      .string()
      .required()
      .matches(ipRegex({ exact: true })),
    delivery_day: deliveryDayValidation,
    is_afterhours: isAfterhoursValidation,
    plan_frequency_id: yup.number().integer(),
    initial_cycle_date: yup.date(),
    coupon_code: couponCodeValidation,
    old_plan_id: oldPlanIdValidation,
    invite_uuid: yup.string().uuid(),
    referrer_id: yup.string(),
  })
  .defined();

export const updateSubscriptionScheduleValidation: yup.SchemaOf<UpdateSubscriptionScheduleInput> = yup
  .object({
    id: yup.string().uuid().required(),
    delivery_day: deliveryDayValidation.required(),
    plan_frequency_id: yup.number().integer().required(),
    initial_cycle_date: yup.date(),
    agent_id: yup.string().uuid(),
  })
  .defined();

export const subscriptionStateValidation = yup
  .mixed<SubscriptionState>()
  .oneOf([STATE_ACTIVE, STATE_TRIAL, STATE_CANCELLED])
  .required();
export const migratedUserMealkitSubscriptionValidation: yup.SchemaOf<MigrationMealkitSubscriptionInput> = yup
  .object({
    gf3_subscription_id: yup.string().nullable().uuid(),
    ip_address: yup
      .string()
      .required()
      .matches(ipRegex({ exact: true })),
    started_at: yup.date().required(),
    plan_id: yup.string().uuid().required(),
    delivery_day: deliveryDayValidation.required(),
    is_afterhours: yup.boolean().nullable().default(false),
    coupon_code: yup.string().nullable(),
    state: subscriptionStateValidation,
  })
  .required();
export const migratedUserWowSubscriptionValidation: yup.SchemaOf<MigrationSubscriptionInput> = yup
  .object({
    gf3_subscription_id: yup.string().nullable().uuid(),
    ip_address: yup
      .string()
      .required()
      .matches(ipRegex({ exact: true })),
    started_at: yup.date().required(),
    state: subscriptionStateValidation,
  })
  .required();

const commonUserValidationRules = {
  firebase_id: yup.string().max(28).required(),
  email: yup.string().email().required(),
  phone: yup.string().matches(/^[0-9]{10}$/),
  first_name: yup.string().max(32),
  last_name: yup.string().max(32),
  language: yup.string().oneOf([EN, FR]),
};

const updateUserValidationRules = {
  ...commonUserValidationRules,
  firebase_id: yup.string().max(28),
  email: yup.string().email(),
};
export const migratedUserValidation: yup.SchemaOf<UserEntity> = yup.object({
  ...commonUserValidationRules,
  id: yup.string().uuid().required(),
  language: yup.string().oneOf([EN, FR]).required(),
});

export const migratedUserPreferenceValidation: yup.SchemaOf<
  PreferenceTag[]
> = yup.array().defined();

export const createUserValidation: yup.SchemaOf<CreateUserInput> = yup.object({
  ...commonUserValidationRules,
  language: yup.string().oneOf([EN, FR]).required(),
  fsa: yup
    .string()
    .uppercase()
    .required()
    .matches(/^[A-Z]\d[A-Z]$/),
  referrer_id: yup.string(),
});
export const updateUserValidation: yup.SchemaOf<Partial<UserInput>> = yup.object(
  updateUserValidationRules,
);

export const cancellationReasonValidation: yup.SchemaOf<CancellationReasonInput> = yup.object({
  code: yup.string().min(1).max(50).required(),
  entry_type: yup
    .mixed<CancellationReasonType>()
    .oneOf(VALID_CANCELLATION_REASON_TYPES)
    .default(CANCELLATION_REASON_TYPE_STATIC),
  priority: yup.number().integer().nullable().default(null),
  is_user_visible: yup.boolean().required(),
});

// Omitting subscription_id here as that will be passed in by the controller
export const cancellationSelectionValidation: yup.SchemaOf<
  Omit<CancellationSelectionInput, 'subscription_id' | 'created_at'>[]
> = yup
  .array(
    yup
      .object({
        reason_id: yup.number().required(),
        edit_value: yup.string().max(1000).nullable(),
        agent_id: yup.string().max(36).nullable(),
        category: yup.string().max(255).nullable(),
        source: yup.mixed<SourceType>().oneOf(SOURCE_TYPE).nullable(),
      })
      .defined(),
  )
  .ensure()
  .required();

export const cancellationSelectionGf2Validation: yup.SchemaOf<CancellationSelectionGf2Input> = yup
  .object({
    notes: yup.string().max(1000).nullable(),
    reason_id: yup.number().required(),
  })
  .defined();

export const getCancellationOptionValidation: yup.SchemaOf<GetCancellationReasonsOptions> = yup.object(
  {
    is_user_visible: yup.boolean(),
  },
);

export const numericIdValidation = yup.number().defined();

export const preferenceCodesValidation: yup.SchemaOf<PreferenceTag[]> = yup
  .array(yup.string().required())
  .label('preferences')
  .required();

export const abridgedCartsValidation: yup.SchemaOf<AbridgedCart[]> = yup
  .array()
  .of(
    yup
      .object({
        id: yup.string().nullable().defined(),
        delivery_date: yup.string().required(),
        type: yup.mixed().oneOf([TYPE_CURATED, TYPE_STANDARD]).required(),
        status: yup.string().required(),
        item_count: yup.number().integer().required(),
      })
      .required(),
  )
  .min(0)
  .ensure()
  .required()
  .label('abridged_carts');

export const adminUpdateValidation: yup.SchemaOf<AgentId> = yup.string().uuid().required();
export const adminUpdateUserValidation: yup.SchemaOf<
  Partial<UserInput> & { agent_id: AgentId }
> = yup.object({
  ...updateUserValidationRules,
  agent_id: adminUpdateValidation,
});
