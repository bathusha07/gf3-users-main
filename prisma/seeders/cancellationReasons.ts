import { PrismaClient } from '@prisma/client';

const seedCancellationReasons = async (prismaClient: PrismaClient): Promise<void> => {
  await prismaClient.cancellationReason.createMany({
    data: [
      {
        code: 'TOO_EXPENSIVE',
        priority: 1,
        is_user_visible: true,
      },
      {
        code: 'OTHER',
        priority: 2,
        entry_type: 'EDITABLE',
        is_user_visible: true,
      },
      {
        code: 'FRAUD',
        is_user_visible: false,
      },
      {
        code: 'PAYMENT_FAILED',
        is_user_visible: false,
      },
    ],
    skipDuplicates: true,
  });
};

export default seedCancellationReasons;
