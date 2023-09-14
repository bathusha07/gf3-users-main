import faker from 'faker';
import { PreferenceEntity } from '@makegoodfood/gf3-types';
import Preference from '../../src/domain/user/Preference';

const generatePreference = (options?: Partial<PreferenceEntity>): Preference => {
  return new Preference({
    id: faker.datatype.number(),
    user_id: faker.datatype.uuid(),
    subscription_id: faker.datatype.uuid(),
    tag: faker.lorem.word(),
    ...options,
  });
};

export default generatePreference;
