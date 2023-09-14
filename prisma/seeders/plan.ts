import { PrismaClient } from '@prisma/client';

const seedPlans = async (prismaClient: PrismaClient): Promise<void> => {
  await prismaClient.plan.createMany({
    data: [
      {
        id: 'e7f7078e-6767-4d69-bd67-f60438fc4b13',
        number_of_recipes: 3,
        number_of_portions: 2,
      },
      {
        id: 'dc61bf6c-f465-46b2-8d37-4ad3bb3fe136',
        number_of_recipes: 3,
        number_of_portions: 4,
      },
      {
        id: '45c6d20c-f98a-4c87-bc51-cc2f649848fb',
        number_of_recipes: 2,
        number_of_portions: 4,
      },
      {
        id: 'f7ce01de-de02-42b8-8cc5-ea2562ef08b6',
        number_of_recipes: 4,
        number_of_portions: 2,
      },
      {
        id: '6467d430-4cd6-47e4-9d3e-469c7e4420a8',
        number_of_recipes: 4,
        number_of_portions: 4,
      },
      {
        id: '762be09e-663c-4ca0-bacd-474bde1f2b45',
        number_of_recipes: 2,
        number_of_portions: 4,
      },
      {
        id: '92b19120-88b4-456d-b730-2df64d09053e',
        number_of_recipes: 3,
        number_of_portions: 4,
      },
      {
        id: '8c2a8f11-e74d-4d87-ba16-680d67ccc5f3',
        number_of_recipes: 4,
        number_of_portions: 4,
      },
      {
        id: '36fcc118-3aad-4983-af25-bf00606a8a0e',
        number_of_recipes: 3,
        number_of_portions: 2,
      },
      {
        id: '5f464913-f82d-4e61-9da0-c7fd5416e152',
        number_of_recipes: 2,
        number_of_portions: 4,
      },
      {
        id: '9bce9537-49ad-47da-a777-5a512e0e6423',
        number_of_recipes: 3,
        number_of_portions: 4,
      },
      {
        id: 'c8ebdc01-00bd-48a1-80b5-5862a3f706c8',
        number_of_recipes: 3,
        number_of_portions: 2,
      },
      {
        id: '745293c5-0feb-43f8-9470-a51288c04ea8',
        number_of_recipes: 4,
        number_of_portions: 2,
      },
      {
        id: '8aea571e-48d5-4a81-9313-4471f906598a',
        number_of_recipes: 2,
        number_of_portions: 4,
      },
      {
        id: 'bceeb2e7-c6a9-4b6d-8abb-d110ddf87d1a',
        number_of_recipes: 3,
        number_of_portions: 4,
      },
      {
        id: '6c95a30e-bf84-4cba-9975-2010756aec58',
        number_of_recipes: 4,
        number_of_portions: 4,
      },
      {
        id: '75ad7ac2-d80e-4453-86cf-aec01b155d09',
        number_of_recipes: 3,
        number_of_portions: 2,
      },
      {
        id: 'd53206fa-6273-40e7-b414-d33d100aa0b2',
        number_of_recipes: 4,
        number_of_portions: 2,
      },
      {
        id: 'a733c1de-d3c3-493f-86a6-4ba0b600bf72',
        number_of_recipes: 2,
        number_of_portions: 4,
      },
      {
        id: '192114f3-c23f-41c0-b99f-71ab0c0bd5ca',
        number_of_recipes: 3,
        number_of_portions: 4,
      },
      {
        id: 'efac005e-b82f-4996-b629-f26d7df451f2',
        number_of_recipes: 4,
        number_of_portions: 4,
      },
    ],
    skipDuplicates: true,
  });
};

export default seedPlans;
