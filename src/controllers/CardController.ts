import asyncHandler from '../middleware/async';
import {
  cardIdValidation,
  cardCreateMethodValidation,
  createCardFromTokenValidation,
  createCardFromIntentValidation,
  createCardFromCreatedCardTokenValidation,
  createAlreadyCreatedCardWithStripeCardIdValidation,
  updateCardValidation,
  stripeCardIdValidation,
} from '../utils/validation';
import ValidationError from './errors/ValidationError';
import { CardBehaviour } from '../domain/types';
import {
  CARD_CREATE_METHOD_TOKEN,
  CARD_CREATE_METHOD_INTENT,
  CARD_CREATE_METHOD_CREATED_CARD_TOKEN,
  CardId,
} from '@makegoodfood/gf3-types';

export default class CardController {
  protected cardBehaviour: CardBehaviour;

  public constructor({ cardBehaviour }: { cardBehaviour: CardBehaviour }) {
    this.cardBehaviour = cardBehaviour;
  }

  public createCard = asyncHandler(async (req, res) => {
    let createMethod;
    try {
      createMethod = await cardCreateMethodValidation.validate(req.body.create_method);
    } catch (err) {
      throw new ValidationError(err);
    }
    switch (createMethod) {
      case CARD_CREATE_METHOD_TOKEN:
        await this.createCardFromToken(req, res);
        break;
      case CARD_CREATE_METHOD_CREATED_CARD_TOKEN:
        await this.createCardFromCreatedCardToken(req, res);
        break;
      case CARD_CREATE_METHOD_INTENT:
        await this.createCardFromIntent(req, res);
        break;
    }
  });

  private createCardFromToken = asyncHandler(async (req, res) => {
    let validatedCard;
    const inputCard = {
      user_id: req.body.user_id,
      stripe_card_token: req.body.stripe_card_token,
    };
    try {
      validatedCard = await createCardFromTokenValidation.validate(inputCard);
    } catch (err) {
      throw new ValidationError(err);
    }
    const card = await this.cardBehaviour.createCardFromToken(validatedCard);
    res.status(201).json(card);
  });

  private createCardFromIntent = asyncHandler(async (req, res) => {
    let validatedCard;
    const inputCard = {
      stripe_customer_id: req.body.stripe_customer_id,
      stripe_payment_method_id: req.body.stripe_payment_method_id,
    };
    try {
      validatedCard = await createCardFromIntentValidation.validate(inputCard);
    } catch (err) {
      throw new ValidationError(err);
    }
    const card = await this.cardBehaviour.createCardFromIntent(validatedCard);
    res.status(201).json(card);
  });

  private createCardFromCreatedCardToken = asyncHandler(async (req, res) => {
    let validatedCard;
    const inputCreatedCard = {
      user_id: req.body.user_id,
      stripe_card_token: req.body.stripe_card_token,
      stripe_customer_id: req.body.stripe_customer_id,
      stripe_card_id: req.body.stripe_card_id,
    };
    try {
      validatedCard = await createCardFromCreatedCardTokenValidation.validate(inputCreatedCard);
    } catch (err) {
      throw new ValidationError(err);
    }
    const card = await this.cardBehaviour.createCardFromCreatedCardToken(validatedCard);
    res.status(201).json(card);
  });

  public getCard = asyncHandler(async (req, res) => {
    let cardId: CardId;
    try {
      cardId = await cardIdValidation.validate(req.params.card_id);
    } catch (error) {
      throw new ValidationError(error);
    }
    const cards = await this.cardBehaviour.getCard(cardId);
    res.status(200).json(cards);
  });

  public getUserCards = asyncHandler(async (req, res) => {
    const cards = await this.cardBehaviour.getUserCards(req.params.id);
    res.status(200).json(cards);
  });

  public syncUserCards = asyncHandler(async (req, res) => {
    const cards = await this.cardBehaviour.syncUserCards(req.params.id);
    res.status(200).json(cards);
  });

  public updateCard = asyncHandler(async (req, res) => {
    let validatedCard;
    const inputCard = {
      card_id: req.params.card_id,
      stripe_card_token: req.body.stripe_card_token,
    };
    try {
      validatedCard = await updateCardValidation.validate(inputCard);
    } catch (error) {
      throw new ValidationError(error);
    }
    const cards = await this.cardBehaviour.updateCard(validatedCard);
    res.status(200).json(cards);
  });

  public deleteAlreadyDeletedCardWithStripeCardId = asyncHandler(async (req, res) => {
    let validatedCard;
    try {
      validatedCard = await stripeCardIdValidation.validate(req.params.stripe_card_id);
    } catch (error) {
      throw new ValidationError(error);
    }
    await this.cardBehaviour.deleteAlreadyDeletedCardWithStripeCardId(validatedCard);
    res.sendStatus(204);
  });

  public createAlreadyCreatedCardWithStripeCardId = asyncHandler(async (req, res) => {
    let validatedCard;
    const inputCreatedCard = {
      stripe_customer_id: req.body.stripe_customer_id,
      stripe_card_id: req.body.stripe_card_id,
    };
    try {
      validatedCard = await createAlreadyCreatedCardWithStripeCardIdValidation.validate(
        inputCreatedCard,
      );
    } catch (error) {
      throw new ValidationError(error);
    }
    await this.cardBehaviour.createAlreadyCreatedCardWithStripeCardId(validatedCard);
    res.sendStatus(201);
  });
}
