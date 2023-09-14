const awilix = require('awilix');
const dummyResponse = require('../../factories/dummyResponse');
const generateMembership = require('../../factories/membership');

describe('getMembership', () => {

  const inMemoryMembership = generateMembership();
  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });
  container.register({
    getMembershipController: awilix.asFunction(require('../../controllers/membership').getMembership),
    getMembershipBehaviour: awilix.asFunction(require('../../domain/membership/getMembership')),
    getMembershipRepository: awilix.asFunction(() => (id) => id === inMemoryMembership.id ? inMemoryMembership : null)
  });

  test('an existing membership should be found, given the id', async () => {
    const req = {
      params: {
        id: inMemoryMembership.id
      },
    };
    const res = dummyResponse();
    await container.cradle.getMembershipController(req, res);
    expect(res.json.mock.calls[0][0].id).toEqual(inMemoryMembership.id);
  });

  test('a bad id should result in a membership not found message', async () => {
    const badMembershipId = '2d75c9d3-dc14-4ceb-a02e-0ddea5b1c4e4';
    const req = {
      params: {
        id: badMembershipId
      },
    };
    const res = dummyResponse();
    const next = jest.fn();
    await container.cradle.getMembershipController(req, res, next);
    expect(next.mock.calls[0][0].message).toEqual(`Membership with ID ${badMembershipId} not found`);
    expect(next.mock.calls[0][0].statusCode).toEqual(404);
  });
});
