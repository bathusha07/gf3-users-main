import { PrismaClient } from '@prisma/client';

const seedProvinces = async (prismaClient: PrismaClient): Promise<void> => {
  await prismaClient.province.createMany({
    data: [
      { code: 'QC', name: 'Quebec' },
      { code: 'ON', name: 'Ontario' },
      { code: 'NL', name: 'Newfoundland and Labrador' },
      { code: 'PE', name: 'Prince Edward Island' },
      { code: 'NS', name: 'Nova Scotia' },
      { code: 'NB', name: 'New Brunswick' },
      { code: 'MB', name: 'Manitoba' },
      { code: 'SK', name: 'Saskatchewan' },
      { code: 'AB', name: 'Alberta' },
      { code: 'BC', name: 'British Columbia' },
      { code: 'YT', name: 'Yukon' },
      { code: 'NT', name: 'Northwest Territories' },
      { code: 'NU', name: 'Nunavut' },
    ],
    skipDuplicates: true,
  });
};

export default seedProvinces;
