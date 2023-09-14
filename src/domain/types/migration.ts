import {
  AddressInput,
  PreferenceTag,
  ProductId,
  StripeCustomerId,
  SubscriptionEntity,
  SubscriptionId,
  SubscriptionInput,
  UserEntity,
  UserOutput,
} from '@makegoodfood/gf3-types';

export interface MigrationBehaviour {
  migrateUser: (input: MigrationInput) => Promise<UserOutput>;
}

export type MigrationAddressInput = Omit<AddressInput, 'user_id' | 'is_default'>;
export interface MigrationCardInput {
  stripe_card_id: string;
  stripe_customer_id: StripeCustomerId;
  stripe_card_token: string;
}

export type MigrationSubscriptionInput = Pick<SubscriptionEntity, 'started_at' | 'state'> &
  Pick<SubscriptionInput, 'ip_address'> & {
    gf3_subscription_id: SubscriptionId | null | undefined;
  };

export type MigrationMealkitSubscriptionInput = MigrationSubscriptionInput &
  Required<Pick<SubscriptionEntity, 'delivery_day'>> &
  Pick<SubscriptionEntity, 'coupon_code' | 'is_afterhours'> & {
    plan_id: ProductId;
  };

export interface MigrationInput {
  address: MigrationAddressInput;
  user: UserEntity;
  card?: MigrationCardInput | null;
  mealkitSubscription?: MigrationMealkitSubscriptionInput | null;
  wowSubscription?: MigrationSubscriptionInput | null;
  preference: PreferenceTag[] | undefined;
}
