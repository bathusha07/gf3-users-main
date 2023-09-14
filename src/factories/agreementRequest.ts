const faker = require('faker');

const generateAgreementRequest = () => {
  return {
    terms_id: faker.random.uuid(),
    user_id: faker.random.uuid(),
    ip_address: faker.internet.ip(),
  };
};

module.exports = generateAgreementRequest;
