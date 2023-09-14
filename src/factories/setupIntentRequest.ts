const faker = require('faker');

const generateSetupIntentRequest = () => {
  return {
    firebase_id: faker.random.alphaNumeric(28),
    requester_id: faker.random.alphaNumeric(28),
  };
};

module.exports = generateSetupIntentRequest;
