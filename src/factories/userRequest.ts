const faker = require('faker');

const generateUserRequest = () => {
  return {
    firebase_id: faker.random.alphaNumeric(28),
    email: faker.internet.email(),
    first_name: faker.name.firstName(),
    last_name: faker.name.lastName(),
  };
};

module.exports = generateUserRequest;
