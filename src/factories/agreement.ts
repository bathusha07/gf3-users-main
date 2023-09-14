const faker = require('faker');
const Agreement = require('../domain/agreement/entity');

const generateAgreement = () => {
  return new Agreement({
    id: faker.random.number(),
    terms_id: faker.random.uuid(),
    user_id: faker.random.uuid(),
    ip_address: faker.internet.ip(),
  });
};

module.exports = generateAgreement;
