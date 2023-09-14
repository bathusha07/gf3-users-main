import { PlanFrequencyEntity, PlanFrequencyId } from '@makegoodfood/gf3-types';

export interface PlanFrequencyBehaviour {
  getPlanFrequencies: () => Promise<PlanFrequencyEntity[]>;
}

export interface PlanFrequencyRepository {
  getPlanFrequency: (id: PlanFrequencyId) => Promise<PlanFrequencyEntity | null>;
  getPlanFrequencyId: (
    frequencyType: PlanFrequencyEntity['frequency_type'],
    frequencyValue: PlanFrequencyEntity['frequency_value'],
  ) => Promise<PlanFrequencyId | null>;
  getPlanFrequencies: () => Promise<PlanFrequencyEntity[]>;
}
