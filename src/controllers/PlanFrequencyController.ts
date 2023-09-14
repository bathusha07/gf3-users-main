import asyncHandler from '../middleware/async';
import { PlanFrequencyBehaviour } from '../domain/types';

export default class PlanFrequencyController {
  protected planFrequencyBehaviour: PlanFrequencyBehaviour;

  public constructor({
    planFrequencyBehaviour,
  }: {
    planFrequencyBehaviour: PlanFrequencyBehaviour;
  }) {
    this.planFrequencyBehaviour = planFrequencyBehaviour;
  }

  public getPlanFrequencies = asyncHandler(async (req, res) => {
    const planFrequencies = await this.planFrequencyBehaviour.getPlanFrequencies();
    res.status(200).json(planFrequencies);
  });
}
