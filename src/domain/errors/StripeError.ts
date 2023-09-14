import BaseDomainError from './BaseDomainError';
import Stripe from 'stripe';

const UNPROCESSABLE_ENTITY_CODE = 422;
const SERVER_ERROR_CODE = 500;

export default class StripeError extends BaseDomainError {
  public name: string;
  public statusCode = UNPROCESSABLE_ENTITY_CODE;
  public meta: { errorCode: string | undefined; declineCode: string | undefined };
  public constructor({ code, decline_code, statusCode, message }: Stripe.StripeError) {
    super(message);
    if (statusCode && statusCode >= SERVER_ERROR_CODE) {
      this.statusCode = SERVER_ERROR_CODE;
    }
    this.meta = { errorCode: code, declineCode: decline_code };
    this.name = this.constructor.name;
  }
}
