import { PlanBehaviour, PlanRepository, CatalogService } from '../types';
import { PlanEntity } from '@makegoodfood/gf3-types';

export default class PlanBehaviourImpl implements PlanBehaviour {
  protected planRepository: PlanRepository;
  protected catalogService: CatalogService;

  public constructor({
    planRepository,
    catalogService,
  }: {
    planRepository: PlanRepository;
    catalogService: CatalogService;
  }) {
    this.planRepository = planRepository;
    this.catalogService = catalogService;
  }

  public getPlans = async (): Promise<PlanEntity[]> => {
    return await this.planRepository.getPlans();
  };
}
