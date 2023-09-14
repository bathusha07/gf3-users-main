import BaseDomainError from './BaseDomainError';

const MESSAGE_DELETE_NOT_ALLOWED =
  'DELETE queries are forbidden.' +
  ' Please use a soft-delete instead by updating the deleted_at timestamp.';

export default class DeleteNotAllowed extends BaseDomainError {
  public name: string;

  public constructor() {
    super(MESSAGE_DELETE_NOT_ALLOWED);
    this.name = this.constructor.name;
  }
}
