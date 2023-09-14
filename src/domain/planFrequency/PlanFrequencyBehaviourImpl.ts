import { PlanFrequencyBehaviour, PlanFrequencyRepository } from '../types';
import { PlanFrequencyEntity } from '@makegoodfood/gf3-types';

export default class PlanFrequencyBehaviourImpl implements PlanFrequencyBehaviour {
  protected planFrequencyRepository: PlanFrequencyRepository;

  public constructor({
    planFrequencyRepository,
  }: {
    planFrequencyRepository: PlanFrequencyRepository;
  }) {
    this.planFrequencyRepository = planFrequencyRepository;
  }

  public getPlanFrequencies = async (): Promise<PlanFrequencyEntity[]> => {
    return await this.planFrequencyRepository.getPlanFrequencies();
  };
}
