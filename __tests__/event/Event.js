const Event = require('../../domain/event/entity');

describe('Event', () => {
  describe('when attempting to instantiate an Event with no data', () => {
    test('an EntityInstantiationError should be thrown', () => {
      const error = (() => {
        try {
          const event = new Event();
        } catch (e) {
          return e;
        }
      })();
      expect(error.name).toBe('EntityInstantiationError');
    });
  });
});
