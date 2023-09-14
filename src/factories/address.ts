const faker = require('faker');

const generateAddress = () => {
  return {
    id: faker.random.number(),
    user_id: faker.random.uuid(),
    address_line_1: faker.address.streetAddress(),
    address_line_2: null,
    company: faker.company.companyName(),
    city: faker.address.city(),
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
    country_code: 'CA',
    postal_code: 'A1A 1A1',
    fsa: 'A1A',
    special_instructions: faker.random.words(),
    is_default: false,
  };
};

module.exports = generateAddress;
