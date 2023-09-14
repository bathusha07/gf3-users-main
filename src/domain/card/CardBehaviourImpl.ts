import { v4 as uuidv4 } from 'uuid';
import SubresourceNotFound from '../errors/SubresourceNotFound';
import { EVENT_TYPE_CARD_CREATED, EVENT_VERSION_CARD_CREATED } from './constants';
import {
  CardBehaviour,
  CardRepository,
  PubsubProducer,
  StripeCustomerBehaviour,
  StripeCustomerRepository,
  StripeCreateCustomerSourceResponse,
  StripeDeleteCustomerSourceInput,
  StripeService,
  TranslationLayerService,
  UserRepository,
} from '../types';
import {
  CardEntity,
  StripeCustomerEntity,
  UserId,
  UserEntity,
  CreateCardFromIntentInput,
  CreateCardFromTokenInput,
  CreateAlreadyCreatedCardWithStripeCardIdInput,
  UpdateCardInput,
  CardId,
  CreateCardFromCreatedCardTokenInput,
} from '@makegoodfood/gf3-types';
import StripeCustomer from '../stripeCustomer/StripeCustomer';
import DomainEvent from '../event/DomainEvent';
import pubsubConfigs from '../../config/pubsub';
import Card from './Card';
import ResourceNotFound from '../errors/ResourceNotFound';
import BaseDomainError from '../errors/BaseDomainError';

import StripeValidationError from '../../domain/errors/StripeValidationError';

const verificationOptionMap = new Map<string, string>();
verificationOptionMap.set('cvc_check', 'incorrect_cvc');
// verificationOptionMap.set('address_zip_check', 'incorrect_postal_code');
// verificationOptionMap.set('address_line1_check', 'incorrect_address_line1');

//There are pass, fail, unchecked, unavailable, and not_provided options, we allow verification to go through with pass, unchecked, and unavailable only.
export const VERIFICATION_ALLOW_PASS_CODES = ['pass', 'unavailable', 'unchecked'];

export default class CardBehaviourImpl implements CardBehaviour {
  protected pubsubProducer: PubsubProducer;
  protected cardRepository: CardRepository;
  protected stripeCustomerRepository: StripeCustomerRepository;
  protected stripeCustomerBehaviour: StripeCustomerBehaviour;
  protected userRepository: UserRepository;
  protected stripeService: StripeService;
  protected translationLayerService: TranslationLayerService;

  public constructor({
    pubsubProducer,
    cardRepository,
    stripeCustomerRepository,
    stripeCustomerBehaviour,
    userRepository,
    stripeService,
    translationLayerService,
  }: {
    pubsubProducer: PubsubProducer;
    cardRepository: CardRepository;
    stripeCustomerRepository: StripeCustomerRepository;
    stripeCustomerBehaviour: StripeCustomerBehaviour;
    userRepository: UserRepository;
    stripeService: StripeService;
    translationLayerService: TranslationLayerService;
  }) {
    this.pubsubProducer = pubsubProducer;
    this.cardRepository = cardRepository;
    this.stripeCustomerRepository = stripeCustomerRepository;
    this.stripeCustomerBehaviour = stripeCustomerBehaviour;
    this.userRepository = userRepository;
    this.stripeService = stripeService;
    this.translationLayerService = translationLayerService;
  }

  public createCardFromToken = async (inputCard: CreateCardFromTokenInput): Promise<CardEntity> => {
    // idempotency check
    let stripeCustomer = await this.stripeCustomerRepository.getStripeCustomerByUserId(
      inputCard.user_id,
    );
    const idempotentCard = await this.cardRepository.getCardByStripeCardToken(
      inputCard.stripe_card_token,
    );
    if (idempotentCard) {
      if (stripeCustomer && stripeCustomer.user_id === inputCard.user_id) {
        return idempotentCard;
      }
      // this should never happen
      throw new BaseDomainError('Card token was used by a different user.');
    }

    if (!stripeCustomer) {
      stripeCustomer = await this.stripeCustomerBehaviour.createStripeCustomer(inputCard.user_id);
    }

    const stripeCard = await this.stripeService.createCustomerSource({
      stripe_customer_id: stripeCustomer.stripe_customer_id,
      stripe_card_token: inputCard.stripe_card_token,
    });

    this.customerSourceValidation(stripeCard, {
      stripe_customer_id: stripeCustomer.stripe_customer_id,
      stripe_card_id: stripeCard.id,
    });

    await this.translationLayerService.updateUserPaymentDetails(
      inputCard.user_id,
      stripeCustomer.stripe_customer_id,
      stripeCard.stripe_card_fingerprint,
    );

    const newCard = await this.cardRepository.createCard({
      id: uuidv4(),
      stripe_customer_id: stripeCustomer.stripe_customer_id,
      stripe_card_id: stripeCard.id,
      stripe_card_token: inputCard.stripe_card_token,
      stripe_card_fingerprint: stripeCard.stripe_card_fingerprint,
      is_default: true,
    });

    await this.cardRepository.setUserDefaultCard(newCard);

    await this.emitFirstCardCreatedEvent(stripeCustomer.user_id);

    console.log('[CreditCardAction] Credit Card added', {
      user_id: stripeCustomer.user_id,
    });

    return newCard;
  };

