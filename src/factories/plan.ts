const faker = require('faker');
const Plan = require('../domain/plan/entity');

const generatePlan = () => {
  return Plan({
    id: faker.random.uuid(),
    number_of_recipes: faker.random.number(),
    number_of_portions: faker.random.number(),
  });
};

module.exports = generatePlan;
