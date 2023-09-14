import { mock, mockClear } from 'jest-mock-extended';
import pubsub from '../../../../src/config/pubsub';
import SubscriptionMessagePublisherImpl from '../../../../src/domain/subscription/SubscriptionMessagePublisherImpl';
import { PubsubProducer } from '../../../../src/domain/types';
import generateAddress from '../../../factories/address';
import generatePreference from '../../../factories/preference';
import generateSubscription from '../../../factories/subscription';

describe('SubscriptionMessagePublisherImpl', () => {
  const mocks = {
    pubsubProducer: mock<PubsubProducer>(),
  };

  const dummySubscriptionComposite = {
    subscription: generateSubscription({ delivery_day: 'MONDAY' }),
    address: generateAddress(),
    preferences: [generatePreference()],
  };

  const publisher = new SubscriptionMessagePublisherImpl(mocks);

  afterEach(() => {
    Object.values(mocks).forEach(mockClear);
  });

  describe('dispatchCurationJob', () => {
    test('it sends a message to the curate subscription queue', async () => {
      void (await publisher.dispatchCurationJob(dummySubscriptionComposite));
      expect(mocks.pubsubProducer.publish).toBeCalledWith(
        expect.objectContaining({
          payload: {
            subscription_id: dummySubscriptionComposite.subscription.id,
            user_id: dummySubscriptionComposite.subscription.user_id,
            delivery_day: dummySubscriptionComposite.subscription.delivery_day,
            fsa: dummySubscriptionComposite.address.fsa,
            address_id: dummySubscriptionComposite.subscription.address_id,
            frequency_value: dummySubscriptionComposite.subscription.frequency_value,
            frequency_type: dummySubscriptionComposite.subscription.frequency_type,
            preference_codes: dummySubscriptionComposite.preferences.map((entity) => entity.tag),
          },
          topic: pubsub.topics.curateSubscriptionQueue,
          type: 'curate-subscription-job-v1',
          version: 1,
        }),
      );
    });
  });
});
