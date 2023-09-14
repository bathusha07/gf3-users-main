import Stripe from 'stripe';

export type StripeCreateCustomerResponse = {
  id: string;
};

export interface StripeCreateCustomerSourceInput {
  stripe_customer_id: string;
  stripe_card_token: string;
}

export interface StripeCreateCustomerSourceResponse {
  id: string;
  stripe_card_fingerprint?: string | null;
}

export interface StripeDeleteCustomerSourceInput {
  stripe_customer_id: string;
  stripe_card_id: string;
}

export type StripeCreateSetupIntentResponse = {
  client_secret: string;
};

export interface StripeCustomerSource {
  id: string;
  fingerprint: string | null;
}

export interface StripeService {
  createCustomer: (params: Stripe.CustomerCreateParams) => Promise<StripeCreateCustomerResponse>;
  createCustomerSource: (
    sourceInput: StripeCreateCustomerSourceInput,
  ) => Promise<StripeCreateCustomerSourceResponse>;
  deleteCustomerSource: (sourceInput: StripeDeleteCustomerSourceInput) => Promise<void>;
  createSetupIntent: (customerId: string) => Promise<StripeCreateSetupIntentResponse>;
  getCustomerSources: (customerId: string) => Promise<StripeCustomerSource[]>;
  getDefaultCustomerSourceId: (customerId: string) => Promise<string | null>;
  deleteCustomerAndCards: (customerId: string) => Promise<void>;
}
