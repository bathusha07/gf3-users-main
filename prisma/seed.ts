import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import seedProvinces from './seeders/province';
import seedMemberships from './seeders/membership';
import seedMembershipPrices from './seeders/membershipPrice';
import seedPlans from './seeders/plan';
import seedPlanFrequencies from './seeders/planFrequency';
import seedCancellationReasons from './seeders/cancellationReasons';
import seedTerms from './seeders/terms';

async function main() {
  await seedProvinces(prisma);
  await seedMemberships(prisma);
  await seedMembershipPrices(prisma);
  await seedPlans(prisma);
  await seedPlanFrequencies(prisma);
  await seedCancellationReasons(prisma);
  await seedTerms(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
