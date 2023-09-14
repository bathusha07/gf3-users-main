const awilix = require('awilix');
const generatePlanFrequency = require('../../factories/planFrequency');

describe('getPlanFrequencies', () => {

  const inMemoryPlanFrequencies = [
    generatePlanFrequency(),
    generatePlanFrequency()
  ];
  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });
  container.register({
    getPlanFrequenciesController: awilix.asFunction(require('../../controllers/planFrequency').getPlanFrequencies),
    getPlanFrequenciesBehaviour: awilix.asFunction(require('../../domain/planFrequency/getPlanFrequencies')),
    getPlanFrequenciesRepository: awilix.asFunction(() => () => inMemoryPlanFrequencies)
  });

  test('all plans frequencies should be returned', async () => {
    const res = {
      status: function(code) { return this; },
      json: jest.fn()
    };
    await container.cradle.getPlanFrequenciesController({}, res);
    expect(res.json.mock.calls[0][0].length).toEqual(2);
    expect(res.json.mock.calls[0][0][0].id).toEqual(inMemoryPlanFrequencies[0].id);
    expect(res.json.mock.calls[0][0][1].id).toEqual(inMemoryPlanFrequencies[1].id);
  });
});
