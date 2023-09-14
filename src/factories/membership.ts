const faker = require('faker');
const Membership = require('../domain/membership/entity');

const generateMembership = (options = {}) => {
  return Membership({
    id: faker.random.uuid(),
    code: faker.random.alphaNumeric(255),
    name: faker.random.alphaNumeric(255),
    trial_type: faker.random.arrayElement(['DAY', 'MONTH', 'YEAR']),
    trial_value: options.skipTrial ? 0 : faker.random.number({ min: 1 }),
    frequency_type: faker.random.arrayElement(['DAY', 'MONTH', 'YEAR']),
    frequency_value: faker.random.number(),
  });
};

module.exports = generateMembership;
