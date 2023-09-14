const faker = require('faker');
const Subscription = require('../domain/subscription/entity');

const generateSubscription = () => {
  return new Subscription({
    id: faker.random.uuid(),
    user_id: faker.random.uuid(),
    card_id: faker.random.uuid(),
    address_id: faker.random.number(),
    terms_id: faker.random.uuid(),
    ip_address: faker.internet.ip(),
    state: faker.random.arrayElement([
      'ACTIVE',
      'CANCELLATION',
      'TRIAL',
      'UNPAID',
      'CANCELLED',
      'PAUSED',
      'SUSPENDED',
    ]),
    subscription_type: faker.random.arrayElement(['MEMBERSHIP']),
    product_id: faker.random.uuid(),
    frequency_type: faker.random.arrayElement(['DAY', 'MONTH', 'YEAR']),
    frequency_value: faker.random.number(),
    next_cycle: faker.date.future(),
    send_notification: faker.random.boolean(),
  });
};

module.exports = generateSubscription;
