import { PlanEntity, PlanId } from '@makegoodfood/gf3-types';

export interface PlanBehaviour {
  getPlans: () => Promise<PlanEntity[]>;
}

export interface PlanRepository {
  getPlan: (id: PlanId) => Promise<PlanEntity | null>;
  getPlans: () => Promise<PlanEntity[]>;
}
