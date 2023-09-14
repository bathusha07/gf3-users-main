import faker from 'faker';
import { PlanEntity } from '@makegoodfood/gf3-types';
import Plan from '../../src/domain/plan/Plan';

const generatePlan = (options?: Partial<PlanEntity>): Plan => {
  return new Plan({
    id: faker.datatype.uuid(),
    number_of_recipes: faker.datatype.number(),
    number_of_portions: faker.datatype.number(),
    ...options,
  });
};

export default generatePlan;
