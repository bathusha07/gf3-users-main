import faker from 'faker';
import { AddressEntity } from '@makegoodfood/gf3-types';
import Address from '../../src/domain/address/Address';

const generateAddress = (options?: Partial<AddressEntity>): Address => {
  const postalCode = 'H2X 2S1';
  return new Address({
    id: faker.datatype.uuid(),
    address_line_1: faker.address.streetAddress(),
    address_line_2: '',
    company: faker.company.companyName(),
    city: faker.address.city(),
    postal_code: postalCode,
    fsa: postalCode.substring(0, 3),
    special_instructions: faker.lorem.sentence(),
    province_code: 'QC',
    country_code: 'CA',
    building_type: 'house',
    user_id: faker.datatype.uuid(),
    is_default: true,
    ...options,
  });
};

export default generateAddress;
