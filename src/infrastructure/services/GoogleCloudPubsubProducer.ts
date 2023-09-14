// TODO: move this file (and copy ServiceError) into the gcf3f-lib repo

import { Event, PubsubProducer } from '../../domain/types';
import { PubSub } from '@google-cloud/pubsub';
import { Envelope } from '@makegoodfood/gf3cf-lib';
import { v4 as uuidv4 } from 'uuid';
import ServiceError from '../../domain/errors/ServiceError';
import pubsub from '../../config/pubsub';

export const GOOGLE_PUB_SUB_SERVICE_NAME = 'Google Pub/Sub';

export default class GoogleCloudPubsubProducer implements PubsubProducer {
  private pubsubClient: PubSub;
  public constructor() {
    this.pubsubClient = new PubSub(pubsub.clientConfig);
  }

  public publish = async <T>(event: Event<T>): Promise<void> => {
    const topic = this.pubsubClient.topic(event.topic);
    const envelope = new Envelope({
      id: uuidv4(),
      // this next line differs from order service impl
      idempotency_key: event.idempotencyKey ?? uuidv4(),
      event_type: event.type,
      event_timestamp: new Date(),
      data_version: event.version,
      data: event.payload,
      envelope_version: event.version,
    });
    try {
      await topic.publish(envelope.serialize());
    } catch (error) {
      // TODO: replace the following with real logging once we have a solution
      console.log(`Error when attempting to publish to topic ${event.topic}`);
      // TODO: when moving to gf3cf-lib, use more complex ServiceError impl (as in Orders repo)
      //throw new ServiceError(this.constructor.name, error as Error);
      throw new ServiceError(GOOGLE_PUB_SUB_SERVICE_NAME, this.constructor.name);
    }
  };
}
