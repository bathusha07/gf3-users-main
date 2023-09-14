const PostalCode = require('../../../domain/address/valueObjects/PostalCode');

describe('PostalCode', () => {
  describe('when a valid PostalCode object is instantiated', () => {
    test('getPostalCode() returns the postalCode', () => {
      const code = 'A1A 1A1';
      const postalCode = new PostalCode(code);
      expect(postalCode.getPostalCode()).toBe(code);
    });
  });
});
