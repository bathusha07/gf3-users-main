import BaseDomainError from './BaseDomainError';

export default class ForeignKeyConstraintError extends BaseDomainError {
  public name: string;

  public constructor(public message: string, public meta: Record<string, unknown> = {}) {
    super(message);
    this.name = this.constructor.name;
    this.meta = meta;

    Object.keys(meta).forEach((key: string) => {
      const value: unknown | string = this.meta[key];
      if (key === 'field_name' && typeof value === 'string') {
        this.message = `The subresource referenced by ${value} was not found`;
      }
    });
  }
}
