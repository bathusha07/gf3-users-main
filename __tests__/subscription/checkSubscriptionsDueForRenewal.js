const awilix = require('awilix');
const generateSubscription = require('../../factories/subscription');

describe('checkSubscriptionsDueForRenewal', () => {
  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });
  container.register({
    checkSubscriptionsDueForRenewalController: awilix.asFunction(
      require('../../controllers/subscription').checkSubscriptionsDueForRenewal
    ),
    checkSubscriptionsDueForRenewalBehaviour: awilix.asFunction(
      require('../../domain/subscription/checkSubscriptionsDueForRenewal')
    )
  });
  let pubSubProducer;
  let dummyResponse;

  describe('when requesting a check for all subscriptions due for renewal payments', () => {
    beforeEach(() => {
      pubSubProducer = jest.fn();
      dummyResponse = { sendStatus: jest.fn() };
    });

    describe('and there are none', () => {
      test('a 200 is returned', async () => {
        container.register({
          getSubscriptionsDueForRenewalRepository: awilix.asFunction(() => () => []),
          pubSubProducer: awilix.asFunction(() => pubSubProducer)
        });
        await container.cradle.checkSubscriptionsDueForRenewalController({}, dummyResponse);
        expect(container.cradle.pubSubProducer).not.toHaveBeenCalled();
        expect(dummyResponse.sendStatus).toHaveBeenCalledWith(200);
      });
    });

    describe('and there are some', () => {
      test('a PubSub event should be fired before a 200 is returned', async () => {
        const subscriptions = [generateSubscription()];
        container.register({
          getSubscriptionsDueForRenewalRepository: awilix.asFunction(() => () => subscriptions),
          pubSubProducer: awilix.asFunction(() => pubSubProducer)
        });
        await container.cradle.checkSubscriptionsDueForRenewalController({}, dummyResponse);
        expect(pubSubProducer).toBeCalledTimes(subscriptions.length);
        expect(dummyResponse.sendStatus).toHaveBeenCalledWith(200);
      });
    });
  });
});
