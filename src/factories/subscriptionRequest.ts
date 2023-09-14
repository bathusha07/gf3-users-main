const faker = require('faker');
const subscrptionConstants = require('../domain/subscription/constants');
const dateConstants = require('../domain/date/constants');

const generateMembershipSubscriptionRequest = () => {
  return {
    user_id: faker.random.uuid(),
    card_id: faker.random.uuid(),
    address_id: faker.random.number(),
    terms_id: faker.random.uuid(),
    ip_address: faker.internet.ip(),
    subscription_type: subscrptionConstants.TYPE_MEMBERSHIP,
    product_id: faker.random.uuid(),
    send_notification: faker.random.boolean(),
  };
};

const generateScheduledSubscriptionRequest = () => {
  return {
    user_id: faker.random.uuid(),
    card_id: faker.random.uuid(),
    address_id: faker.random.number(),
    terms_id: faker.random.uuid(),
    ip_address: faker.internet.ip(),
    subscription_type: subscrptionConstants.TYPE_SCHEDULED,
    product_id: faker.random.uuid(),
    send_notification: faker.random.boolean(),
    delivery_day: faker.random.arrayElement(dateConstants.VALID_DAYS),
    plan_frequency_id: faker.random.number(),
  };
};

module.exports = {
  generateMembershipSubscriptionRequest,
  generateScheduledSubscriptionRequest,
};
