import asyncHandler from '../middleware/async';
import { PlanBehaviour } from '../domain/types';

export default class PlanController {
  protected planBehaviour: PlanBehaviour;

  public constructor({ planBehaviour }: { planBehaviour: PlanBehaviour }) {
    this.planBehaviour = planBehaviour;
  }

  public getPlans = asyncHandler(async (req, res) => {
    const plans = await this.planBehaviour.getPlans();
    res.status(200).json(plans);
  });
}
