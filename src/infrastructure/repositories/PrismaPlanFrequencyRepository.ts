import { PrismaClient } from '@prisma/client';
import { PlanFrequencyRepository } from '../../domain/types';
import { PlanFrequencyEntity, PlanFrequencyId } from '@makegoodfood/gf3-types';
import PlanFrequency from '../../domain/planFrequency/PlanFrequency';

export default class PrismaPlanFrequencyRepository implements PlanFrequencyRepository {
  protected prismaClient: PrismaClient;

  public constructor({ prismaClient }: { prismaClient: PrismaClient }) {
    this.prismaClient = prismaClient;
  }

  public getPlanFrequency = async (id: number): Promise<PlanFrequencyEntity | null> => {
    const planFrequency = await this.prismaClient.planFrequency.findUnique({
      where: { id },
    });
    if (planFrequency) {
      return new PlanFrequency(planFrequency);
    }
    return null;
  };

  public getPlanFrequencies = async (): Promise<PlanFrequencyEntity[]> => {
    const rawPlanFrequencies = await this.prismaClient.planFrequency.findMany({
      where: { deleted_at: null },
    });
    return rawPlanFrequencies.map(
      (planFrequency: PlanFrequencyEntity) => new PlanFrequency(planFrequency),
    );
  };

  public getPlanFrequencyId = async (
    frequencyType: PlanFrequencyEntity['frequency_type'],
    frequencyValue: PlanFrequencyEntity['frequency_value'],
  ): Promise<PlanFrequencyId | null> => {
    const planFrequency = await this.prismaClient.planFrequency.findFirst({
      where: {
        frequency_type: frequencyType,
        frequency_value: frequencyValue,
      },
    });

    return planFrequency?.id ?? null;
  };
}
