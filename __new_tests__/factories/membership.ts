import faker from 'faker';
import { MembershipEntity } from '@makegoodfood/gf3-types';
import Membership from '../../src/domain/membership/Membership';

const generateMembership = (options?: Partial<MembershipEntity>): Membership => {
  return new Membership({
    id: faker.datatype.uuid(),
    code: faker.random.alphaNumeric(255),
    name: faker.random.alphaNumeric(255),
    trial_type: faker.random.arrayElement(['DAY', 'MONTH', 'YEAR']),
    trial_value: faker.datatype.number({ min: 1 }),
    frequency_type: faker.random.arrayElement(['DAY', 'MONTH', 'YEAR']),
    frequency_value: faker.datatype.number(),
    ...options,
  });
};

export default generateMembership;
