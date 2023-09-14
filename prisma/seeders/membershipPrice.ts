import { PrismaClient } from '@prisma/client';

const seedMembershipPrices = async (prismaClient: PrismaClient): Promise<void> => {
  await prismaClient.membershipPrice.createMany({
    data: [
      {
        id: 1,
        membership_id: '70c7c716-752e-4c80-a23e-d7c4baf91a00',
        province_code: 'ON',
        price: 10.99,
        tax_code: 'FR020400',
      },
      {
        id: 2,
        membership_id: '70c7c716-752e-4c80-a23e-d7c4baf91a00',
        province_code: 'QC',
        price: 9.99,
        tax_code: 'FR020401',
      },
      {
        id: 3,
        membership_id: 'f0ba32f6-6250-4607-bfa7-78e27143f0ca',
        province_code: 'ON',
        price: 109.99,
        tax_code: 'FR020400',
      },
      {
        id: 4,
        membership_id: 'f0ba32f6-6250-4607-bfa7-78e27143f0ca',
        province_code: 'QC',
        price: 99.99,
        tax_code: 'FR020401',
      },
    ],
    skipDuplicates: true,
  });
};

export default seedMembershipPrices;
