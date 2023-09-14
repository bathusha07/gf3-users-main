import { PrismaClient } from '@prisma/client';
import { DATE_UNIT_DAY, DATE_UNIT_MONTH, DATE_UNIT_YEAR } from '@makegoodfood/gf3-types';

const seedMemberships = async (prismaClient: PrismaClient): Promise<void> => {
  await prismaClient.membership.createMany({
    data: [
      {
        id: '70c7c716-752e-4c80-a23e-d7c4baf91a00',
        code: 'wow-monthly',
        name: 'wow',
        trial_type: DATE_UNIT_DAY,
        trial_value: 90,
        frequency_type: DATE_UNIT_MONTH,
        frequency_value: 1,
      },
      {
        id: 'f0ba32f6-6250-4607-bfa7-78e27143f0ca',
        code: 'wow-yearly',
        name: 'wow',
        trial_type: DATE_UNIT_DAY,
        trial_value: 90,
        frequency_type: DATE_UNIT_YEAR,
        frequency_value: 1,
      },
      {
        id: '6e224910-a9c8-4b8f-8263-20c17c2b5f78',
        code: 'wow-one-year-trial',
        name: 'wow',
        trial_type: DATE_UNIT_YEAR,
        trial_value: 1,
        frequency_type: DATE_UNIT_YEAR,
        frequency_value: 1,
      },
    ],
    skipDuplicates: true,
  });
};

export default seedMemberships;
