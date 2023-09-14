import faker from 'faker';
import { TermsEntity } from '@makegoodfood/gf3-types';
import Terms from '../../src/domain/terms/Terms';

const generateTerms = (options?: Partial<TermsEntity>): Terms => {
  return new Terms({
    id: faker.datatype.uuid(),
    name: faker.lorem.word(),
    ...options,
  });
};

export default generateTerms;
