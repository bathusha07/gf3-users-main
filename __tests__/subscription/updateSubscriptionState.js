const awilix = require('awilix');
const SubscriptionInvalidStateTransition = require('../../domain/errors/SubscriptionInvalidStateTransition');
const generateDummyResponse = require('../../factories/dummyResponse');
const generateSubscription = require('../../factories/subscription');
const Subscription = require('../../domain/subscription/entity');

describe ('updateSubscriptionState', () => {
  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });

  const defaultDate = new Date(Date.UTC(1970, 0, 1));

  let res;
  let next;
  beforeEach(() => {
    const transitionSubscriptionStateMock = jest.fn().mockImplementation((sub) => sub);
    const updateSubscriptionRepositoryMock = jest.fn().mockImplementation(() => true);
    container.register({
      updateSubscriptionStateController: awilix.asFunction(require('../../controllers/subscription').updateSubscriptionState),
      updateSubscriptionStateBehaviour: awilix.asFunction(require('../../domain/subscription/updateSubscriptionState')),
      updateSubscriptionRepository: awilix.asFunction(() => updateSubscriptionRepositoryMock),
      getSubscriptionRepository: awilix.asFunction(() => generateSubscription),
      transitionSubscriptionStateBehaviour: awilix.asFunction(() => transitionSubscriptionStateMock),
      calculateNextCycleBehaviour: awilix.asFunction(() => () => defaultDate),
      getCurrentDateBehaviour: awilix.asFunction(() => () => defaultDate),
    });

    res = generateDummyResponse();
    next = jest.fn();
  });

  const testReq = {
    params: 'testid',
  };

  test('valid transition states should return 204', async () => {
    const res = generateDummyResponse();
    const controllerToTest = container.cradle.updateSubscriptionStateController('testevent');
    await controllerToTest(testReq, res);

    const [
      [outboundStatus]
    ] = res.sendStatus.mock.calls;
    expect(outboundStatus).toEqual(204);
  });

  test('a nonexistent subscription id should return 404', async () => {
    container.register({
      getSubscriptionRepository: awilix.asFunction(() => () => false),
    });
    const controllerToTest = container.cradle.updateSubscriptionStateController('testevent');

    await controllerToTest(testReq, res, next);
    const [ [error] ] = next.mock.calls;
    expect(error.statusCode).toEqual(404);
    expect(error.name).toEqual('SubscriptionNotFound');
  });

  test('idempotent calls should return 204 and not call the repository', async () => {
    const res = generateDummyResponse();
    const controllerToTest = container.cradle.updateSubscriptionStateController('testevent');
    await controllerToTest(testReq, res);

    const [
      [outboundStatus]
    ] = res.sendStatus.mock.calls;
    expect(outboundStatus).toEqual(204);
    expect(container.cradle.updateSubscriptionRepository).toBeCalledTimes(0);
  });

  test('non-idempotent calls should return 204 and call the repository', async () => {
    const transitionSubscriptionStateMock = jest.fn().mockImplementation(
      (sub) => new Subscription({...sub, next_cycle: 'different', state: 'different'}),
    );

    container.register({
      transitionSubscriptionStateBehaviour: awilix.asFunction(() => transitionSubscriptionStateMock),
    });

    const res = generateDummyResponse();
    const controllerToTest = container.cradle.updateSubscriptionStateController('testevent');
    await controllerToTest(testReq, res);

    const [
      [outboundStatus]
    ] = res.sendStatus.mock.calls;
    expect(outboundStatus).toEqual(204);
    expect(container.cradle.updateSubscriptionRepository).toBeCalledTimes(1);
  });
});
