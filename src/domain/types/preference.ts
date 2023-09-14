import {
  UserId,
  PreferenceEntity,
  PreferenceTag,
  OptionalSubscriptionId,
} from '@makegoodfood/gf3-types';

export interface PreferenceBehaviour {
  upsert: (input: PreferenceInput) => Promise<PreferenceEntity[]>;
  get: (userId: UserId, subscriptionId: OptionalSubscriptionId) => Promise<PreferenceEntity[]>;
}

export interface PreferenceRepository {
  upsert: (input: PreferenceUpdateInput) => Promise<PreferenceEntity[]>;
  getByUserIdAndSubscriptionId: (
    userId: UserId,
    subscriptionId: OptionalSubscriptionId,
  ) => Promise<PreferenceEntity[]>;
  getByUserId: (userId: UserId) => Promise<PreferenceEntity[]>;
  upsertMigratedPreferences: (
    userId: UserId,
    preference: PreferenceTag[],
  ) => Promise<PreferenceEntity[]>;
}

export interface PreferenceInput {
  userId: UserId;
  subscriptionId: OptionalSubscriptionId;
  tags: PreferenceTag[];
}

export interface PreferenceUpdateInput {
  userId: UserId;
  subscriptionId: OptionalSubscriptionId;
  toDelete: PreferenceEntity[];
  toInsert: PreferenceValue[];
}

export type PreferenceValue = Omit<PreferenceEntity, 'id'>;