  public createCardFromIntent = async (
    inputCard: CreateCardFromIntentInput,
  ): Promise<CardEntity> => {
    const card = await this.cardRepository.getCardByStripePaymentMethodId(
      inputCard.stripe_payment_method_id,
    );
    if (card) {
      return card;
    }

    const stripeCustomer = await this.getStripeCustomerByStripeId(inputCard.stripe_customer_id);
    const newCard = await this.cardRepository.createCard({
      id: uuidv4(),
      stripe_customer_id: stripeCustomer.stripe_customer_id,
      stripe_payment_method_id: inputCard.stripe_payment_method_id,
      is_default: true,
    });

    await this.cardRepository.setUserDefaultCard(newCard);

    await this.emitFirstCardCreatedEvent(stripeCustomer.user_id);

    console.log('[CreditCardAction] Credit Card added', {
      user_id: stripeCustomer.user_id,
    });

    return newCard;
  };

  public createCardFromCreatedCardToken = async (
    inputCreatedCard: CreateCardFromCreatedCardTokenInput,
  ): Promise<CardEntity> => {
    const idempotentCard = await this.cardRepository.getCardByStripeCardToken(
      inputCreatedCard.stripe_card_token,
    );
    if (idempotentCard) {
      if (inputCreatedCard.stripe_customer_id === idempotentCard.stripe_customer_id) {
        return idempotentCard;
      }
      // this should never happen
      throw new BaseDomainError('Card token was used by a different user.');
    }

    let stripeCustomer = await this.stripeCustomerRepository.getStripeCustomerByUserId(
      inputCreatedCard.user_id,
    );
    if (!stripeCustomer) {
      stripeCustomer = await this.stripeCustomerRepository.createStripeCustomer({
        user_id: inputCreatedCard.user_id,
        stripe_customer_id: inputCreatedCard.stripe_customer_id,
      });
    }

    const newCard = await this.cardRepository.createCard({
      id: uuidv4(),
      stripe_customer_id: inputCreatedCard.stripe_customer_id,
      stripe_card_id: inputCreatedCard.stripe_card_id,
      stripe_card_token: inputCreatedCard.stripe_card_token,
      is_default: true,
    });

    await this.cardRepository.setUserDefaultCard(newCard);

    await this.emitFirstCardCreatedEvent(stripeCustomer.user_id);

    console.log('[CreditCardAction] Credit Card added', {
      user_id: stripeCustomer.user_id,
    });

    return newCard;
  };

  private getStripeCustomerByStripeId = async (stripeId: string): Promise<StripeCustomerEntity> => {
    const stripeCustomer = await this.stripeCustomerRepository.getStripeCustomerByStripeId(
      stripeId,
    );
    if (!stripeCustomer) {
      throw new SubresourceNotFound(StripeCustomer.name, stripeId);
    }

    return stripeCustomer;
  };

  private emitFirstCardCreatedEvent = async (userId: UserId): Promise<void> => {
    const userCardHistory = await this.cardRepository.getUserCardHistory(userId);
    if (userCardHistory.length == 1) {
      const user = await this.userRepository.getUser(userId);
      void this.pubsubProducer.publish(
        new DomainEvent<UserEntity>({
          payload: user,
          topic: pubsubConfigs.topics.onboarding,
          type: EVENT_TYPE_CARD_CREATED,
          version: EVENT_VERSION_CARD_CREATED,
        }),
      );
    }
  };

  public getCard = async (id: CardId): Promise<CardEntity> => {
    const card = await this.cardRepository.getCard(id);
    if (!card) {
      throw new ResourceNotFound(Card.name, id);
    }
    return card;
  };

  public getUserCards = async (userId: UserId): Promise<CardEntity[]> => {
    return await this.cardRepository.getUserCards(userId);
  };

  public syncUserCards = async (userId: UserId): Promise<CardEntity[]> => {
    const cards = await this.cardRepository.getUserCards(userId);
    const stripeCustomer = await this.stripeCustomerRepository.getStripeCustomerByUserId(userId);
    if (!stripeCustomer) {
      throw new SubresourceNotFound(StripeCustomer.name, userId);
    }
    const stripeCustomerId = stripeCustomer.stripe_customer_id;
    const stripeSources = await this.stripeService.getCustomerSources(stripeCustomerId);
    const defaultSourceId = await this.stripeService.getDefaultCustomerSourceId(stripeCustomerId);

    const toDelete = cards
      .filter((card) => !stripeSources.find((source) => source.id === card.stripe_card_id))
      .map((card) => card.id);

    const toInsert = stripeSources
      .filter((source) => !cards.find((card) => source.id === card.stripe_card_id))
      .map(
        (source) =>
          new Card({
            id: uuidv4(),
            stripe_customer_id: stripeCustomerId,
            stripe_card_id: source.id,
            stripe_card_fingerprint: source.fingerprint,
            is_default: false,
          }),
      );

    if (toInsert.length > 0 || toDelete.length > 0) {
      await this.cardRepository.upsert(toInsert, toDelete);
    }

    const defaultCard = [...cards, ...toInsert].find(
      (card) => card.stripe_card_id === defaultSourceId,
    );
    if (defaultCard) {
      await this.cardRepository.setUserDefaultCard(defaultCard);
    }

    return await this.cardRepository.getUserCards(userId);
  };

