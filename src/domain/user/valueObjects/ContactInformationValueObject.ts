import { ContactInformation } from '../../types';
import { UserEntity } from '@makegoodfood/gf3-types';

export default class ContactInformationValueObject implements ContactInformation {
  private firstName?: string | null;
  private lastName?: string | null;

  public constructor(user: UserEntity) {
    this.firstName = user.first_name;
    this.lastName = user.last_name;
  }

  public isEmpty(): boolean {
    return !this.firstName && !this.lastName;
  }
}
