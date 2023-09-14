const awilix = require('awilix');
const generateAgreement = require('../../factories/agreement');
const generateDummyResponse = require('../../factories/dummyResponse');
const generateMembership = require('../../factories/membership');
const generatePlan = require('../../factories/plan');
const generatePlanFrequency = require('../../factories/planFrequency');
const generateSubscription = require('../../factories/subscription');
const {
  generateMembershipSubscriptionRequest,
  generateScheduledSubscriptionRequest
} = require('../../factories/subscriptionRequest');
const subscriptionConstants = require('../../domain/subscription/constants');
const uuidregex = require('uuid-regexp');

describe('createSubscription', () => {

  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });
  container.register({
    createSubscriptionController: awilix.asFunction(require('../../controllers/subscription').createSubscription),
    createSubscriptionBehaviour: awilix.asFunction(require('../../domain/subscription/createSubscription')),
    createSubscriptionRepository: awilix.asFunction(() => (subscription) => subscription),
    createAgreementBehaviour: awilix.asFunction(() => () => generateAgreement()),
    calculateNextCycleBehaviour: awilix.asFunction(() => () => new Date()),
    getCurrentDateBehaviour: awilix.asFunction(() => () => new Date()),
    pubSubProducer: awilix.asFunction(() => () => true)
  });
  beforeEach(() => {
    container.register({
      getUserRepository: awilix.asFunction(() => () => true),
      getCardForUserRepository: awilix.asFunction(() => () => true),
      getAddressForUserRepository: awilix.asFunction(() => () => true),
      getAgreementRepository: awilix.asFunction(() => () => true),
      getMembershipRepository: awilix.asFunction(() => () => true),
      getPlanRepository: awilix.asFunction(() => () => true),
      getPlanFrequencyRepository: awilix.asFunction(() => () => true),
      getMatchingSubscriptionRepository: awilix.asFunction(() => () => null),
    });
  });

  describe('when no matching subscription exists', () => {

    test('creating a subscription auto generates an id', async () => {
      const dummyRequest = generateMembershipSubscriptionRequest();
      const req = {
        body: dummyRequest
      };
      const res = generateDummyResponse();
      await container.cradle.createSubscriptionController(req, res);
      expect(uuidregex().test(res.json.mock.calls[0][0].id)).toEqual(true);
    });

    test('creating a subscription with a malformed request generates a validation error', async () => {
      const dummyRequest = generateMembershipSubscriptionRequest();
      dummyRequest.send_notification = "not a boolean";
      const req = {
        body: dummyRequest
      };
      const next = jest.fn();
      await container.cradle.createSubscriptionController(req, generateDummyResponse(), next);
      expect(next.mock.calls[0][0].message).toEqual('send_notification must be a `boolean` type, but the final value was: `"not a boolean"`.');
      expect(next.mock.calls[0][0].statusCode).toEqual(400);
    });

    test('creating a subscription with a bad user id generates an error', async () => {
      container.register({
        getUserRepository: awilix.asFunction(() => () => null),
      });
      const dummyRequest = generateMembershipSubscriptionRequest();
      const req = {
        body: dummyRequest
      };
      const next = jest.fn();
      await container.cradle.createSubscriptionController(req, generateDummyResponse(), next);
      expect(next.mock.calls[0][0].message).toEqual(`User with ID ${dummyRequest.user_id} not found`);
      expect(next.mock.calls[0][0].statusCode).toEqual(422);
    });

    test('creating a subscription with a bad card id generates an error', async () => {
      container.register({
        getCardForUserRepository: awilix.asFunction(() => () => null),
      });
      const dummyRequest = generateMembershipSubscriptionRequest();
      const req = {
        body: dummyRequest
      };
      const next = jest.fn();
      await container.cradle.createSubscriptionController(req, generateDummyResponse(), next);
      expect(next.mock.calls[0][0].message).toEqual(`Card with ID ${dummyRequest.card_id} not found`);
      expect(next.mock.calls[0][0].statusCode).toEqual(422);
    });

    test('creating a subscription with a bad address id generates an error', async () => {
      container.register({
        getAddressForUserRepository: awilix.asFunction(() => () => null),
      });
      const dummyRequest = generateMembershipSubscriptionRequest();
      const req = {
        body: dummyRequest
      };
      const next = jest.fn();
      await container.cradle.createSubscriptionController(req, generateDummyResponse(), next);
      expect(next.mock.calls[0][0].message).toEqual(`Address with ID ${dummyRequest.address_id} not found`);
      expect(next.mock.calls[0][0].statusCode).toEqual(422);
    });

    test('creating a subscription with a bad subscription type generates an error', async () => {
      const dummyRequest = generateMembershipSubscriptionRequest();
      dummyRequest.subscription_type = "BADNEWS";
      const req = {
        body:dummyRequest
      };
      const next = jest.fn();
      await container.cradle.createSubscriptionController(req, generateDummyResponse(), next);
      expect(next.mock.calls[0][0].message).toEqual('Subscription type BADNEWS not found');
      expect(next.mock.calls[0][0].statusCode).toEqual(422);
    });

    describe('when creating a MEMBERSHIP subscription', () => {

      test('passing a membership with no trial results in subscription in ACTIVE state', async () => {
        const membershipWithoutTrial = generateMembership({ skipTrial: true });
        container.register({
          getMembershipRepository: awilix.asFunction(() => () => membershipWithoutTrial)
        });
        const dummyRequest = generateMembershipSubscriptionRequest();
        const req = {
          body: dummyRequest
        };
        const res = generateDummyResponse();
        await container.cradle.createSubscriptionController(req, res);
        expect(res.json.mock.calls[0][0].state).toEqual(subscriptionConstants.STATE_ACTIVE);
      });

      test('passing a bad membership id generates an error', async () => {
        container.register({
          getMembershipRepository: awilix.asFunction(() => () => null),
        });
        const dummyRequest = generateMembershipSubscriptionRequest();
        dummyRequest.subscription_type = subscriptionConstants.TYPE_MEMBERSHIP;
        const req = {
          body: dummyRequest
        };
        const next = jest.fn();
        await container.cradle.createSubscriptionController(req, generateDummyResponse(), next);
        expect(next.mock.calls[0][0].message).toEqual(`Membership with ID ${dummyRequest.product_id} not found`);
        expect(next.mock.calls[0][0].statusCode).toEqual(422);
      });
    });

    describe('when creating a SCHEDULED subscription', () => {
      test('passing a valid plan and plan frequency results in a subscription in ACTIVE state mathing the plan frequency fields', async () => {
        const dummyPlan = generatePlan();
        const dummyPlanFrequency = generatePlanFrequency();
        container.register({
          getPlanRepository: awilix.asFunction(() => () => dummyPlan),
          getPlanFrequencyRepository: awilix.asFunction(() => () => dummyPlanFrequency)
        });
        const dummyRequest = generateScheduledSubscriptionRequest();
        const req = {
          body: dummyRequest
        };
        const res = generateDummyResponse();
        await container.cradle.createSubscriptionController(req, res);
        expect(res.json.mock.calls[0][0].product_id).toEqual(dummyPlan.id);
        expect(res.json.mock.calls[0][0].frequency_type).toEqual(dummyPlanFrequency.frequency_type);
        expect(res.json.mock.calls[0][0].frequency_value).toEqual(dummyPlanFrequency.frequency_value);
        expect(res.json.mock.calls[0][0].state).toEqual(subscriptionConstants.STATE_ACTIVE);
      });
      test('passing a bad plan id results in an error', async () => {
        container.register({
          getPlanRepository: awilix.asFunction(() => () => null),
        });
        const dummyRequest = generateScheduledSubscriptionRequest();
        const req = {
          body: dummyRequest
        };
        const next = jest.fn();
        await container.cradle.createSubscriptionController(req, {}, next);
        expect(next.mock.calls[0][0].message).toEqual(`Plan with ID ${dummyRequest.product_id} not found`);
        expect(next.mock.calls[0][0].statusCode).toEqual(422);
      });
      test('passing no plan frequency id results in an error', async () => {
        const dummyRequest = generateScheduledSubscriptionRequest();
        dummyRequest.plan_frequency_id = undefined;
        const req = {
          body: dummyRequest
        };
        const next = jest.fn();
        await container.cradle.createSubscriptionController(req, {}, next);
        expect(next.mock.calls[0][0].message).toEqual(`Missing PlanFrequency id. Value must be passed for SCHEDULED subscriptions.`);
        expect(next.mock.calls[0][0].statusCode).toEqual(422);
      });
      test('passing a bad plan frequency id results in an error', async () => {
        container.register({
          getPlanFrequencyRepository: awilix.asFunction(() => () => null)
        });
        const dummyRequest = generateScheduledSubscriptionRequest();
        const req = {
          body: dummyRequest
        };
        const next = jest.fn();
        await container.cradle.createSubscriptionController(req, {}, next);
        expect(next.mock.calls[0][0].message).toEqual(`PlanFrequency with ID ${dummyRequest.plan_frequency_id} not found`);
        expect(next.mock.calls[0][0].statusCode).toEqual(422);
      });
      test('passing no delivery_day results in an error', async () => {
        const dummyRequest = generateScheduledSubscriptionRequest();
        dummyRequest.delivery_day = undefined;
        const req = {
          body: dummyRequest
        };
        const next = jest.fn();
        await container.cradle.createSubscriptionController(req, {}, next);
        expect(next.mock.calls[0][0].message).toEqual(`Missing delivery day. Value must be passed for SCHEDULED subscriptions.`);
        expect(next.mock.calls[0][0].statusCode).toEqual(422);
      });
      test('passing a bad delivery_day results in an error', async () => {
        const dummyRequest = generateScheduledSubscriptionRequest();
        dummyRequest.delivery_day = 'MOONDAY';
        const req = {
          body: dummyRequest
        };
        const next = jest.fn();
        await container.cradle.createSubscriptionController(req, {}, next);
        expect(next.mock.calls[0][0].message).toEqual(`Invalid delivery day. Day must be one of: MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY`);
        expect(next.mock.calls[0][0].statusCode).toEqual(422);
      });
    });
  });

  describe('when a matching subscription exists', () => {
    test('creating a subscription with data matching an existing subscription returns the existing subscription', async () => {
      const dummySubscription = generateSubscription();
      container.register({
        getMatchingSubscriptionRepository: awilix.asFunction(() => () => dummySubscription),
      });

      const dummyRequest = generateMembershipSubscriptionRequest();
      const req = {
        body: dummyRequest
      };
      const res = generateDummyResponse();
      await container.cradle.createSubscriptionController(req, res);
      expect(res.json.mock.calls[0][0].id).toEqual(dummySubscription.id);
    });
  });
});
