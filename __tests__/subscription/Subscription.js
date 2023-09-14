const Subscription = require('../../domain/subscription/entity');

describe('Subscription', () => {
  describe('when attempting to instantiate a Subscription with no data', () => {
    test('an EntityInstantiationError should be thrown', () => {
      const error = (() => {
        try {
          const event = new Subscription();
        } catch (e) {
          return e;
        }
      })();
      expect(error.name).toBe('EntityInstantiationError');
    });
  });
});
