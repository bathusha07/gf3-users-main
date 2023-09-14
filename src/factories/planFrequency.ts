const faker = require('faker');
const PlanFrequency = require('../domain/planFrequency/entity');

const generatePlanFrequency = () => {
  return PlanFrequency({
    id: faker.random.number(),
    frequency_type: faker.random.arrayElement(['DAY', 'MONTH', 'YEAR']),
    frequency_value: faker.random.number(),
  });
};

module.exports = generatePlanFrequency;
