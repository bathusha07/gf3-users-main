import { mock, mockClear } from 'jest-mock-extended';
import faker from 'faker';
import CardBehaviourImpl from '../../../../src/domain/card/CardBehaviourImpl';
import {
  PubsubProducer,
  CardRepository,
  StripeCustomerBehaviour,
  StripeCustomerRepository,
  UserRepository,
  StripeService,
  TranslationLayerService,
} from '../../../../src/domain/types';
import generateStripeCustomer from '../../../factories/stripeCustomer';
import generateCard, { generateStripeCardId } from '../../../factories/card';
import SubresourceNotFound from '../../../../src/domain/errors/SubresourceNotFound';
import ResourceNotFound from '../../../../src/domain/errors/ResourceNotFound';
import StripeError from '../../../../src/domain/errors/StripeError';
import Stripe from 'stripe';
import StripeValidationError from '../../../../src/domain/errors/StripeValidationError';

describe('CardBehaviourImpl', () => {
  const dummyStripeCardId = 'card_' + faker.random.alphaNumeric(24);
  const dummyCardFingerprint = faker.random.alphaNumeric(16);
  const dummyCard = generateCard();
  const dummyStripeErrorResponse = {
    code: 'card_declined',
    decline_code: 'lost_card',
    statusCode: 422,
    message: 'Lost card decline',
  } as Stripe.StripeError;

  const mocks = {
    pubsubProducer: mock<PubsubProducer>(),
    cardRepository: mock<CardRepository>({
      createCard: jest.fn((cardToCreate) => Promise.resolve(cardToCreate)),
      getUserCardHistory: jest.fn(() => Promise.resolve([])),
      getCardByStripeCardToken: jest.fn(() => Promise.resolve(null)),
      getUserCards: jest.fn(() => Promise.resolve([dummyCard])),
      setUserDefaultCard: jest.fn(() => Promise.resolve()),
    }),
    stripeCustomerRepository: mock<StripeCustomerRepository>(),
    stripeCustomerBehaviour: mock<StripeCustomerBehaviour>({
      createStripeCustomer: jest.fn(() => Promise.resolve(generateStripeCustomer())),
    }),
    userRepository: mock<UserRepository>(),
    stripeService: mock<StripeService>({
      createCustomerSource: jest.fn(() =>
        Promise.resolve({ id: dummyStripeCardId, stripe_card_fingerprint: dummyCardFingerprint }),
      ),
    }),
    translationLayerService: mock<TranslationLayerService>({
      updateUserPaymentDetails: jest.fn(() => Promise.resolve()),
    }),
  };

  afterEach(() => {
    Object.values(mocks).forEach(mockClear);
  });
  
  describe('createCardFromToken', () => {
    const dummyCreateCardInput = {
      user_id: faker.datatype.uuid(),
      stripe_card_token: 'tok_' + faker.random.alphaNumeric(24),
    };

    const dummyCustomerSourceResponse = {
      id: dummyStripeCardId,
      stripe_card_fingerprint: dummyCardFingerprint
    }
    test('when stripe service create source with cvc_check fail, StripeValidationError should be thrown', async () => {
      mocks.stripeService.createCustomerSource.mockImplementationOnce(() =>
        Promise.resolve({...dummyCustomerSourceResponse, cvc_check: "fail"}),
      );
      const cardBehaviour = new CardBehaviourImpl(mocks);
      const attemptToCreate = async () => {
        await cardBehaviour.createCardFromToken(dummyCreateCardInput);
      };
      
      await expect(attemptToCreate).rejects.toThrow(StripeValidationError);
    });

    test('when stripe service fails to create customer source, StripeError should be thrown', async () => {
      mocks.stripeService.createCustomerSource.mockImplementationOnce(() =>
        Promise.reject(new StripeError(dummyStripeErrorResponse)),
      );
      const cardBehaviour = new CardBehaviourImpl(mocks);
      const attemptToCreate = async () => {
        await cardBehaviour.createCardFromToken(dummyCreateCardInput);
      };
      await expect(attemptToCreate).rejects.toThrow(StripeError);
    });

    test('when stripe service fails to create customer, StripeError should be thrown', async () => {
      mocks.stripeCustomerBehaviour.createStripeCustomer.mockImplementationOnce(() =>
        Promise.reject(new StripeError(dummyStripeErrorResponse)),
      );
      const cardBehaviour = new CardBehaviourImpl(mocks);
      const attemptToCreate = async () => {
        await cardBehaviour.createCardFromToken(dummyCreateCardInput);
      };
      await expect(attemptToCreate).rejects.toThrow(StripeError);
    });
    
    test('creates a card', async () => {
      mocks.stripeCustomerRepository = mock<StripeCustomerRepository>({
        getStripeCustomerByUserId: jest.fn(() => Promise.resolve(null)),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);
      const card = await cardBehaviour.createCardFromToken(dummyCreateCardInput);

      expect(mocks.translationLayerService.updateUserPaymentDetails).toBeCalledTimes(1);
      expect(mocks.cardRepository.setUserDefaultCard).toBeCalledTimes(1);
      expect(card.stripe_card_token).toStrictEqual(dummyCreateCardInput.stripe_card_token);
      expect(card.stripe_card_id).toStrictEqual(dummyStripeCardId);
    });

    test.each(['pass','unavailable','unchecked'])('when stripe service create source with cvc_check result %s, no error should be thrown', async (option) => {
      mocks.stripeService.createCustomerSource.mockImplementationOnce(() =>
      Promise.resolve({...dummyCustomerSourceResponse, cvc_check: option}),
      );
      const cardBehaviour = new CardBehaviourImpl(mocks);
      const card = await cardBehaviour.createCardFromToken(dummyCreateCardInput);
      expect(mocks.translationLayerService.updateUserPaymentDetails).toBeCalledTimes(1);
      expect(mocks.cardRepository.setUserDefaultCard).toBeCalledTimes(1);
      expect(card.stripe_card_token).toStrictEqual(dummyCreateCardInput.stripe_card_token);
      expect(card.stripe_card_id).toStrictEqual(dummyStripeCardId);
    });

    test('when there is no stripe customer record for the user, one is created', async () => {
      mocks.stripeCustomerRepository = mock<StripeCustomerRepository>({
        getStripeCustomerByUserId: jest.fn(() => Promise.resolve(null)),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);
      void (await cardBehaviour.createCardFromToken(dummyCreateCardInput));
      expect(mocks.stripeCustomerBehaviour.createStripeCustomer).toBeCalledTimes(1);
    });

    test('when there is a stripe customer record for the user, it is used', async () => {
      mocks.stripeCustomerRepository = mock<StripeCustomerRepository>({
        getStripeCustomerByUserId: jest.fn(() => Promise.resolve(generateStripeCustomer())),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);
      void (await cardBehaviour.createCardFromToken(dummyCreateCardInput));
      expect(mocks.stripeCustomerBehaviour.createStripeCustomer).toBeCalledTimes(0);
    });
    
    test('when called with the same stripe card token as before, existing card entity is returned', async () => {
      const dummyStripeCustomer = generateStripeCustomer({ user_id: dummyCreateCardInput.user_id });
      mocks.stripeCustomerRepository = mock<StripeCustomerRepository>({
        getStripeCustomerByUserId: jest.fn(() => Promise.resolve(dummyStripeCustomer)),
      });
      mocks.cardRepository = mock<CardRepository>({
        getCardByStripeCardToken: jest.fn(() => Promise.resolve(generateCard())),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);
      void (await cardBehaviour.createCardFromToken(dummyCreateCardInput));
      expect(mocks.stripeService.createCustomerSource).toBeCalledTimes(0);
    });
  });

  describe('createCardFromCreatedCardToken', () => {
    const dummyUserId = faker.datatype.uuid();
    const dummyStripeCardId = 'card_' + faker.random.alphaNumeric(24);
    const dummyStripeCustomerId = 'cus_' + faker.random.alphaNumeric(14);
    const dummyCreateCardWithCreatedCardTokenInput = {
      user_id: dummyUserId,
      stripe_customer_id: dummyStripeCustomerId,
      stripe_card_id: dummyStripeCardId,
      stripe_card_token: 'tok_' + faker.random.alphaNumeric(24),
    };
    const stripeCustomer = generateStripeCustomer({
      user_id: dummyUserId,
      stripe_customer_id: dummyStripeCustomerId,
    });

    test('creates a card from created card token', async () => {
      mocks.stripeCustomerRepository = mock<StripeCustomerRepository>({
        getStripeCustomerByUserId: jest.fn(() => Promise.resolve(stripeCustomer)),
      });
      mocks.cardRepository = mock<CardRepository>({
        getCardByStripeCardToken: jest.fn(() => Promise.resolve(null)),
        createCard: jest.fn(() =>
          Promise.resolve(generateCard(dummyCreateCardWithCreatedCardTokenInput)),
        ),
        getUserCardHistory: jest.fn(() => Promise.resolve([])),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);
      const card = await cardBehaviour.createCardFromCreatedCardToken(
        dummyCreateCardWithCreatedCardTokenInput,
      );

      expect(mocks.cardRepository.setUserDefaultCard).toBeCalledTimes(1);
      expect(card.stripe_card_token).toStrictEqual(
        dummyCreateCardWithCreatedCardTokenInput.stripe_card_token,
      );
      expect(card.stripe_card_id).toStrictEqual(dummyStripeCardId);
    });
  });

  describe('createCardFromIntent', () => {
    const dummyCreateCardInput = {
      stripe_customer_id: 'cus_' + faker.random.alphaNumeric(14),
      stripe_payment_method_id: 'pm_' + faker.random.alphaNumeric(24),
    };

    test('when a record already exists with the same payment method, it is returned and a new one is not created', async () => {
      mocks.cardRepository = mock<CardRepository>({
        getCardByStripePaymentMethodId: jest.fn(() => Promise.resolve(generateCard())),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);
      void (await cardBehaviour.createCardFromIntent(dummyCreateCardInput));
      expect(mocks.cardRepository.createCard).toBeCalledTimes(0);
    });

    test('if there is no existing stripe customer record, an exception is thrown', async () => {
      mocks.stripeCustomerRepository = mock<StripeCustomerRepository>({
        getStripeCustomerByStripeId: jest.fn(() => Promise.resolve(null)),
      });
      mocks.cardRepository = mock<CardRepository>({
        getCardByStripePaymentMethodId: jest.fn(() => Promise.resolve(null)),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);
      const attemptToCreate = async () => {
        await cardBehaviour.createCardFromIntent(dummyCreateCardInput);
      };
      await expect(attemptToCreate).rejects.toThrow(SubresourceNotFound);
    });

    test('a card based on intent can be created referencing the stripe customer record and the stripe pm id', async () => {
      const dummyStripeCustomer = generateStripeCustomer();
      mocks.stripeCustomerRepository = mock<StripeCustomerRepository>({
        getStripeCustomerByStripeId: jest.fn(() => Promise.resolve(dummyStripeCustomer)),
      });
      mocks.cardRepository = mock<CardRepository>({
        createCard: jest.fn((cardToCreate) => Promise.resolve(cardToCreate)),
        getCardByStripePaymentMethodId: jest.fn(() => Promise.resolve(null)),
        getUserCardHistory: jest.fn(() => Promise.resolve([])),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);
      const createdCard = await cardBehaviour.createCardFromIntent(dummyCreateCardInput);
      expect(mocks.cardRepository.setUserDefaultCard).toBeCalledTimes(1);
      expect(createdCard.stripe_customer_id).toStrictEqual(dummyStripeCustomer.stripe_customer_id);
      expect(createdCard.stripe_payment_method_id).toStrictEqual(
        dummyCreateCardInput.stripe_payment_method_id,
      );
    });

    test('if this is the first card created, an event should be emitted', async () => {
      mocks.stripeCustomerRepository = mock<StripeCustomerRepository>({
        getStripeCustomerByStripeId: jest.fn(() => Promise.resolve(generateStripeCustomer())),
      });
      mocks.cardRepository = mock<CardRepository>({
        createCard: jest.fn((cardToCreate) => Promise.resolve(cardToCreate)),
        getCardByStripePaymentMethodId: jest.fn(() => Promise.resolve(null)),
        getUserCardHistory: jest.fn(() => Promise.resolve([generateCard()])),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);
      void (await cardBehaviour.createCardFromIntent(dummyCreateCardInput));
      expect(mocks.pubsubProducer.publish).toBeCalledTimes(1);
    });

    test('if this is not the first card created, no event should not be emitted', async () => {
      mocks.stripeCustomerRepository = mock<StripeCustomerRepository>({
        getStripeCustomerByStripeId: jest.fn(() => Promise.resolve(generateStripeCustomer())),
      });
      mocks.cardRepository = mock<CardRepository>({
        createCard: jest.fn((cardToCreate) => Promise.resolve(cardToCreate)),
        getCardByStripePaymentMethodId: jest.fn(() => Promise.resolve(null)),
        getUserCardHistory: jest.fn(() => Promise.resolve([generateCard(), generateCard()])),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);
      void (await cardBehaviour.createCardFromIntent(dummyCreateCardInput));
      expect(mocks.pubsubProducer.publish).toBeCalledTimes(0);
    });
  });

  describe('getCard', () => {
    const dummyCard = generateCard();
    test('can get card when one exists', async () => {
      mocks.cardRepository = mock<CardRepository>({
        getCard: jest.fn(() => Promise.resolve(dummyCard)),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);
      const card = await cardBehaviour.getCard(dummyCard.id);
      expect(card.id).toStrictEqual(dummyCard.id);
      expect(mocks.cardRepository.getCard).toBeCalledTimes(1);
    });

    test('when the card does not exist, an exeption should be thrown', async () => {
      mocks.cardRepository = mock<CardRepository>({
        getCard: jest.fn(() => Promise.resolve(null)),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);
      const attemptToGet = async () => {
        await cardBehaviour.getCard('dummy-card-id');
      };
      await expect(attemptToGet).rejects.toThrow(ResourceNotFound);
    });
  });

  describe('updateCard', () => {
    const dummyUpdateCardInput = {
      card_id: faker.datatype.uuid(),
      stripe_card_token: 'tok_' + faker.random.alphaNumeric(24),
    };

    const dummyCustomerSourceResponse = {
      id: dummyStripeCardId,
      stripe_card_fingerprint: dummyCardFingerprint
    }
    
    test('when the card does not exist, an exeption should be thrown', async () => {
      mocks.cardRepository = mock<CardRepository>({
        getCard: jest.fn(() => Promise.resolve(null)),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);
      const attemptToGet = async () => {
        await cardBehaviour.updateCard(dummyUpdateCardInput);
      };
      await expect(attemptToGet).rejects.toThrow(ResourceNotFound);
    });

    test('when the stripe customer record does not exist, an exeption should be thrown', async () => {
      mocks.cardRepository = mock<CardRepository>({
        getCard: jest.fn(() => Promise.resolve(generateCard())),
      });
      mocks.stripeCustomerRepository = mock<StripeCustomerRepository>({
        getStripeCustomerByStripeId: jest.fn(() => Promise.resolve(null)),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);
      const attemptToGet = async () => {
        await cardBehaviour.updateCard(dummyUpdateCardInput);
      };
      await expect(attemptToGet).rejects.toThrow(SubresourceNotFound);
    });

    test('update should call stripe service to delete existing card and associate new token with customer', async () => {
      const dummyCard = generateCard();
      mocks.cardRepository = mock<CardRepository>({
        getCard: jest.fn(() => Promise.resolve(dummyCard)),
        updateCard: jest.fn((id, update) => Promise.resolve({ id, ...update })),
      });
      mocks.stripeCustomerRepository = mock<StripeCustomerRepository>({
        getStripeCustomerByStripeId: jest.fn(() => Promise.resolve(generateStripeCustomer())),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);
      const updatedCard = await cardBehaviour.updateCard(dummyUpdateCardInput);
      expect(mocks.stripeService.deleteCustomerSource).toBeCalledTimes(1);
      expect(mocks.stripeService.createCustomerSource).toBeCalledTimes(1);
      expect(mocks.translationLayerService.updateUserPaymentDetails).toBeCalledTimes(1);
      expect(updatedCard.stripe_card_token).toStrictEqual(dummyUpdateCardInput.stripe_card_token);
      expect(updatedCard.stripe_card_id).not.toStrictEqual(dummyCard.stripe_card_id);
    });

    test('when called with the same stripe card token as before, existing card entity is returned', async () => {
      const dummyCard = generateCard({ id: dummyUpdateCardInput.card_id });
      mocks.stripeCustomerRepository = mock<StripeCustomerRepository>({
        getStripeCustomerByUserId: jest.fn(() => Promise.resolve(generateStripeCustomer())),
      });
      mocks.cardRepository = mock<CardRepository>({
        getCardByStripeCardToken: jest.fn(() => Promise.resolve(dummyCard)),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);
      void (await cardBehaviour.updateCard(dummyUpdateCardInput));
      expect(mocks.cardRepository.getCard).toBeCalledTimes(0);
    });

    test('when there is an error registering a new card with stripe, the old card should not be removed', async () => {
      const mockRejectError = new Error();
      const dummyCard = generateCard();
      mocks.cardRepository = mock<CardRepository>({
        getCard: jest.fn(() => Promise.resolve(dummyCard)),
      });
      mocks.stripeCustomerRepository = mock<StripeCustomerRepository>({
        getStripeCustomerByStripeId: jest.fn(() => Promise.resolve(generateStripeCustomer())),
      });
      mocks.stripeService = mock<StripeService>({
        createCustomerSource: jest.fn(() => Promise.reject(mockRejectError)),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);
      const attemptToUpdate = async () => {
        await cardBehaviour.updateCard(dummyUpdateCardInput);
      };
      expect(mocks.stripeService.deleteCustomerSource).toBeCalledTimes(0);
      expect(mocks.cardRepository.updateCard).toBeCalledTimes(0);
      await expect(attemptToUpdate).rejects.toThrow(mockRejectError);
    });

    test('when stripe service create source with cvc_check fail, StripeValidationError should be thrown', async () => {
      mocks.stripeService.createCustomerSource.mockImplementationOnce(() =>
        Promise.resolve({...dummyCustomerSourceResponse, cvc_check: 'fail'}),
      );
      const cardBehaviour = new CardBehaviourImpl(mocks);
      const attemptToUpdate = async () => {
        await cardBehaviour.updateCard(dummyUpdateCardInput)
      };
        expect(attemptToUpdate).rejects.toThrow(StripeValidationError);
    });

    test.each(['pass','unavailable','unchecked'])('when stripe service create source with cvc_check result %s, no error should be thrown', async (option) => {
      const dummyCard = generateCard();
      mocks.cardRepository = mock<CardRepository>({
        getCard: jest.fn(() => Promise.resolve(dummyCard)),
        updateCard: jest.fn((id, update) => Promise.resolve({ id, ...update })),
      });
      mocks.stripeCustomerRepository = mock<StripeCustomerRepository>({
        getStripeCustomerByStripeId: jest.fn(() => Promise.resolve(generateStripeCustomer())),
      });
      mocks.stripeService.createCustomerSource.mockImplementationOnce(() =>
      Promise.resolve({...dummyCustomerSourceResponse, cvc_check: option}),
      );
      const cardBehaviour = new CardBehaviourImpl(mocks);
      const updatedCard = await cardBehaviour.updateCard(dummyUpdateCardInput);
      expect(mocks.stripeService.createCustomerSource).toBeCalledTimes(1);
      expect(mocks.stripeService.deleteCustomerSource).toBeCalledTimes(1);
      expect(mocks.translationLayerService.updateUserPaymentDetails).toBeCalledTimes(1);
      expect(updatedCard.stripe_card_token).toStrictEqual(dummyUpdateCardInput.stripe_card_token);
      expect(updatedCard.stripe_card_id).not.toStrictEqual(dummyCard.stripe_card_id);
    });
  });

  describe('delete a already deleted Stripe card with a Stripe card ID should not throw an exception', () => {
    const dummyDeleteStripeCardInput = faker.random.alphaNumeric(24);

    test('when the card does not exist, no exception should be thrown', async () => {
      mocks.cardRepository = mock<CardRepository>({
        deleteCardWithStripeCardId: jest.fn(() => Promise.resolve()),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);
      await expect(
        cardBehaviour.deleteAlreadyDeletedCardWithStripeCardId(dummyDeleteStripeCardInput),
      ).resolves.not.toThrow();
    });
  });

  describe('create a record for an already created Stripe card for a known stripe customer', () => {
    const dummyCreateCardInput = {
      stripe_customer_id: 'cus_' + faker.random.alphaNumeric(14),
      stripe_card_id: 'card_' + faker.random.alphaNumeric(24),
    };
    const dummyStripeCustomer = generateStripeCustomer({
      stripe_customer_id: dummyCreateCardInput.stripe_customer_id,
    });

    test('it should add the new card if the customer is known and the card is not', async () => {
      mocks.stripeCustomerRepository = mock<StripeCustomerRepository>({
        getStripeCustomerByStripeId: jest.fn(() => Promise.resolve(dummyStripeCustomer)),
      });
      mocks.cardRepository = mock<CardRepository>({
        getCardByStripeCardId: jest.fn(() => Promise.resolve(null)),
        createCard: jest.fn((cardToCreate) => Promise.resolve(cardToCreate)),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);

      const createdCard = await cardBehaviour.createAlreadyCreatedCardWithStripeCardId(
        dummyCreateCardInput,
      );

      expect(createdCard.stripe_customer_id).toStrictEqual(dummyCreateCardInput.stripe_customer_id);
      expect(createdCard.stripe_card_id).toStrictEqual(dummyCreateCardInput.stripe_card_id);
      expect(mocks.cardRepository.getCardByStripeCardId).toBeCalledTimes(1);
      expect(mocks.stripeCustomerRepository.getStripeCustomerByStripeId).toBeCalledTimes(1);
      expect(mocks.cardRepository.createCard).toBeCalledTimes(1);
    });

    test('it should return an already known card without adding it again', async () => {
      mocks.stripeCustomerRepository = mock<StripeCustomerRepository>({
        getStripeCustomerByStripeId: jest.fn(() => Promise.resolve(dummyStripeCustomer)),
      });
      mocks.cardRepository = mock<CardRepository>({
        getCardByStripeCardId: jest.fn(() => Promise.resolve(generateCard(dummyCreateCardInput))),
        createCard: jest.fn((cardToCreate) => Promise.resolve(cardToCreate)),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);
      
      const createdCard = await cardBehaviour.createAlreadyCreatedCardWithStripeCardId(
        dummyCreateCardInput,
      );

      expect(createdCard.stripe_customer_id).toStrictEqual(dummyCreateCardInput.stripe_customer_id);
      expect(createdCard.stripe_card_id).toStrictEqual(dummyCreateCardInput.stripe_card_id);
      expect(mocks.cardRepository.getCardByStripeCardId).toBeCalledTimes(1);
      expect(mocks.stripeCustomerRepository.getStripeCustomerByStripeId).toBeCalledTimes(0);
      expect(mocks.cardRepository.createCard).toBeCalledTimes(0);
    });

    test('it should throw an error if the stripe customer is not known', async () => {
      mocks.stripeCustomerRepository = mock<StripeCustomerRepository>({
        getStripeCustomerByStripeId: jest.fn(() => Promise.resolve(null)),
      });
      mocks.cardRepository = mock<CardRepository>({
        getCardByStripeCardId: jest.fn(() => Promise.resolve(null)),
        createCard: jest.fn((cardToCreate) => Promise.resolve(cardToCreate)),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);

      const attemptToCreate = async () => {
        await cardBehaviour.createAlreadyCreatedCardWithStripeCardId(dummyCreateCardInput);
      };
      await expect(attemptToCreate).rejects.toThrow(SubresourceNotFound);

      expect(mocks.cardRepository.getCardByStripeCardId).toBeCalledTimes(1);
      expect(mocks.stripeCustomerRepository.getStripeCustomerByStripeId).toBeCalledTimes(1);
      expect(mocks.cardRepository.createCard).toBeCalledTimes(0);
    });
  });

  describe('syncUserCards', () => {
    const dummyUserId = faker.datatype.uuid();
    const dummyStripeCustomer = generateStripeCustomer({ user_id: dummyUserId });
    const dummyStripeCardId = generateStripeCardId();
    const dummyUserCards = [generateCard({ stripe_card_id: dummyStripeCardId }), generateCard()];
    const dummyStripeCardsOnFile = [
      {
        id: dummyStripeCardId,
        fingerprint: null,
      },
      {
        id: generateStripeCardId(),
        fingerprint: null,
      },
    ];

    test('it should throw an exception when there is no stripe customer record', async () => {
      mocks.stripeCustomerRepository = mock<StripeCustomerRepository>({
        getStripeCustomerByUserId: jest.fn(() => Promise.resolve(null)),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);
      const attemptToSync = async () => {
        await cardBehaviour.syncUserCards(dummyUserId);
      };
      await expect(attemptToSync).rejects.toThrow(SubresourceNotFound);
    });

    test('it should sync cards in db with stripe', async () => {
      mocks.cardRepository = mock<CardRepository>({
        getUserCards: jest.fn(() => Promise.resolve(dummyUserCards)),
        upsert: jest.fn(() => Promise.resolve()),
        setUserDefaultCard: jest.fn(() => Promise.resolve()),
      });
      mocks.stripeCustomerRepository = mock<StripeCustomerRepository>({
        getStripeCustomerByUserId: jest.fn(() => Promise.resolve(dummyStripeCustomer)),
      });
      mocks.stripeService = mock<StripeService>({
        getCustomerSources: jest.fn(() => Promise.resolve(dummyStripeCardsOnFile)),
        getDefaultCustomerSourceId: jest.fn(() => Promise.resolve(dummyStripeCardId)),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);

      await cardBehaviour.syncUserCards(dummyUserId);

      expect(mocks.cardRepository.upsert).toBeCalledWith(
        [
          expect.objectContaining({
            stripe_card_id: dummyStripeCardsOnFile[1].id,
          }),
        ],
        [dummyUserCards[1].id],
      );
      expect(mocks.cardRepository.setUserDefaultCard).toBeCalledTimes(1);
    });

    test('it should not call upsert if there is nothing to sync', async () => {
      mocks.cardRepository = mock<CardRepository>({
        getUserCards: jest.fn(() => Promise.resolve([dummyUserCards[0]])),
        upsert: jest.fn(() => Promise.resolve()),
        setUserDefaultCard: jest.fn(() => Promise.resolve()),
      });
      mocks.stripeCustomerRepository = mock<StripeCustomerRepository>({
        getStripeCustomerByUserId: jest.fn(() => Promise.resolve(dummyStripeCustomer)),
      });
      mocks.stripeService = mock<StripeService>({
        getCustomerSources: jest.fn(() => Promise.resolve([dummyStripeCardsOnFile[0]])),
        getDefaultCustomerSourceId: jest.fn(() => Promise.resolve(dummyStripeCardId)),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);

      await cardBehaviour.syncUserCards(dummyUserId);

      expect(mocks.cardRepository.upsert).toBeCalledTimes(0);
      expect(mocks.cardRepository.setUserDefaultCard).toBeCalledTimes(1);
    });

    test('it should not set default if there is no default on stripe', async () => {
      mocks.cardRepository = mock<CardRepository>({
        getUserCards: jest.fn(() => Promise.resolve([dummyUserCards[0]])),
        upsert: jest.fn(() => Promise.resolve()),
        setUserDefaultCard: jest.fn(() => Promise.resolve()),
      });
      mocks.stripeCustomerRepository = mock<StripeCustomerRepository>({
        getStripeCustomerByUserId: jest.fn(() => Promise.resolve(dummyStripeCustomer)),
      });
      mocks.stripeService = mock<StripeService>({
        getCustomerSources: jest.fn(() => Promise.resolve([dummyStripeCardsOnFile[0]])),
        getDefaultCustomerSourceId: jest.fn(() => Promise.resolve(null)),
      });
      const cardBehaviour = new CardBehaviourImpl(mocks);

      await cardBehaviour.syncUserCards(dummyUserId);

      expect(mocks.cardRepository.upsert).toBeCalledTimes(0);
      expect(mocks.cardRepository.setUserDefaultCard).toBeCalledTimes(0);
    });
  });
});
