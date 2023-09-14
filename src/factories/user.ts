const faker = require('faker');

const generateUser = () => {
  return {
    id: faker.random.uuid(),
    email: faker.internet.email(),
    first_name: faker.name.firstName(),
    last_name: faker.name.lastName(),
    firebase_id: faker.random.alphaNumeric(28),
  };
};

module.exports = generateUser;
