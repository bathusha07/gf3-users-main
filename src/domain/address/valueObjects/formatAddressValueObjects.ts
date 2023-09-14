import CountryValueObject from './Country';
import PostalCodeValueObject from './PostalCode';
import { Country, PostalCode } from '../../types';
import { AddressInput } from '@makegoodfood/gf3-types';

const formatAddressValueObjects = (
  address: AddressInput,
): {
  country_code: Country;
  postal_code: PostalCode;
} => {
  return {
    country_code: new CountryValueObject(address.country_code ?? ''),
    postal_code: new PostalCodeValueObject(address.postal_code ?? ''),
  };
};

export default formatAddressValueObjects;
