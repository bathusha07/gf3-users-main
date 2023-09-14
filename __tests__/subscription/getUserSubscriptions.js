const awilix = require('awilix');
const dummyResponse = require('../../factories/dummyResponse');
const generateUser = require('../../factories/user');
const generateSubscription = require('../../factories/subscription');
const Subscription = require('../../domain/subscription/entity');
const { User } = require('../../domain/user/data');

describe('getUserSubscriptions', () => {

  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });
  container.register({
    getUserSubscriptionsController: awilix.asFunction(require('../../controllers/subscription').getUserSubscriptions),
    getUserSubscriptionsBehaviour: awilix.asFunction(require('../../domain/subscription/getUserSubscriptions')),
  });

  describe('when requesting a user\'s subscriptions', () => {
    describe('and no user by the specified ID is found', () => {
      test('an error 404 should be thrown', async () => {

        const dummyUser = generateUser();
        container.register({
          getUserRepository: awilix.asFunction(() => () => null),
          getUserSubscriptionsRepository: awilix.asFunction(() => () => [])
        });

        const req = {
          params: { id: dummyUser.id },
        };
        const next = jest.fn();
        await container.cradle.getUserSubscriptionsController(req, {}, next);
        expect(next.mock.calls[0][0].message).toEqual(`User with ID ${dummyUser.id} not found`);
        expect(next.mock.calls[0][0].statusCode).toEqual(404);
      });
    });

    describe('and a user by the specified ID is found', () => {
      const inMemoryUser = User(generateUser());

      describe('and there are no subscriptions for that user', () => {
        test('an empty array should be returned', async () => {

          container.register({
            getUserRepository: awilix.asFunction(() => () => inMemoryUser),
            getUserSubscriptionsRepository: awilix.asFunction(() => () => [])
          });

          const req = {
            params: { id: inMemoryUser.id },
          };
          const res = dummyResponse();
          await container.cradle.getUserSubscriptionsController(req, res);
          expect(res.json.mock.calls[0][0]).toStrictEqual([]);
        });
      });

      describe('and a list of subscriptions are found for the user', () => {
        const inMemorySubscriptions = [
          new Subscription(generateSubscription()),
          new Subscription(generateSubscription())
        ];

        test('the subscription list should be returned in an array', async () => {

          container.register({
            getUserRepository: awilix.asFunction(() => () => inMemoryUser),
            getUserSubscriptionsRepository: awilix.asFunction(() => () => inMemorySubscriptions)
          });

          const req = {
            params: { id: inMemoryUser.id },
          };
          const res = dummyResponse();
          await container.cradle.getUserSubscriptionsController(req, res);
          expect(res.json.mock.calls[0][0].length).toEqual(2);
          expect(res.json.mock.calls[0][0][0].id).toEqual(inMemorySubscriptions[0].id);
          expect(res.json.mock.calls[0][0][1].id).toEqual(inMemorySubscriptions[1].id);
        });
      });
    });
  });
});
