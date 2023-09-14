const EntityInstantiationError = require('../../domain/errors/EntityInstantiationError');

describe('EntityInstantiationError', () => {
  describe('when throwing an EntityInstantiationError with no message defined', () => {
    test('a default message should be set', () => {
      const error = (() => {
        try {
          throw EntityInstantiationError();
        } catch (e) {
          return e;
        }
      })();
      expect(typeof(error.message)).toBe('string');
    });
  });
});
