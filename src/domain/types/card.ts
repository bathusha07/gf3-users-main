import {
  CardEntity,
  CardId,
  UserId,
  CreateCardFromIntentInput,
  CreateCardFromTokenInput,
  CreateCardFromCreatedCardTokenInput,
  CreateAlreadyCreatedCardWithStripeCardIdInput,
  UpdateCardInput,
} from '@makegoodfood/gf3-types';

export interface CardBehaviour {
  getCard: (id: CardId) => Promise<CardEntity>;
  updateCard: (inputCard: UpdateCardInput) => Promise<CardEntity>;
  createCardFromIntent: (inputCard: CreateCardFromIntentInput) => Promise<CardEntity>;
  createCardFromToken: (inputCard: CreateCardFromTokenInput) => Promise<CardEntity>;
  createCardFromCreatedCardToken: (
    inputCreatedCard: CreateCardFromCreatedCardTokenInput,
  ) => Promise<CardEntity>;
  getUserCards: (userId: UserId) => Promise<CardEntity[]>;
  syncUserCards: (userId: UserId) => Promise<CardEntity[]>;
  deleteAlreadyDeletedCardWithStripeCardId: (stripeCardId: string) => Promise<void>;
  createAlreadyCreatedCardWithStripeCardId: (
    inputCard: CreateAlreadyCreatedCardWithStripeCardIdInput,
  ) => Promise<CardEntity>;
}

export interface CardRepository {
  createCard: (cardToCreate: CardEntity) => Promise<CardEntity>;
  getCard: (id: CardId) => Promise<CardEntity | null>;
  getCardForUser: (id: CardId, userId: UserId) => Promise<CardEntity | null>;
  getCardByStripePaymentMethodId: (stripePaymentMethodId: string) => Promise<CardEntity | null>;
  getCardByStripeCardId: (stripeCardId: string) => Promise<CardEntity | null>;
  getCardByStripeCardToken: (stripeCardToken: string) => Promise<CardEntity | null>;
  getUserCards: (userId: UserId) => Promise<CardEntity[]>;
  getUserCardHistory: (userId: UserId) => Promise<CardEntity[]>;
  updateCard: (id: CardId, update: Omit<CardEntity, 'id'>) => Promise<CardEntity>;
  deleteCardWithStripeCardId: (stripeCardId: string) => Promise<void>;
  upsert: (toInsert: CardEntity[], toDelete: string[]) => Promise<void>;
  setUserDefaultCard: (newDefault: CardEntity) => Promise<void>;
}
