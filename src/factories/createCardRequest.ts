const faker = require('faker');

const generateCreateCardRequest = (stripe_id = null) => {
  return {
    stripe_payment_method_id: 'pm_' + faker.random.alphaNumeric(24),
    stripe_customer_id: stripe_id ? stripe_id : 'cus_' + faker.random.alphaNumeric(14),
  };
};

module.exports = generateCreateCardRequest;
