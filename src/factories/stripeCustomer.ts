const faker = require('faker');

const generateStripeCustomer = (user_id = null) => {
  return {
    id: faker.random.uuid(),
    user_id: user_id ? user_id : faker.random.uuid(),
    stripe_id: 'cus_' + faker.random.alphaNumeric(14),
  };
};

module.exports = generateStripeCustomer;
