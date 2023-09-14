import BaseDomainError from './BaseDomainError';

export default class UniqueConstraintError extends BaseDomainError {
  public name: string;

  public constructor(public message: string, public meta: Record<string, unknown> = {}) {
    super(message);
    this.name = this.constructor.name;
    this.meta = meta;

    Object.keys(meta).forEach((key: string) => {
      const value: unknown | string = this.meta[key];
      if (key === 'target' && typeof value === 'string') {
        this.message = `A resource with unique key ${value} already exists`;
      }
    });
  }
}
