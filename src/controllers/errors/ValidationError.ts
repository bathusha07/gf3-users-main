import { ValidationError as YupValidationError } from 'yup';
import { ClientError } from '../types';

export default class ValidationError extends Error implements ClientError {
  public name: string;
  public statusCode = 400;
  public constructor(error: YupValidationError) {
    super(error.errors ? error.errors.join(', ') : error.message);
    this.name = this.constructor.name;
  }
}
