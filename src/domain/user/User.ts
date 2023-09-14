import { FirebaseId, UserEntity, UserId } from '@makegoodfood/gf3-types';

export default class User implements UserEntity {
  public id: UserId;
  public email: string;
  public phone?: string | null;
  public first_name?: string | null;
  public last_name?: string | null;
  public firebase_id: FirebaseId;
  public language: string;

  public constructor({
    id,
    email,
    phone,
    first_name,
    last_name,
    firebase_id,
    language,
  }: UserEntity) {
    this.id = id;
    this.email = email;
    this.phone = phone;
    this.first_name = first_name;
    this.last_name = last_name;
    this.firebase_id = firebase_id;
    this.language = language;
  }
}
