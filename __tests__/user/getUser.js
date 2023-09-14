const awilix = require('awilix');
const dummyResponse = require('../../factories/dummyResponse');
const generateUser = require('../../factories/user');
const { User } = require('../../domain/user/data');

describe('getUser', () => {

  const inMemoryUser = generateUser();
  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });
  container.register({
    getUserController: awilix.asFunction(require('../../controllers/user').getUser),
    getUserBehaviour: awilix.asFunction(require('../../domain/user/getUser')),
    getUserRepository: awilix.asFunction(() => (id) => id === inMemoryUser.id ? User(inMemoryUser) : null)
  });

  test('an existing user should be found, given the id', async () => {
    const req = {
      params: {
        id: inMemoryUser.id
      },
    };
    const res = dummyResponse();
    await container.cradle.getUserController(req, res);
    expect(res.json.mock.calls[0][0].id).toEqual(inMemoryUser.id);
  });

  test('a bad id should result in a user not found message', async () => {
    const badId = '2d75c9d3-dc14-4ceb-a02e-0ddea5b1c4e4';
    const req = {
      params: {
        id: badId
      },
    };
    const next = jest.fn();
    await container.cradle.getUserController(req, {}, next);
    expect(next.mock.calls[0][0].message).toEqual(`User with ID ${badId} not found`);
    expect(next.mock.calls[0][0].statusCode).toEqual(404);
  });
});
