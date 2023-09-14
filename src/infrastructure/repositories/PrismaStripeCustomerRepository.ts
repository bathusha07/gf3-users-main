import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { StripeCustomerRepository } from '../../domain/types';
import { StripeCustomerEntity, StripeCustomerId, UserId } from '@makegoodfood/gf3-types';
import StripeCustomer from '../../domain/stripeCustomer/StripeCustomer';
import handlePrismaError from './prismaErrorHandler';
import { ANONYMIZED_STRIPE_CUSTOMER_PREFIX } from '../../domain/stripeCustomer/constants';

export default class PrismaStripeCustomerRepository implements StripeCustomerRepository {
  protected prismaClient: PrismaClient;

  public constructor({ prismaClient }: { prismaClient: PrismaClient }) {
    this.prismaClient = prismaClient;
  }

  public createStripeCustomer = async (
    stripeCustomerToCreate: StripeCustomerEntity,
  ): Promise<StripeCustomerEntity> => {
    const createdStripeCustomer = await this.prismaClient.stripeCustomer.create({
      data: stripeCustomerToCreate,
    });
    return new StripeCustomer(createdStripeCustomer);
  };

  public getStripeCustomerByUserId = async (
    userId: UserId,
  ): Promise<StripeCustomerEntity | null> => {
    const stripeCustomer = await this.prismaClient.stripeCustomer.findUnique({
      where: { user_id: userId },
    });
    if (stripeCustomer) {
      return new StripeCustomer(stripeCustomer);
    }
    return null;
  };

  public getStripeCustomerByStripeId = async (
    stripeId: StripeCustomerId,
  ): Promise<StripeCustomerEntity | null> => {
    const stripeCustomer = await this.prismaClient.stripeCustomer.findUnique({
      where: { stripe_customer_id: stripeId },
    });
    if (stripeCustomer) {
      return new StripeCustomer(stripeCustomer);
    }
    return null;
  };

  public anonymizeStripeCustomer = async (stripeId: StripeCustomerId): Promise<void> => {
    try {
      const anonymizedCustomerId = ANONYMIZED_STRIPE_CUSTOMER_PREFIX.concat(
        stripeId.substring(4, 7).concat(uuidv4().substring(0, 5)),
      );
      await this.prismaClient.stripeCustomer.update({
        where: { stripe_customer_id: stripeId },
        data: {
          stripe_customer_id: anonymizedCustomerId,
          deleted_at: new Date(),
          cards: {
            updateMany: {
              where: { stripe_customer_id: anonymizedCustomerId },
              data: {
                deleted_at: new Date(),
              },
            },
          },
        },
      });
    } catch (e) {
      throw handlePrismaError(e);
    }
  };
}
