import {
  AddressEntity,
  PreferenceEntity,
  SubscriptionEntity,
  UserEntity,
} from '@makegoodfood/gf3-types';
import { UserCompositeEntity } from '../types';
import Preference from './Preference';
import User from './User';
import Address from '../address/Address';
import Subscription from '../subscription/Subscription';

export default class UserComposite implements UserCompositeEntity {
  public user: UserEntity;
  public addresses: AddressEntity[];
  public subscriptions: SubscriptionEntity[];
  public preferences: PreferenceEntity[];

  public constructor({ user, addresses, subscriptions, preferences }: UserCompositeEntity) {
    this.user = new User(user);
    this.addresses = addresses.map((address) => new Address(address));
    this.subscriptions = subscriptions.map((subscription) => new Subscription(subscription));
    this.preferences = preferences.map((preference) => new Preference(preference));
  }
}
