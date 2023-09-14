const { TestScheduler } = require('@jest/core');
const awilix = require('awilix');
const generateSubscription = require('../../factories/subscription');
const generateDummyResponse = require('../../factories/dummyResponse');

describe('curateScheduledSubscriptions', () => {
  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });
  container.register({
    curateScheduledSubscriptionsController: awilix.asFunction(
      require('../../controllers/subscription').curateScheduledSubscriptions
    ),
    curateScheduledSubscriptionsBehaviour: awilix.asFunction(
      require('../../domain/subscription/curateScheduledSubscriptions')
    ),
    getCurrentDateBehaviour: awilix.asFunction(() => () => new Date()),
  });

  let createCartFromCuratedRecipesService;
  let getCuratedRecipesService;
  let dummyResponse;
  beforeEach(() => {
    createCartFromCuratedRecipesService = jest.fn();
    getCuratedRecipesService = jest.fn();
    dummyResponse = generateDummyResponse();
  });
  
  describe('when there are subscriptions due for curation', () => {
    test('the Catalog and Cart services should be invoked before returning 204', async () => {
      const subscriptions = [generateSubscription()];
      container.register({
        createCartFromCuratedRecipesService: awilix.asFunction(() => createCartFromCuratedRecipesService),
        getCuratedRecipesService: awilix.asFunction(() => getCuratedRecipesService),
        getSubscriptionsDueForCurationRepository: awilix.asFunction(() => () => subscriptions)
      });
      await container.cradle.curateScheduledSubscriptionsController({}, dummyResponse);
      expect(container.cradle.createCartFromCuratedRecipesService)
        .toHaveBeenCalledTimes(subscriptions.length);
      expect(container.cradle.getCuratedRecipesService)
        .toHaveBeenCalledTimes(subscriptions.length);
      expect(dummyResponse.sendStatus).toHaveBeenCalledWith(204);
    });
  });

  describe('when there are not subscriptions due for curation', () => {
    test('status code 204 should be returned and no services invoked', async () => {
      container.register({
        createCartFromCuratedRecipesService: awilix.asFunction(() => createCartFromCuratedRecipesService),
        getCuratedRecipesService: awilix.asFunction(() => getCuratedRecipesService),
        getSubscriptionsDueForCurationRepository: awilix.asFunction(() => () => [])
      });
      await container.cradle.curateScheduledSubscriptionsController({}, dummyResponse);
      expect(container.cradle.createCartFromCuratedRecipesService).not.toHaveBeenCalled();
      expect(container.cradle.getCuratedRecipesService).not.toHaveBeenCalled();
      expect(dummyResponse.sendStatus).toHaveBeenCalledWith(204);
    });
  });
});