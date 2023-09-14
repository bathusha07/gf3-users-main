const awilix = require('awilix');
const dummyResponse = require('../../factories/dummyResponse');
const generateMembership = require('../../factories/membership');
const generateMembershipPrice = require('../../factories/membershipPrice');

describe('getMembershipPrices', () => {

  const inMemoryMembership = generateMembership();
  const inMemoryMembershipPrices = [
    generateMembershipPrice(inMemoryMembership.id),
    generateMembershipPrice(inMemoryMembership.id)
  ];
  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });
  container.register({
    getMembershipPricesController: awilix.asFunction(require('../../controllers/membershipPrice').getMembershipPrices),
    getMembershipPricesBehaviour: awilix.asFunction(require('../../domain/membershipPrice/getMembershipPrices')),
    getMembershipRepository: awilix.asFunction(() => (id) => id === inMemoryMembership.id ? inMemoryMembership : null),
    getMembershipPricesByMembershipIdRepository: awilix.asFunction(() => (membership_id) => {
      return membership_id === inMemoryMembershipPrices[0].membership_id ? inMemoryMembershipPrices : [];
    })
  });

  test('given an existing membership id, its prices should be returned', async () => {
    const req = {
      params: {
        id: inMemoryMembership.id
      },
    };
    const res = dummyResponse();
    await container.cradle.getMembershipPricesController(req, res);
    expect(res.json.mock.calls[0][0].length).toEqual(2);
    expect(res.json.mock.calls[0][0][0].id).toEqual(inMemoryMembershipPrices[0].id);
    expect(res.json.mock.calls[0][0][1].id).toEqual(inMemoryMembershipPrices[1].id);
  });

  test('a bad id should result in a membership not found message', async () => {
    const badMembershipId = '2d75c9d3-dc14-4ceb-a02e-0ddea5b1c4e4';
    const req = {
      params: {
        id: badMembershipId
      },
    };
    const next = jest.fn();
    await container.cradle.getMembershipPricesController(req, {}, next);
    expect(next.mock.calls[0][0].message).toEqual(`Membership with ID ${badMembershipId} not found`);
    expect(next.mock.calls[0][0].statusCode).toEqual(404);
  });
});
