import BaseDomainError from './BaseDomainError';

const CONFLICT_ERROR_CODE = 409;
const CONFLICT_ERROR_MESSAGE = 'Conflict: The {table} record already exists';

export default class RecordCreationConflict extends BaseDomainError {
  public name: string;
  public statusCode = CONFLICT_ERROR_CODE;
  public constructor(table?: string) {
    super(CONFLICT_ERROR_MESSAGE.replace('{table}', table || ''));
    this.name = this.constructor.name;
  }
}
