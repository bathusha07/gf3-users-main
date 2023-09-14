import faker from 'faker';
import { CardEntity } from '@makegoodfood/gf3-types';
import Card from '../../src/domain/card/Card';

const generateCard = (options?: Partial<CardEntity>): Card => {
  return new Card({
    id: faker.datatype.uuid(),
    stripe_customer_id: faker.datatype.uuid(),
    stripe_payment_method_id: 'pm_' + faker.random.alphaNumeric(24),
    stripe_card_id: generateStripeCardId(),
    stripe_card_token: 'tok_' + faker.random.alphaNumeric(24),
    is_default: true,
    ...options,
  });
};

export const generateStripeCardId = () => 'card_' + faker.random.alphaNumeric(24);

export default generateCard;
