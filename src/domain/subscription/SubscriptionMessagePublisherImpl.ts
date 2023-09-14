import {
  PubsubProducer,
  SubscriptionCompositeEntity,
  SubscriptionMessagePublisher,
} from '../types';
import { v4 as uuidv4 } from 'uuid';
import { SubscriptionCurationEventV1 } from '@makegoodfood/gf3cf-lib';
import DeliveryDay from './valueObjects/DeliveryDay';
import pubsub from '../../config/pubsub';

export default class SubscriptionMessagePublisherImpl implements SubscriptionMessagePublisher {
  private pubsubProducer: PubsubProducer;

  public constructor({ pubsubProducer }: { pubsubProducer: PubsubProducer }) {
    this.pubsubProducer = pubsubProducer;
  }

  public dispatchCurationJob = ({
    subscription,
    address,
    preferences,
  }: SubscriptionCompositeEntity): Promise<void> => {
    const deliveryDay = new DeliveryDay(subscription.delivery_day);

    const message: SubscriptionCurationEventV1 = {
      subscription_id: subscription.id,
      user_id: subscription.user_id,
      delivery_day: deliveryDay.getDeliveryDay(),
      fsa: address?.fsa ?? '',
      address_id: subscription.address_id ?? '',
      frequency_value: subscription.frequency_value,
      frequency_type: subscription.frequency_type,
      preference_codes: preferences.map((entity) => entity.tag),
    };
    return this.pubsubProducer.publish<SubscriptionCurationEventV1>({
      payload: message,
      topic: pubsub.topics.curateSubscriptionQueue,
      type: 'curate-subscription-job-v1',
      version: 1,
      idempotencyKey: uuidv4(),
    });
  };
}
