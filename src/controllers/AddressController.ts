import asyncHandler from '../middleware/async';
import { addressValidation } from '../utils/validation';
import ValidationError from './errors/ValidationError';
import { AddressBehaviour } from '../domain/types';
import { AddressId, AddressInput } from '@makegoodfood/gf3-types';

export default class AddressController {
  protected addressBehaviour: AddressBehaviour;

  public constructor({ addressBehaviour }: { addressBehaviour: AddressBehaviour }) {
    this.addressBehaviour = addressBehaviour;
  }

  public createAddress = asyncHandler(async (req, res) => {
    const inputAddress = {
      user_id: req.body.user_id,
      is_default: req.body.is_default,
      address_line_1: req.body.address_line_1,
      address_line_2: req.body.address_line_2,
      company: req.body.company,
      city: req.body.city,
      province_code: req.body.province_code,
      country_code: req.body.country_code,
      postal_code: (req.body.postal_code as string).replace(/\s|-/g, ''),
      building_type: req.body.building_type,
      special_instructions: req.body.special_instructions,
    };

    let validatedInput: AddressInput;
    try {
      validatedInput = await addressValidation.validate(inputAddress, {
        abortEarly: false,
      });
    } catch (error) {
      throw new ValidationError(error);
    }

    const address = await this.addressBehaviour.createAddress(validatedInput);
    res.status(201).json(address);
  });

  public getUserAddresses = asyncHandler(async (req, res) => {
    const addresses = await this.addressBehaviour.getUserAddresses(req.params.id);
    res.status(200).json(addresses);
  });

  public updateAddress = asyncHandler(async (req, res) => {
    const addressId: AddressId = req.params.id;
    const update = {
      user_id: req.body.user_id,
      is_default: req.body.is_default,
      address_line_1: req.body.address_line_1,
      address_line_2: req.body.address_line_2,
      company: req.body.company,
      city: req.body.city,
      province_code: req.body.province_code,
      country_code: req.body.country_code,
      postal_code: (req.body.postal_code as string).replace(/\s|-/g, ''),
      building_type: req.body.building_type,
      special_instructions: req.body.special_instructions,
    };
    let validatedUpdate: AddressInput;
    try {
      validatedUpdate = await addressValidation.validate(update, {
        abortEarly: false,
      });
    } catch (error) {
      throw new ValidationError(error);
    }

    const address = await this.addressBehaviour.updateAddress(addressId, validatedUpdate);
    res.status(200).json(address);
  });
}
