import faker from 'faker';
import { UserEntity } from '@makegoodfood/gf3-types';
import User from '../../src/domain/user/User';

const generateUser = (options?: Partial<UserEntity>): User => {
  return new User({
    id: faker.datatype.uuid(),
    email: faker.internet.email(),
    first_name: faker.name.firstName(),
    last_name: faker.name.lastName(),
    phone: faker.phone.phoneNumberFormat(0).replace(/-/g, ''),
    firebase_id: faker.random.alphaNumeric(28),
    language: 'en',
    ...options,
  });
};

export default generateUser;
