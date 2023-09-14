const Country = require('../../../domain/address/valueObjects/Country');

describe('Country', () => {
  describe('when attempting to instantiate with an invalid code', () => {
    test('a ValueObjectValidationError should be thrown', () => {
      const invalidCountryError = (() => {
        try {
          const country = new Country('invalid code');
        } catch (error) {
          return error;
        }
      })();
      expect(invalidCountryError.name).toBe('ValueObjectValidationError');
    });
  });

  describe('when a valid Country object is instantiated', () => {
    test('getCode() returns the code', () => {
      const countryCode = 'CA';
      const country = new Country(countryCode);
      expect(country.getCode()).toBe(countryCode);
    });
  });
});
