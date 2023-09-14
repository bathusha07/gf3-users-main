import BaseDomainError from './BaseDomainError';

const UNPROCESSABLE_ENTITY_CODE = 422;

type StripeErrorType = {
  code?: string;
  decline_code?: string;
  statusCode?: number;
  message: string;
};
export default class StripeValidationError extends BaseDomainError {
  public name: string;
  public meta: { errorCode: string | undefined; declineCode: string | undefined };

  public constructor(conf: StripeErrorType) {
    super(conf.message);
    this.statusCode = conf.statusCode ?? UNPROCESSABLE_ENTITY_CODE;
    this.meta = { errorCode: conf.code, declineCode: conf.decline_code };
    this.name = this.constructor.name;
  }
}
