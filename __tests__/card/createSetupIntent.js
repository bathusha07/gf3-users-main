const awilix = require('awilix');
const dummyResponse = require('../../factories/dummyResponse');
const generateUser = require('../../factories/user');
const generateSetupIntentRequest = require('../../factories/setupIntentRequest');
const generateStripeCustomer = require('../../factories/stripeCustomer');
const { User } = require('../../domain/user/data');
const { StripeCustomer } = require('../../domain/stripeCustomer/data');

describe('createSetupIntent', () => {
  const inMemoryUser = generateUser();
  const dummyClientSecret = 'seti_1IWLIsHvjO3p47C83VpLNQtV_secret_J8cXKfBeZi7umNmy20N9xDijzJujmv9';

  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });
  container.register({
    createSetupIntentController: awilix.asFunction(require('../../controllers/setupIntent').createSetupIntent),
    createSetupIntentBehaviour: awilix.asFunction(require('../../domain/setupIntent/createSetupIntent')),
    createStripeCustomerBehaviour: awilix.asFunction(require('../../domain/stripeCustomer/createStripeCustomer')),
    getUserByFirebaseIdRepository: awilix.asFunction(() => (firebaseId) => {
      return inMemoryUser.firebase_id === firebaseId ? User(inMemoryUser) : null;
    }),
    createSetupIntentCall: awilix.asFunction(() => () => {
      return { client_secret: dummyClientSecret };
    })
  });
  beforeEach(() => {
    container.register({
      getStripeCustomerByUserIdRepository: awilix.asFunction(() => () => null),
      createStripeCustomerRepository: awilix.asFunction(() => () => null),
      createCustomerCall: awilix.asFunction(() => () => null)
    });
  });

  describe('when an associated user exists', () => {
    describe('when the associated user already has a stripe customer record', () => {

      const inMemoryStripeCustomer = generateStripeCustomer(inMemoryUser.id);
      beforeEach(() => {
        container.register({
          getStripeCustomerByUserIdRepository: awilix.asFunction(() => (userId) => {
            return inMemoryStripeCustomer.user_id === userId ? StripeCustomer(inMemoryStripeCustomer) : null;
          }),
          createStripeCustomerRepository: awilix.asFunction(() => () => null),
          createCustomerCall: awilix.asFunction(() => () => null),
        });
      });

      test('creating a SetupIntent returns a customer id and a client secret', async () => {
        const setupIntentRequest = generateSetupIntentRequest();
        setupIntentRequest.firebase_id = inMemoryUser.firebase_id;
        const req = {
          body: setupIntentRequest
        }
        const res = dummyResponse();
        await container.cradle.createSetupIntentController(req, res);
        expect(res.json.mock.calls[0][0].customer_id).toEqual(inMemoryStripeCustomer.stripe_id);
        expect(res.json.mock.calls[0][0].client_secret).toEqual(dummyClientSecret);
      });

    });

    describe('when the associated user does not have a stripe customer record', () => {
      test('creating a SetupIntent for which there is a user but no stripe customer record results in a new stripe customer record', async () => {

        const dummyStripeCustomerId = 'cus_J6OcsVy3em60Vd';
        container.register({
          getStripeCustomerByUserIdRepository: awilix.asFunction(
            () => (userId) => null),
          createStripeCustomerRepository: awilix.asFunction(
            () => (stripeCustomer) => StripeCustomer(stripeCustomer)),
          createCustomerCall: awilix.asFunction(() => () => {
            return { id: dummyStripeCustomerId };
          }),
        });

        const setupIntentRequest = generateSetupIntentRequest();
        setupIntentRequest.firebase_id = inMemoryUser.firebase_id;
        const req = {
          body: setupIntentRequest
        }
        const res = dummyResponse();
        await container.cradle.createSetupIntentController(req, res);
        expect(res.json.mock.calls[0][0].customer_id).toEqual(dummyStripeCustomerId);
        expect(res.json.mock.calls[0][0].client_secret).toEqual(dummyClientSecret);
      });
    });
  });

  describe('when an associated user does not exist', () => {
    const setupIntentRequest = generateSetupIntentRequest();

    test('creating a SetupIntent throws an error', async () => {
      const req = {
        body: setupIntentRequest
      }
      const next = jest.fn();
      await container.cradle.createSetupIntentController(req, {}, next);
      expect(next.mock.calls[0][0].message).toEqual(`User with Firebase ID ${setupIntentRequest.firebase_id} not found`);
      expect(next.mock.calls[0][0].statusCode).toEqual(404);
    });

    test('creating a SetupIntent with bad input results in a validation error', async () => {
      const req = {
        body: {
          'requester_id': setupIntentRequest.firebase_id
        }
      };
      const next = jest.fn();
      await container.cradle.createSetupIntentController(req, {}, next);
      expect(next.mock.calls[0][0].message).toEqual('firebase_id is a required field');
      expect(next.mock.calls[0][0].statusCode).toEqual(400);
    });
  });
});
