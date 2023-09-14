import { AgreementBehaviour } from '../domain/types';
import { AgreementInput } from '@makegoodfood/gf3-types';
import asyncHandler from '../middleware/async';
import { agreementValidation } from '../utils/validation';
import ValidationError from './errors/ValidationError';

export default class AgreementController {
  protected agreementBehaviour: AgreementBehaviour;

  public constructor({ agreementBehaviour }: { agreementBehaviour: AgreementBehaviour }) {
    this.agreementBehaviour = agreementBehaviour;
  }

  public createAgreement = asyncHandler(async (req, res) => {
    const body = req.body;
    const inputAgreement = {
      terms_id: body.terms_id,
      user_id: body.user_id,
      ip_address: body.ip_address,
    };
    let validatedInput: AgreementInput;
    try {
      validatedInput = await agreementValidation.validate(inputAgreement, {
        abortEarly: false,
        strict: true,
      });
    } catch (error) {
      throw new ValidationError(error);
    }

    const agreement = await this.agreementBehaviour.createAgreement(validatedInput);
    res.status(201).json(agreement);
  });
}
