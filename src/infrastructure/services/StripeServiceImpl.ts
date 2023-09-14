import Stripe from 'stripe';
import {
  StripeService,
  StripeCreateCustomerResponse,
  StripeCreateSetupIntentResponse,
  StripeCreateCustomerSourceInput,
  StripeCreateCustomerSourceResponse,
  StripeCustomerSource,
  StripeDeleteCustomerSourceInput,
} from '../../domain/types';
import ServiceError, { UNEXPECTED_RESPONSE } from '../../domain/errors/ServiceError';
import StripeError from '../../domain/errors/StripeError';

export const STRIPE_SERVICE_NAME = 'Stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET ?? '', {
  apiVersion: '2020-08-27',
});

export default class StripeServiceImpl implements StripeService {
  public createCustomer = async (
    params: Stripe.CustomerCreateParams,
  ): Promise<StripeCreateCustomerResponse> => {
    try {
      return await stripe.customers.create(params);
    } catch (e) {
      throw new StripeError(e);
    }
  };

  public createCustomerSource = async (
    sourceInput: StripeCreateCustomerSourceInput,
  ): Promise<StripeCreateCustomerSourceResponse> => {
    try {
      const answer = (await stripe.customers.createSource(sourceInput.stripe_customer_id, {
        source: sourceInput.stripe_card_token,
      })) as Stripe.Card;
      return {
        ...answer,
        stripe_card_fingerprint: answer.fingerprint,
      };
    } catch (e) {
      throw new StripeError(e);
    }
  };

  public deleteCustomerSource = async (
    sourceInput: StripeDeleteCustomerSourceInput,
  ): Promise<void> => {
    await stripe.customers.deleteSource(sourceInput.stripe_customer_id, sourceInput.stripe_card_id);
  };

  public createSetupIntent = async (
    customerId: string,
  ): Promise<StripeCreateSetupIntentResponse> => {
    const response = await stripe.setupIntents.create({
      customer: customerId,
    });
    if (!response.client_secret) {
      throw new ServiceError(STRIPE_SERVICE_NAME, UNEXPECTED_RESPONSE);
    }
    return {
      client_secret: response.client_secret,
    };
  };

  public getCustomerSources = async (customerId: string): Promise<StripeCustomerSource[]> => {
    try {
      const sources: StripeCustomerSource[] = [];
      let startingAfter: string | undefined = undefined;
      let hasMore = true;

      while (hasMore) {
        const response = await stripe.customers.listSources(customerId, {
          object: 'card',
          starting_after: startingAfter,
        });
        // card type specified in the request above, so these will all be Stripe.Card
        const batchSources = response.data as Stripe.Card[];
        if (!response.has_more || !batchSources.length) {
          hasMore = false;
        }
        batchSources.forEach((source) => {
          sources.push({
            ...source,
            fingerprint: source.fingerprint ?? null,
          });
          startingAfter = source.id;
        });
      }
      return sources;
    } catch (error) {
      throw this.buildServiceError(error);
    }
  };

  public getDefaultCustomerSourceId = async (customerId: string): Promise<string | null> => {
    let stripeCustomer;
    try {
      stripeCustomer = await stripe.customers.retrieve(customerId);
    } catch (error) {
      throw this.buildServiceError(error);
    }
    if (stripeCustomer.deleted) {
      throw new ServiceError(STRIPE_SERVICE_NAME, `Customer ${customerId} is deleted.`);
    }
    // default_source can also be Stripe.CustomerSource object, but only is we request it to
    // be expanded in the request, which we're not doing, so we can exclude that type from the cast
    return stripeCustomer.default_source as string | null;
  };

  private buildServiceError(error: Error) {
    let errorMessage = UNEXPECTED_RESPONSE;
    if (error instanceof Stripe.errors.StripeError) {
      errorMessage = error.message;
    }
    return new ServiceError(STRIPE_SERVICE_NAME, errorMessage);
  }

  public deleteCustomerAndCards = async (customerId: string): Promise<void> => {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer) {
        const cardIds = (customer as Stripe.Customer)?.sources?.data.map((card) => card.id);
        if (cardIds?.length) {
          await Promise.all(
            cardIds.map((cardId) => stripe.customers.deleteSource(customerId, cardId)),
          );
        }
        await stripe.customers.del(customerId);
      }
    } catch (e) {
      throw new StripeError(e);
    }
  };
}
