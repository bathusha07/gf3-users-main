const awilix = require('awilix');
const dummyResponse = require('../../factories/dummyResponse');
const generateStripeCustomer = require('../../factories/stripeCustomer');
const generateCard = require('../../factories/card');
const generateCreateCardRequest = require('../../factories/createCardRequest');
const { Card } = require('../../domain/card/data');
const { StripeCustomer } = require('../../domain/stripeCustomer/data');
const uuidregex = require('uuid-regexp');

describe('createCard', () => {

  const inMemoryStripeCustomer = StripeCustomer(generateStripeCustomer());
  const inMemoryCard = Card(generateCard(inMemoryStripeCustomer.id));
  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });
  container.register({
    createCardController: awilix.asFunction(require('../../controllers/card').createCard),
    createCardBehaviour: awilix.asFunction(require('../../domain/card/createCard')),
    createCardRepository: awilix.asFunction(() => (card) => Card(card)),
    getCardByStripePaymentMethodIdRepository: awilix.asFunction(() => (stripePaymentMethodId) => {
      return stripePaymentMethodId === inMemoryCard.stripe_payment_method_id ? inMemoryCard : null;
    }),
    getStripeCustomerByStripeIdRepository: awilix.asFunction(() => (stripeId) => {
      return stripeId === inMemoryStripeCustomer.stripe_id ? inMemoryStripeCustomer : null;
    })
  });

  test('when no stripe customer matching the passed id exists an error is returned', async () => {
    const createCardRequest = generateCreateCardRequest();
    const req = {
      body: createCardRequest
    };
    const next = jest.fn();
    await container.cradle.createCardController(req, {}, next);
    expect(next.mock.calls[0][0].message).toEqual(`Stripe customer with ID ${createCardRequest.stripe_customer_id} not found`);
    expect(next.mock.calls[0][0].statusCode).toEqual(422);
  });

  describe('when a stripe customer matching the passed id exists', () => {
    describe('when no card matching the payment method exists', () => {
      const createCardRequest = generateCreateCardRequest(inMemoryStripeCustomer.stripe_id);
      test('a new card is created and passed back', async () => {
        const req = {
          body: createCardRequest
        };
        const res = dummyResponse();
        await container.cradle.createCardController(req, res);
        expect(uuidregex().test(res.json.mock.calls[0][0].id)).toEqual(true);
        expect(res.json.mock.calls[0][0].stripe_customer_id).toEqual(inMemoryStripeCustomer.id);
        expect(res.json.mock.calls[0][0].stripe_payment_method_id).toEqual(createCardRequest.stripe_payment_method_id);
      });

      test('passing bad data results in a validation error', async () => {
        const req = {
          body: {
            stripe_payment_method_id: 'pm_nngppjhinw7n3ru27sk4tmrc',
            stripe_customer_id: 'cuss_sw6krd247b5vq1'
          }
        };
        const next = jest.fn();
        await container.cradle.createCardController(req, {}, next);
        expect(next.mock.calls[0][0].message).toEqual('stripe_customer_id must start with cus_');
        expect(next.mock.calls[0][0].statusCode).toEqual(400);
      });
    });

    describe('when a card matching the payment method exists', () => {
      test('the existing card is returned', async () => {
        const req = {
          body: {
            stripe_payment_method_id: inMemoryCard.stripe_payment_method_id,
            stripe_customer_id: inMemoryStripeCustomer.stripe_id
          }
        };
        const res = dummyResponse();
        await container.cradle.createCardController(req, res);
        expect(res.json.mock.calls[0][0].stripe_customer_id).toEqual(inMemoryStripeCustomer.id);
        expect(res.json.mock.calls[0][0].stripe_payment_method_id).toEqual(inMemoryCard.stripe_payment_method_id);
      });
    });
  });
});