  public updateCard = async (inputCard: UpdateCardInput): Promise<CardEntity> => {
    // idempotency check
    const idempotentCard = await this.cardRepository.getCardByStripeCardToken(
      inputCard.stripe_card_token,
    );
    if (idempotentCard) {
      if (idempotentCard.id === inputCard.card_id) {
        return idempotentCard;
      }
      // this should never happen
      throw new BaseDomainError('Card token was used for a different card.');
    }

    // retrieve required objects from repo
    const card = await this.cardRepository.getCard(inputCard.card_id);
    if (!card) {
      throw new ResourceNotFound(Card.name, inputCard.card_id);
    }
    const stripeCustomer = await this.stripeCustomerRepository.getStripeCustomerByStripeId(
      card.stripe_customer_id,
    );
    if (!stripeCustomer) {
      throw new SubresourceNotFound(StripeCustomer.name, card.stripe_customer_id);
    }

    const stripeCard = await this.stripeService.createCustomerSource({
      stripe_customer_id: stripeCustomer.stripe_customer_id,
      stripe_card_token: inputCard.stripe_card_token,
    });

    this.customerSourceValidation(stripeCard, {
      stripe_customer_id: stripeCustomer.stripe_customer_id,
      stripe_card_id: stripeCard.id,
    });

    if (card.stripe_card_id) {
      void this.stripeService.deleteCustomerSource({
        stripe_customer_id: stripeCustomer.stripe_customer_id,
        stripe_card_id: card.stripe_card_id,
      });
    }

    await this.translationLayerService.updateUserPaymentDetails(
      stripeCustomer.user_id,
      stripeCustomer.stripe_customer_id,
      stripeCard.stripe_card_fingerprint,
    );

    const updatedCard = this.cardRepository.updateCard(inputCard.card_id, {
      ...card,
      stripe_card_id: stripeCard.id,
      stripe_card_token: inputCard.stripe_card_token,
      stripe_card_fingerprint: stripeCard.stripe_card_fingerprint,
    });

    console.log('[CreditCardAction] Credit Card updated', {
      user_id: stripeCustomer.user_id,
    });

    return updatedCard;
  };

  public deleteAlreadyDeletedCardWithStripeCardId = async (stripeCardId: string): Promise<void> => {
    return this.cardRepository.deleteCardWithStripeCardId(stripeCardId);
  };

  public createAlreadyCreatedCardWithStripeCardId = async (
    inputCard: CreateAlreadyCreatedCardWithStripeCardIdInput,
  ): Promise<CardEntity> => {
    const existingCard = await this.cardRepository.getCardByStripeCardId(inputCard.stripe_card_id);
    if (existingCard) {
      return existingCard;
    }

    const stripeCustomer = await this.stripeCustomerRepository.getStripeCustomerByStripeId(
      inputCard.stripe_customer_id,
    );
    if (!stripeCustomer) {
      throw new SubresourceNotFound(StripeCustomer.name, inputCard.stripe_customer_id);
    }

    const newCard = await this.cardRepository.createCard({
      id: uuidv4(),
      stripe_customer_id: inputCard.stripe_customer_id,
      stripe_card_id: inputCard.stripe_card_id,
      is_default: true,
    });

    await this.cardRepository.setUserDefaultCard(newCard);

    return newCard;
  };

  private customerSourceValidation = (
    stripeCard: StripeCreateCustomerSourceResponse,
    sourceInput: StripeDeleteCustomerSourceInput,
  ): void => {
    for (const [key, value] of Object.entries(stripeCard)) {
      const verificationErrorCode = verificationOptionMap.get(key);

      if (!verificationErrorCode || VERIFICATION_ALLOW_PASS_CODES.includes(value)) {
        //Add logs for CVC success response check
        if (verificationErrorCode && key === 'cvc_check') {
          console.log(`[CustomerSourceAction] Create Customer Source Verification Success Response Log | 
              stripe_customer_id: ${sourceInput.stripe_customer_id} |
              stripe_card_id: ${sourceInput.stripe_card_id} | 
              verification_type: ${key} | 
              response: ${value as string}`);
        }
        continue;
      }
      const errorMessage = `${key}_fail`;
      void this.stripeService.deleteCustomerSource({
        stripe_customer_id: sourceInput.stripe_customer_id,
        stripe_card_id: sourceInput.stripe_card_id,
      });

      console.log(`[CustomerSourceAction] Create Customer Source Verification Failed | 
        stripe_customer_id: ${sourceInput.stripe_customer_id} | 
        stripe_card_id: ${sourceInput.stripe_card_id} |
        error_code: ${verificationErrorCode} |
        error_message: ${errorMessage}`);

      throw new StripeValidationError({
        code: verificationErrorCode,
        decline_code: '',
        message: errorMessage,
      });
    }
  };
}
