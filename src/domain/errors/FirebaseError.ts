import BaseDomainError from './BaseDomainError';
import { FirebaseAuthError } from '../types/firebase';

const UNPROCESSABLE_ENTITY_CODE = 422;
const SERVICE_ERROR_MESSAGE = 'Firebase Error';

export default class FirebaseError extends BaseDomainError {
  public name: string;
  public statusCode = UNPROCESSABLE_ENTITY_CODE;
  public meta: { errorCode: string | undefined };
  public constructor({ code }: FirebaseAuthError) {
    super(SERVICE_ERROR_MESSAGE);
    this.meta = { errorCode: code };
    this.name = this.constructor.name;
  }
}
