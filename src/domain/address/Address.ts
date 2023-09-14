import { UserId, AddressEntity, AddressId } from '@makegoodfood/gf3-types';

export default class Address implements AddressEntity {
  public id: AddressId;
  public user_id: UserId;
  public address_line_1: string;
  public address_line_2?: string | null;
  public company?: string | null;
  public city: string;
  public province_code: string;
  public country_code: string;
  public postal_code: string;
  public special_instructions?: string | null;
  public building_type?: string | null;
  public is_default: boolean;
  public fsa: string;

  public constructor(address: AddressEntity) {
    this.id = address.id;
    this.user_id = address.user_id;
    this.address_line_1 = address.address_line_1;
    this.address_line_2 = address.address_line_2 ?? null;
    this.company = address.company;
    this.city = address.city;
    this.province_code = address.province_code;
    this.country_code = address.country_code;
    this.postal_code = address.postal_code;
    this.special_instructions = address.special_instructions;
    this.building_type = address.building_type;
    this.is_default = address.is_default;
    this.fsa = address.fsa;
  }
}
