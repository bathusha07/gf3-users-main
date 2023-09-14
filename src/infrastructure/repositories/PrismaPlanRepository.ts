import { PrismaClient } from '@prisma/client';
import { PlanRepository } from '../../domain/types';
import { PlanEntity, PlanId } from '@makegoodfood/gf3-types';
import Plan from '../../domain/plan/Plan';

export default class PrismaPlanRepository implements PlanRepository {
  protected prismaClient: PrismaClient;

  public constructor({ prismaClient }: { prismaClient: PrismaClient }) {
    this.prismaClient = prismaClient;
  }

  public getPlan = async (id: PlanId): Promise<PlanEntity | null> => {
    const plan = await this.prismaClient.plan.findUnique({
      where: { id },
    });
    if (plan) {
      return new Plan(plan);
    }
    return null;
  };

  public getPlans = async (): Promise<PlanEntity[]> => {
    const rawPlans = await this.prismaClient.plan.findMany({
      where: { deleted_at: null },
    });
    return rawPlans.map((plan: PlanEntity) => new Plan(plan));
  };
}
