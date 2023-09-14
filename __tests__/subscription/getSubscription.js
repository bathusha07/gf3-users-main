const awilix = require('awilix');
const dummyResponse = require('../../factories/dummyResponse');
const generateSubscription = require('../../factories/subscription');
const Subscription = require('../../domain/subscription/entity');

describe('getSubscription', () => {

  const inMemorySubscription = generateSubscription();
  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });
  container.register({
    getSubscriptionController: awilix.asFunction(require('../../controllers/subscription').getSubscription),
    getSubscriptionBehaviour: awilix.asFunction(require('../../domain/subscription/getSubscription')),
    getSubscriptionRepository: awilix.asFunction(
      () => (id) => id === inMemorySubscription.id ? new Subscription(inMemorySubscription) : null
    )
  });

  test('an existing subscription should be found, given the id', async () => {
    const req = {
      params: {
        id: inMemorySubscription.id
      },
    };
    const res = dummyResponse();
    await container.cradle.getSubscriptionController(req, res);
    expect(res.json.mock.calls[0][0].id).toEqual(inMemorySubscription.id);
  });

  test('a bad id should result in a subscription not found message', async () => {
    const badId = '2d75c9d3-dc14-4ceb-a02e-0ddea5b1c4e4';
    const req = {
      params: {
        id: badId
      },
    };
    const next = jest.fn();
    await container.cradle.getSubscriptionController(req, {}, next);
    expect(next.mock.calls[0][0].message).toEqual(`Subscription with ID ${badId} not found`);
    expect(next.mock.calls[0][0].statusCode).toEqual(404);
  });
});
