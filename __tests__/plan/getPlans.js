const awilix = require('awilix');
const generatePlan = require('../../factories/plan');

describe('getPlans', () => {

  const inMemoryPlans = [
    generatePlan(),
    generatePlan()
  ];
  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });
  container.register({
    getPlansController: awilix.asFunction(require('../../controllers/plan').getPlans),
    getPlansBehaviour: awilix.asFunction(require('../../domain/plan/getPlans')),
    getPlansRepository: awilix.asFunction(() => () => inMemoryPlans)
  });

  test('all plans should be returned', async () => {
    const res = {
      status: function(code) { return this; },
      json: jest.fn()
    };
    await container.cradle.getPlansController({}, res);
    expect(res.json.mock.calls[0][0].length).toEqual(2);
    expect(res.json.mock.calls[0][0][0].id).toEqual(inMemoryPlans[0].id);
    expect(res.json.mock.calls[0][0][1].id).toEqual(inMemoryPlans[1].id);
  });
});
