const awilix = require('awilix');
const generateDummyResponse = require('../../factories/dummyResponse');
const generateSubscription = require('../../factories/subscription');
const Subscription = require('../../domain/subscription/entity');
const subscriptionConstants = require('../../domain/subscription/constants');
const dateConstants = require('../../domain/date/constants');

describe('updateSubscriptionDeliveryDay', () => {
  const dummySubscriptionId = '53a5de9e-8a95-4a2e-a269-d34128d0756b';
  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });
  container.register({
    updateSubscriptionDeliveryDayController: awilix.asFunction(require('../../controllers/subscription').updateSubscriptionDeliveryDay),
    updateSubscriptionDeliveryDayBehaviour: awilix.asFunction(require('../../domain/subscription/updateSubscriptionDeliveryDay')),
  });
  beforeEach(() => {
    container.register({
      getSubscriptionRepository: awilix.asFunction(() => () => true),
      updateSubscriptionRepository: awilix.asFunction(() => (subscription) => new Subscription(subscription))
    });
  });

  describe('when no matching subscription exists', () => {

    test('updating delivery day results in an error', async () => {
      container.register({
        getSubscriptionRepository: awilix.asFunction(() => () => null),
      });
      const req = {
        params: {
          id: dummySubscriptionId
        },
        body: {
          'delivery_day': 'TUESDAY'
        }
      };
      const next = jest.fn();
      await container.cradle.updateSubscriptionDeliveryDayController(req, {}, next);
      expect(next.mock.calls[0][0].message).toEqual(`Subscription with ID ${dummySubscriptionId} not found`);
      expect(next.mock.calls[0][0].statusCode).toEqual(404);
    });

  });

  describe('when a matching subscription exists', () => {
    describe('when updating a SCHEDULED subscription', () => {

      const dummySubscription = generateSubscription();
      dummySubscription.subscription_type = subscriptionConstants.TYPE_SCHEDULED;
      dummySubscription.delivery_day = dateConstants.DAY_SUNDAY;
      beforeEach(() => {
        container.register({
          getSubscriptionRepository: awilix.asFunction(() => () => dummySubscription)
        });
      });

      test('updating with a valid day results in the subscription delivery_day being changed', async () => {
        const newDeliveryDay = dateConstants.DAY_TUESDAY;
        const req = {
          params: {
            id: dummySubscriptionId
          },
          body: {
            'delivery_day': newDeliveryDay
          }
        };
        const res = generateDummyResponse();
        await container.cradle.updateSubscriptionDeliveryDayController(req, res);
        expect(res.json.mock.calls[0][0].id).toEqual(dummySubscription.id);
        expect(res.json.mock.calls[0][0].delivery_day).toEqual(newDeliveryDay);
      });

      test('updating with the same delivery day results in success with no change to the subscription', async () => {
        const updateSubscriptionRepositoryMock = jest.fn();
        container.register({
          updateSubscriptionRepository: awilix.asFunction(() => () => updateSubscriptionRepositoryMock())
        });
        const req = {
          params: {
            id: dummySubscriptionId
          },
          body: {
            'delivery_day': dummySubscription.delivery_day
          }
        };
        const res = generateDummyResponse();
        await container.cradle.updateSubscriptionDeliveryDayController(req, res);
        expect(res.json.mock.calls[0][0].id).toEqual(dummySubscription.id);
        expect(res.json.mock.calls[0][0].delivery_day).toEqual(dummySubscription.delivery_day);
        expect(updateSubscriptionRepositoryMock).not.toHaveBeenCalled();
      });

      test('updating with an invalid day results in an error', async () => {
        const badDeliveryDay = 'SATURNDAY';
        const req = {
          params: {
            id: dummySubscriptionId
          },
          body: {
            'delivery_day': badDeliveryDay
          }
        };
        const next = jest.fn();
        await container.cradle.updateSubscriptionDeliveryDayController(req, {}, next);
        expect(next.mock.calls[0][0].message).toEqual(`Invalid delivery day. Day must be one of: MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY`);
        expect(next.mock.calls[0][0].statusCode).toEqual(422);
      });

    });

    describe('when updating a non-SCHEDULED subscription', () => {
      test('updating results in an error', async () => {
        const dummySubscription = generateSubscription();
        dummySubscription.subscription_type = subscriptionConstants.TYPE_MEMBERSHIP;
        container.register({
          getSubscriptionRepository: awilix.asFunction(() => () => dummySubscription),
        });
        const req = {
          params: {
            id: dummySubscriptionId
          },
          body: {
            'delivery_day': 'MONDAY'
          }
        };
        const next = jest.fn();
        await container.cradle.updateSubscriptionDeliveryDayController(req, {}, next);
        expect(next.mock.calls[0][0].message).toEqual(`Cannot update field delivery_day on a MEMBERSHIP type subscription`);
        expect(next.mock.calls[0][0].statusCode).toEqual(422);
      });
    });
  });
});
