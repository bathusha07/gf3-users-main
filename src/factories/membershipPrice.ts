const faker = require('faker');
const MembershipPrice = require('../domain/membershipPrice/entity');

const generateMembershipPrice = (membershipId) => {
  return MembershipPrice({
    id: faker.random.number(),
    membership_id: membershipId,
    province_code: faker.random.arrayElement([
      'QC',
      'ON',
      'NL',
      'PE',
      'NS',
      'NB',
      'MB',
      'SK',
      'AB',
      'BC',
      'YT',
      'NT',
      'NU',
    ]),
    price: faker.random.number(),
    tax_code: faker.random.alphaNumeric(255),
  });
};

module.exports = generateMembershipPrice;
