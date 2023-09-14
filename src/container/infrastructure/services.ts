import * as awilix from 'awilix';
import CartServiceStub from '../../infrastructure/services/CartServiceStub';
import CatalogServiceStub from '../../infrastructure/services/CatalogServiceStub';
import StripeServiceImpl from '../../infrastructure/services/StripeServiceImpl';
import TranslationLayerServiceImpl from '../../infrastructure/services/translationLayer';
import GoogleCloudPubsubProducer from '../../infrastructure/services/GoogleCloudPubsubProducer';
import FirebaseServiceImpl from '../../infrastructure/services/FirebaseServiceImpl';

export default {
  catalogService: awilix.asClass(CatalogServiceStub),
  cartService: awilix.asClass(CartServiceStub),
  stripeService: awilix.asClass(StripeServiceImpl),
  pubsubProducer: awilix.asClass(GoogleCloudPubsubProducer),
  translationLayerService: awilix.asClass(TranslationLayerServiceImpl),
  firebaseService: awilix.asClass(FirebaseServiceImpl),
};
