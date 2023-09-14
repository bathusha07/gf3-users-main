const awilix = require('awilix');
const EntityInstantiationError = require('../../domain/errors/EntityInstantiationError');
const generateAddress = require('../../factories/address');
const generateAddressRequest = require('../../factories/addressRequest');
const generateDummyResponse = require('../../factories/dummyResponse');
const generateUser = require('../../factories/user');

describe('createAddress', () => {
  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });
  container.register({
    createAddressBehaviour: awilix.asFunction(require('../../domain/address/createAddress')),
    createAddressController: awilix.asFunction(require('../../controllers/address').createAddress),
  });

  const testUser = generateUser();
  const testAddressRequest = {
    ...generateAddressRequest(),
    user_id: testUser.id,
    is_default: true
  };
  const dummyRequest = { body: testAddressRequest };

  beforeEach(() => {
    container.register({
      getUserRepository: awilix.asFunction(() => () => testUser),
      createAddressRepository: awilix.asFunction(() => (address) => address),
      getMatchingUserAddressRepository: awilix.asFunction(() => () => {}),
      unsetPreviousUserDefaultAddressRepository: awilix.asFunction(() => () => {}),
    });
  });

  describe('when values passed in the request body don\'t pass validation', () => {
    test('a ValidationError with code 400 should be thrown', async () => {
      const emptyRequest = { body: {} };
      const next = jest.fn();
      await container.cradle.createAddressController(emptyRequest, {}, next);
      expect(next.mock.calls[0][0].name).toEqual('ValidationError');
      expect(next.mock.calls[0][0].statusCode).toEqual(400);
    });
  });

  describe('when no user matching the user_id passed in the request exists', () => {
    test('a 404 error should be thrown', async () => {
      container.register({
        getUserRepository: awilix.asFunction(() => () => undefined),
      });
      const next = jest.fn();

      await container.cradle.createAddressController(dummyRequest, {}, next);
      expect(next.mock.calls[0][0].message).toEqual('User with ID ' + testUser.id + ' not found');
      expect(next.mock.calls[0][0].statusCode).toEqual(404);
    });
  });

  describe('when an error is thrown when attempting to create the Address', () => {
    test('an EntityInstantiationError should cause a SubresourceNotFound error thrown from Controller', async () => {
      container.register({
        createAddressRepository: awilix.asFunction(() => () => { throw new EntityInstantiationError; })
      });
      const next = jest.fn();
      await container.cradle.createAddressController(dummyRequest, {}, next);
      expect(next.mock.calls[0][0].name).toEqual('SubresourceNotFound');
    });

    test('other errors should be thrown as is from the Controller', async () => {
      container.register({
        createAddressRepository: awilix.asFunction(() => () => {
          throw { name: 'RandomError' }
        })
      });
      const next = jest.fn();
      await container.cradle.createAddressController(dummyRequest, {}, next);
      expect(next.mock.calls[0][0].name).toEqual('RandomError');
    });
  });

  describe('when no matching address for the user exists', () => {
    test('create a new default address for the user', async () => {
      const dummyResponse = generateDummyResponse();

      await container.cradle.createAddressController(dummyRequest, dummyResponse);
      expect(dummyResponse.json.mock.calls[0][0]).toStrictEqual({
        ...testAddressRequest,
        fsa: testAddressRequest.postal_code.substring(0,3),
      });
    });

    test('create a new non-default address for the user', async () => {
      const nonDefaultTestAddress = { ...testAddressRequest, is_default: false };
      const createNonDefaultAddressRequest = { body: nonDefaultTestAddress };
      const dummyResponse = generateDummyResponse();

      await container.cradle.createAddressController(createNonDefaultAddressRequest, dummyResponse);
      expect(dummyResponse.json.mock.calls[0][0]).toStrictEqual({
        ...nonDefaultTestAddress,
        fsa: nonDefaultTestAddress.postal_code.substring(0,3),
      });
    });
  });

  describe('when trying to create an address that matches one for the given user', () => {
    test('the existing address should be returned', async () => {
      const existingAddressFields = {
        id: 1,
        user_id: testUser.id,
        fsa: testAddressRequest.postal_code.substring(0,3)
      };
      const inMemoryMatchingAddressRepository = () => {
        return {
          ...existingAddressFields,
          ...testAddressRequest
        };
      };
      container.register({
        getMatchingUserAddressRepository: awilix.asFunction(() => inMemoryMatchingAddressRepository),
      });
      const dummyResponse = generateDummyResponse();

      await container.cradle.createAddressController(dummyRequest, dummyResponse);
      expect(dummyResponse.json.mock.calls[0][0]).toStrictEqual({
        ...existingAddressFields,
        ...testAddressRequest
      });
    });
  });
});
