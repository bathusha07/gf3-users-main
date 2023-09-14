const faker = require('faker');

const generateCard = (stripe_customer_id = null) => {
  return {
    id: faker.random.uuid(),
    stripe_customer_id: stripe_customer_id ? stripe_customer_id : faker.random.uuid(),
    stripe_payment_method_id: 'pm_' + faker.random.alphaNumeric(24),
  };
};

module.exports = generateCard;
