import ValidationError from '../../errors/ValidationError';
import { CancellationSelectionValueObject } from '../../types';
import {
  CancellationReasonEntity,
  CancellationSelectionInput,
  CANCELLATION_REASON_TYPE_EDITABLE,
  CANCELLATION_REASON_TYPE_STATIC,
} from '@makegoodfood/gf3-types';

export default class CancellationSelectionEditValue implements CancellationSelectionValueObject {
  protected editValue?: string | null;

  public constructor(selection: CancellationSelectionInput) {
    this.editValue = selection.edit_value;
  }

  public validate = (reason: CancellationReasonEntity): string | null | undefined => {
    switch (reason.entry_type) {
      case CANCELLATION_REASON_TYPE_EDITABLE:
        if (this.editValue === null) {
          throw new ValidationError(
            `Selecting reason ${reason.code} must have a string value since the reason is ${reason.entry_type}`,
          );
        }
        break;
      case CANCELLATION_REASON_TYPE_STATIC:
        if (typeof this.editValue === 'string') {
          throw new ValidationError(
            `Selection reason ${reason.code} must have a null value since the reason is ${reason.entry_type}`,
          );
        }
        break;
    }

    return this.editValue;
  };
}
