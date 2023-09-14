import faker from 'faker';
import { CancellationReasonEntity } from '@makegoodfood/gf3-types';
import CancellationReason from '../../src/domain/subscription/CancellationReason';

const generateCancellationReason = (
  options?: Partial<CancellationReasonEntity>,
): CancellationReason => {
  return new CancellationReason({
    id: faker.datatype.number(),
    code: faker.datatype.string(),
    priority: faker.datatype.number(),
    is_user_visible: faker.datatype.boolean(),
    entry_type: faker.random.arrayElement(['EDITABLE']),
    ...options,
  });
};

export default generateCancellationReason;
