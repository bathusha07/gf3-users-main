import { PrismaClient } from '@prisma/client';

const seedTerms = async (prismaClient: PrismaClient): Promise<void> => {
  await prismaClient.terms.createMany({
    data: [
      {
        id: 'd3345060-01e2-44df-9ac9-15896ecfc180',
        name: 'mealkits-weekly',
      },
      {
        id: 'f0ba32f6-6250-4607-bfa7-78e27143f0ca',
        name: 'wow',
      },
      {
        id: '70c7c716-752e-4c80-a23e-d7c4baf91a00',
        name: 'wow-yearly',
      },
      {
        id: 'd9021c50-1ae1-496e-8411-c09797858844',
        name: 'wow-one-year-trial',
      },
    ],
    skipDuplicates: true,
  });
};

export default seedTerms;
