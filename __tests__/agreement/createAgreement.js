const awilix = require('awilix');
const EntityInstantiationError = require('../../domain/errors/EntityInstantiationError');
const generateAgreement = require('../../factories/agreement');
const generateAgreementRequest = require('../../factories/agreementRequest');
const generateDummyResponse = require('../../factories/dummyResponse');
const generateUser = require('../../factories/user');

describe('createAgreement', () => {
  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });
  container.register({
    createAgreementBehaviour: awilix.asFunction(require('../../domain/agreement/createAgreement')),
    createAgreementController: awilix.asFunction(require('../../controllers/agreement').createAgreement),
  });
  const user = generateUser();

  let dummyRequest;
  let dummyResponse;
  beforeEach(() => {
    dummyRequest = { body: generateAgreementRequest() };
    dummyResponse = generateDummyResponse();
    container.register({
      getUserRepository: awilix.asFunction(() => () => user),
      getMatchingAgreementRepository: awilix.asFunction(() => () => null),
      createAgreementRepository: awilix.asFunction(() => () => null),
    });
  });

  describe('when values passed in the request body don\'t pass validation', () => {
    test('a ValidationError with code 400 should be thrown', async () => {
      const emptyRequest = { body: {} };
      const next = jest.fn();
      await container.cradle.createAgreementController(emptyRequest, {}, next);
      expect(next.mock.calls[0][0].name).toEqual('ValidationError');
      expect(next.mock.calls[0][0].statusCode).toEqual(400);
    });
  });

  describe('when the user_id in the request doesn\'t match a user in our database', () => {
    test('a UserNotFound error should be thrown', async () => {
      container.register({
        getUserRepository: awilix.asFunction(() => () => null),
      });
      const next = jest.fn();
      await container.cradle.createAgreementController(dummyRequest, dummyResponse, next);
      expect(next.mock.calls[0][0].name).toEqual('UserNotFound');
    });
  });

  describe('when an error is thrown when attempting to create the Agreement', () => {
    test('an EntityInstantiationError should cause a SubresourceNotFound error thrown from Controller', async () => {
      container.register({
        createAgreementRepository: awilix.asFunction(() => () => { throw new EntityInstantiationError; })
      });
      const next = jest.fn();
      await container.cradle.createAgreementController(dummyRequest, dummyResponse, next);
      expect(next.mock.calls[0][0].name).toEqual('SubresourceNotFound');
    });

    test('other errors should be thrown as is from the Controller', async () => {
      container.register({
        createAgreementRepository: awilix.asFunction(() => () => {
          throw { name: 'RandomError' }
        })
      });
      const next = jest.fn();
      await container.cradle.createAgreementController(dummyRequest, dummyResponse, next);
      expect(next.mock.calls[0][0].name).toEqual('RandomError');
    });
  });

  describe('when an already existing matching agreement is found', () => {
    test('that existing agreement should be returned', async () => {
      const existingAgreement = generateAgreement();
      container.register({
        getMatchingAgreementRepository: awilix.asFunction(() => () => existingAgreement),
      });
      await container.cradle.createAgreementController(dummyRequest, dummyResponse);
      expect(dummyResponse.json.mock.calls[0][0]).toStrictEqual(existingAgreement);
    });
  });

  describe('when a new agreement record is created', () => {
    test('that new agreement should be returned', async () => {
      const createdAgreement = generateAgreement();
      container.register({
        createAgreementRepository: awilix.asFunction(() => () => createdAgreement),
      });
      await container.cradle.createAgreementController(dummyRequest, dummyResponse);
      expect(dummyResponse.json.mock.calls[0][0]).toStrictEqual(createdAgreement);
    });
  });
});
