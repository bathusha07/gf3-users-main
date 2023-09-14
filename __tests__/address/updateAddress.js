const awilix = require('awilix');
const generateAddress = require('../../factories/address');
const generateAddressRequest = require('../../factories/addressRequest');
const generateDummyResponse = require('../../factories/dummyResponse');

describe('updateAddress', () => {
  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });
  container.register({
    updateAddressBehaviour: awilix.asFunction(require('../../domain/address/updateAddress')),
    updateAddressController: awilix.asFunction(require('../../controllers/address').updateAddress),
  });

  const currentAddress = {
    ...generateAddress(),
    is_default: true
  };
  const addressUpdate = {
    ...generateAddressRequest(),
    is_default: true
  };
  const updatedAddress = {
    id: currentAddress.id,
    ...addressUpdate
  };
  const dummyRequest = {
    params: { id: currentAddress.id },
    body: addressUpdate
  };

  describe('when values passed in the request body don\'t pass validation', () => {
    beforeEach(() => {
      container.register({
        getAddressRepository: awilix.asFunction(() => () => {}),
        updateAddressRepository: awilix.asFunction(() => () => {}),
        unsetPreviousUserDefaultAddressRepository: awilix.asFunction(() => () => {}),
      });
    });

    describe('because a field doesn\'t match what we expect', () => {
      test('a ValidationError with code 400 should be thrown', async () => {
        const badRequest = {
          params: { id: currentAddress.id },
          body: {
            ...generateAddressRequest(),
            is_default: 'this should be a boolean'
          }
        };
        const next = jest.fn();

        await container.cradle.updateAddressController(badRequest, {}, next);
        expect(next.mock.calls[0][0].name).toEqual('ValidationError');
        expect(next.mock.calls[0][0].statusCode).toEqual(400);
      });
    });
  });

  describe('when identified address does not exist', () => {
    test('controller returns 404 not found error', async () => {
      container.register({
        getAddressRepository: awilix.asFunction(() => () => null),
        updateAddressRepository: awilix.asFunction(() => updatedAddress),
        unsetPreviousUserDefaultAddressRepository: awilix.asFunction(() => () => {}),
      });
      const next = jest.fn();

      await container.cradle.updateAddressController(dummyRequest, {}, next);
      expect(next.mock.calls[0][0].message).toEqual(
        'Address with ID ' + currentAddress.id + ' not found'
      );
      expect(next.mock.calls[0][0].statusCode).toEqual(404);
    });
  });

  describe('when identified address exists', () => {
    describe('but address update already matches identified address data', () => {
      test('existing address is returned', async () => {
        container.register({
          getAddressRepository: awilix.asFunction(() => () => updatedAddress),
          updateAddressRepository: awilix.asFunction(() => () => updatedAddress),
          unsetPreviousUserDefaultAddressRepository: awilix.asFunction(() => () => {}),
        });
        const dummyResponse = generateDummyResponse();

        await container.cradle.updateAddressController(dummyRequest, dummyResponse);
        expect(dummyResponse.json.mock.calls[0][0]).toStrictEqual(updatedAddress);
      });
    });

    describe('and updated address is the new default address', () => {
      test('previous address is_default is set to false', async () => {
        container.register({
          getAddressRepository: awilix.asFunction(() => () => currentAddress),
          updateAddressRepository: awilix.asFunction(() => () => updatedAddress),
          unsetPreviousUserDefaultAddressRepository: awilix.asFunction(() => () => {}),
        });
        const dummyResponse = generateDummyResponse();

        await container.cradle.updateAddressController(dummyRequest, dummyResponse);
        expect(dummyResponse.json.mock.calls[0][0]).toStrictEqual(updatedAddress);
      });
    });

    describe('when updated address default status is not changed', () => {
      test('updated address is returned', async () => {
        const inMemoryNonDefaultAddressRepository = () => {
          return {
            ...currentAddress,
            is_default: false
          };
        };
        container.register({
          getAddressRepository: awilix.asFunction(() => inMemoryNonDefaultAddressRepository),
          updateAddressRepository: awilix.asFunction(() => () => updatedAddress),
          unsetPreviousUserDefaultAddressRepository: awilix.asFunction(() => () => {}),
        });
        const dummyResponse = generateDummyResponse();

        await container.cradle.updateAddressController(dummyRequest, dummyResponse);
        expect(dummyResponse.json.mock.calls[0][0]).toStrictEqual(updatedAddress);
      });
    });

    describe('when postal_code is updated', () => {
      test('address FSA should also be updated', async () => {
        const postalCodeUpdate = {
          ...addressUpdate,
          postal_code: 'B2B 2B2'
        };
        const addressWithUpdatedPostalCode = {
          ...currentAddress,
          postal_code: postalCodeUpdate.postal_code
        };
        container.register({
          getAddressRepository: awilix.asFunction(() => () => currentAddress),
          updateAddressRepository: awilix.asFunction(() => () => addressWithUpdatedPostalCode),
          unsetPreviousUserDefaultAddressRepository: awilix.asFunction(() => () => {}),
        });

        const postalCodeUpdateRequest = {
          params: { id: currentAddress.id },
          body: postalCodeUpdate
        };
        const dummyResponse = generateDummyResponse();

        await container.cradle.updateAddressController(postalCodeUpdateRequest, dummyResponse);
        expect(dummyResponse.json.mock.calls[0][0]).toStrictEqual(addressWithUpdatedPostalCode);
      });
    });
  });
});
