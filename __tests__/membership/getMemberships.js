const awilix = require('awilix');
const dummyResponse = require('../../factories/dummyResponse');
const generateMembership = require('../../factories/membership');

describe('getMemberships', () => {

  const inMemoryMemberships = [
    generateMembership(),
    generateMembership()
  ];
  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });
  container.register({
    getMembershipsController: awilix.asFunction(require('../../controllers/membership').getMemberships),
    getMembershipsBehaviour: awilix.asFunction(require('../../domain/membership/getMemberships')),
    getMembershipsRepository: awilix.asFunction(() => () => inMemoryMemberships)
  });

  test('all memberships should be returned', async () => {
    const res = dummyResponse();
    await container.cradle.getMembershipsController({}, res);
    expect(res.json.mock.calls[0][0].length).toEqual(2);
    expect(res.json.mock.calls[0][0][0].id).toEqual(inMemoryMemberships[0].id);
    expect(res.json.mock.calls[0][0][1].id).toEqual(inMemoryMemberships[1].id);
  });
});
