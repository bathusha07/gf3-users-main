const Agreement = require('../../domain/agreement/entity');

describe('Agreement', () => {
  describe('when attempting to instantiate a Agreement with no data', () => {
    test('an EntityInstantiationError should be thrown', () => {
      const error = (() => {
        try {
          const event = new Agreement();
        } catch (e) {
          return e;
        }
      })();
      expect(error.name).toBe('EntityInstantiationError');
    });
  });
});
