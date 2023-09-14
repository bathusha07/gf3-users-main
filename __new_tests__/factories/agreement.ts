import faker from 'faker';
import { AgreementEntity } from '@makegoodfood/gf3-types';
import Agreement from '../../src/domain/agreement/Agreement';

const generateAgreement = (options?: Partial<AgreementEntity>): Agreement => {
  return new Agreement({
    id: faker.datatype.number(),
    terms_id: faker.datatype.uuid(),
    user_id: faker.datatype.uuid(),
    ip_address: faker.internet.ip(),
    ...options,
  });
};

export default generateAgreement;
