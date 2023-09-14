import express = require('express');
import container from '../container';
import CardController from '../controllers/CardController';

const controller = container.resolve<CardController>('cardController');
const routes = express.Router();

routes.route('/').post(controller.createCard);
routes.route('/:card_id').get(controller.getCard).patch(controller.updateCard);
routes
  .route('/stripe_card_id/:stripe_card_id')
  .delete(controller.deleteAlreadyDeletedCardWithStripeCardId);
routes.route('/stripe_card').post(controller.createAlreadyCreatedCardWithStripeCardId);

export default routes;
