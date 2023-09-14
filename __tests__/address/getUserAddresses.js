const awilix = require('awilix');
const generateAddress = require('../../factories/address');
const generateDummyResponse = require('../../factories/dummyResponse');
const generateUser = require('../../factories/user');

describe('getUserAddress', () => {
  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });
  container.register({
    getUserAddressesBehaviour: awilix.asFunction(require('../../domain/address/getUserAddresses')),
    getUserAddressesController: awilix.asFunction(require('../../controllers/address').getUserAddresses),
  });

  const user = generateUser();
  const dummyRequest = {
    params: { id: user.id }
  };

  describe('when requesting a user\'s addresses', () => {
    describe('and no user by the specified ID is found', () => {
      test('an error 422 should be thrown', async () => {
        container.register({
          getUserRepository: awilix.asFunction(() => () => undefined),
          getUserAddressesRepository: awilix.asFunction(() => () => undefined)
        });
        const next = jest.fn();

        await container.cradle.getUserAddressesController(dummyRequest, {}, next);
        expect(next.mock.calls[0][0].message).toEqual('User with ID ' + user.id + ' not found');
        expect(next.mock.calls[0][0].statusCode).toEqual(422);
      });
    });

    describe('and no addresses are found for the user', () => {
      test('an empty array should be returned', async () => {
        container.register({
          getUserRepository: awilix.asFunction(() => () => user),
          getUserAddressesRepository: awilix.asFunction(() => () => [])
        });
        const dummyResponse = generateDummyResponse();

        await container.cradle.getUserAddressesController(dummyRequest, dummyResponse);
        expect(dummyResponse.json.mock.calls[0][0]).toStrictEqual([]);
      });
    });

    describe('and a list of addresses are found for the user', () => {
      test('the address list should be returned in an array', async () => {
        const addressList = [generateAddress(), generateAddress()];
        container.register({
          getUserRepository: awilix.asFunction(() => () => user),
          getUserAddressesRepository: awilix.asFunction(() => () => addressList)
        });
        const dummyResponse = generateDummyResponse();

        await container.cradle.getUserAddressesController(dummyRequest, dummyResponse);
        expect(dummyResponse.json.mock.calls[0][0]).toStrictEqual(addressList);
      });
    });
  });
});
