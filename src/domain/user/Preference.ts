import {
  PreferenceEntity,
  PreferenceId,
  UserId,
  OptionalSubscriptionId,
  PreferenceTag,
} from '@makegoodfood/gf3-types';

export default class Preference implements PreferenceEntity {
  public id: PreferenceId;
  public user_id: UserId;
  public subscription_id: OptionalSubscriptionId;
  public tag: PreferenceTag;

  public constructor(input: PreferenceEntity) {
    this.id = input.id;
    this.user_id = input.user_id;
    this.subscription_id = input.subscription_id;
    this.tag = input.tag;
  }
}
