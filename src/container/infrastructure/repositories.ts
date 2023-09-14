import * as awilix from 'awilix';
import prisma from '../../infrastructure/repositories/client/PrismaClient';
import PrismaAddressRepository from '../../infrastructure/repositories/PrismaAddressRepository';
import PrismaAgreementRepository from '../../infrastructure/repositories/PrismaAgreementRepository';
import PrismaCardRepository from '../../infrastructure/repositories/PrismaCardRepository';
import PrismaMembershipRepository from '../../infrastructure/repositories/PrismaMembershipRepository';
import PrismaMembershipPriceRepository from '../../infrastructure/repositories/PrismaMembershipPriceRepository';
import PrismaPlanRepository from '../../infrastructure/repositories/PrismaPlanRepository';
import PrismaPlanFrequencyRepository from '../../infrastructure/repositories/PrismaPlanFrequencyRepository';
import PrismaPreferenceRepository from '../../infrastructure/repositories/PrismaPreferenceRepository';
import PrismaStripeCustomerRepository from '../../infrastructure/repositories/PrismaStripeCustomerRepository';
import PrismaSubscriptionRepository from '../../infrastructure/repositories/PrismaSubscriptionRepository';
import PrismaTermsRepository from '../../infrastructure/repositories/PrismaTermsRepository';
import PrismaUserRepository from '../../infrastructure/repositories/PrismaUserRepository';
import PrismaCancellationReasonRepository from '../../infrastructure/repositories/PrismaCancellationReasonRepository';

export default {
  // Register prismaClient as a function to avoid circular resolution errors
  prismaClient: awilix.asFunction(() => prisma, {
    lifetime: awilix.Lifetime.SINGLETON,
  }),

  addressRepository: awilix.asClass(PrismaAddressRepository),
  agreementRepository: awilix.asClass(PrismaAgreementRepository),
  cardRepository: awilix.asClass(PrismaCardRepository),
  membershipRepository: awilix.asClass(PrismaMembershipRepository),
  membershipPriceRepository: awilix.asClass(PrismaMembershipPriceRepository),
  planRepository: awilix.asClass(PrismaPlanRepository),
  planFrequencyRepository: awilix.asClass(PrismaPlanFrequencyRepository),
  preferenceRepository: awilix.asClass(PrismaPreferenceRepository),
  stripeCustomerRepository: awilix.asClass(PrismaStripeCustomerRepository),
  subscriptionRepository: awilix.asClass(PrismaSubscriptionRepository),
  userRepository: awilix.asClass(PrismaUserRepository),
  termsRepository: awilix.asClass(PrismaTermsRepository),
  cancellationReasonRepository: awilix.asClass(PrismaCancellationReasonRepository),
};
