import { AddressEntity, PreferenceEntity, SubscriptionEntity } from '@makegoodfood/gf3-types';
import Address from '../address/Address';
import { SubscriptionCompositeEntity } from '../types';
import Preference from '../user/Preference';
import Subscription from './Subscription';

export default class SubscriptionComposite implements SubscriptionCompositeEntity {
  public subscription: SubscriptionEntity;
  public address: AddressEntity | null;
  public preferences: PreferenceEntity[];

  public constructor({ subscription, address, preferences }: SubscriptionCompositeEntity) {
    this.subscription = new Subscription(subscription);
    this.address = address ? new Address(address) : null;
    this.preferences = preferences.map((preference) => new Preference(preference));
  }
}
