import { Prisma, PrismaClient, PrismaPromise } from '@prisma/client';
import { CardRepository, StripeCustomerRepository, UserRepository } from '../../domain/types';
import { CardEntity, CardId, UserId } from '@makegoodfood/gf3-types';
import Card from '../../domain/card/Card';
import User from '../../domain/user/User';
import ResourceNotFound from '../../domain/errors/ResourceNotFound';
import handlePrismaError from './prismaErrorHandler';

export default class PrismaCardRepository implements CardRepository {
  protected prismaClient: PrismaClient;
  public stripeCustomerRepository: StripeCustomerRepository;
  public userRepository: UserRepository;

  public constructor({
    prismaClient,
    stripeCustomerRepository,
    userRepository,
  }: {
    prismaClient: PrismaClient;
    stripeCustomerRepository: StripeCustomerRepository;
    userRepository: UserRepository;
  }) {
    this.prismaClient = prismaClient;
    this.stripeCustomerRepository = stripeCustomerRepository;
    this.userRepository = userRepository;
  }

  public createCard = async (cardToCreate: CardEntity): Promise<CardEntity> => {
    let createdCard;
    try {
      createdCard = await this.prismaClient.card.create({
        data: cardToCreate,
      });
    } catch (error) {
      throw handlePrismaError(error);
    }

    return new Card(createdCard);
  };

  public getCard = async (id: CardId): Promise<CardEntity | null> => {
    const card = await this.prismaClient.card.findUnique({
      where: { id },
    });
    if (card) {
      return new Card(card);
    }
    return null;
  };

  public getCardForUser = async (id: CardId, userId: UserId): Promise<CardEntity | null> => {
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new ResourceNotFound(User.name, userId);
    }

    const stripeCustomer = await this.prismaClient.stripeCustomer.findUnique({
      where: { user_id: userId },
      select: {
        cards: {
          where: { id },
        },
      },
    });

    if (stripeCustomer && stripeCustomer.cards.length) {
      return new Card(stripeCustomer.cards[0]);
    }
    return null;
  };

  public getCardByStripePaymentMethodId = async (
    stripePaymentMethodId: string,
  ): Promise<CardEntity | null> => {
    const card = await this.prismaClient.card.findUnique({
      where: { stripe_payment_method_id: stripePaymentMethodId },
    });
    if (card) {
      return new Card(card);
    }
    return null;
  };

  public getCardByStripeCardId = async (stripeCardId: string): Promise<CardEntity | null> => {
    const card = await this.prismaClient.card.findUnique({
      where: { stripe_card_id: stripeCardId },
    });
    if (card) {
      return new Card(card);
    }
    return null;
  };

  public getCardByStripeCardToken = async (stripeCardToken: string): Promise<CardEntity | null> => {
    const card = await this.prismaClient.card.findUnique({
      where: { stripe_card_token: stripeCardToken },
    });
    if (card) {
      return new Card(card);
    }
    return null;
  };

  public getUserCards = async (userId: UserId): Promise<CardEntity[]> => {
    void (await this.userRepository.getUser(userId));
    const stripeCustomer = await this.prismaClient.stripeCustomer.findUnique({
      where: { user_id: userId },
      include: {
        cards: {
          where: { deleted_at: null },
          orderBy: [
            {
              is_default: 'desc',
            },
            {
              updated_at: 'desc',
            },
          ],
        },
      },
    });

    if (stripeCustomer && stripeCustomer.cards.length) {
      return stripeCustomer.cards.map((card) => new Card(card));
    }
    return [];
  };

  public getUserCardHistory = async (userId: UserId): Promise<CardEntity[]> => {
    void (await this.userRepository.getUser(userId));
    const stripeCustomer = await this.prismaClient.stripeCustomer.findUnique({
      where: { user_id: userId },
      include: { cards: true },
    });

    if (stripeCustomer && stripeCustomer.cards.length) {
      return stripeCustomer.cards.map((card) => new Card(card));
    }
    return [];
  };

  public updateCard = async (id: CardId, update: Omit<CardEntity, 'id'>): Promise<CardEntity> => {
    const updatedCard = await this.prismaClient.card.update({
      where: { id },
      data: update,
    });
    return new Card(updatedCard);
  };

  public deleteCardWithStripeCardId = async (stripeCardId: string): Promise<void> => {
    try {
      await this.prismaClient.card.update({
        data: { deleted_at: new Date() },
        where: { stripe_card_id: stripeCardId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code !== 'P2025') {
          throw handlePrismaError(error);
        }
      }
    }
  };

  public upsert = async (toInsert: CardEntity[], toDelete: string[]): Promise<void> => {
    const queries: PrismaPromise<Card>[] = [];
    toInsert.forEach((card) =>
      queries.push(
        this.prismaClient.card.create({
          data: card,
        }),
      ),
    );
    toDelete.forEach((cardId) =>
      queries.push(
        this.prismaClient.card.update({
          data: { deleted_at: new Date() },
          where: { id: cardId },
        }),
      ),
    );

    try {
      await this.prismaClient.$transaction(queries);
    } catch (error) {
      throw handlePrismaError(error);
    }
  };

  public setUserDefaultCard = async (newDefault: CardEntity): Promise<void> => {
    const queries: PrismaPromise<Prisma.BatchPayload | Card>[] = [];
    queries.push(
      this.prismaClient.card.updateMany({
        where: {
          stripe_customer_id: newDefault.stripe_customer_id,
          is_default: true,
          NOT: {
            id: newDefault.id,
          },
        },
        data: {
          is_default: false,
        },
      }),
    );

    queries.push(
      this.prismaClient.card.update({
        where: {
          id: newDefault.id,
        },
        data: {
          is_default: true,
        },
      }),
    );

    try {
      await this.prismaClient.$transaction(queries);
    } catch (error) {
      throw handlePrismaError(error);
    }
  };
}
