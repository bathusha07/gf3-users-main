import { PrismaClient } from '@prisma/client';
import { DATE_UNIT_DAY } from '@makegoodfood/gf3-types';

const seedPlanFrequencies = async (prismaClient: PrismaClient): Promise<void> => {
  await prismaClient.planFrequency.createMany({
    data: [
      {
        id: 1,
        frequency_type: DATE_UNIT_DAY,
        frequency_value: 7,
      },
      {
        id: 2,
        frequency_type: DATE_UNIT_DAY,
        frequency_value: 14,
      },
      {
        id: 3,
        frequency_type: DATE_UNIT_DAY,
        frequency_value: 28,
      },
    ],
    skipDuplicates: true,
  });
};

export default seedPlanFrequencies;
