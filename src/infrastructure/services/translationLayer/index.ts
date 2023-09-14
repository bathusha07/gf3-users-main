import TranslationLayerServiceImpl from './TranslationLayerServiceImpl';
import TranslationLayerServiceStub from './TranslationLayerServiceStub';

export const TRANSLATION_LAYER_SERVICE_NAME = 'TranslationLayer';
export const TRANSLATION_LAYER_SERVICE_URL = process.env.TRANSLATION_LAYER_SERVICE_URL ?? '';
export const TRANSLATION_LAYER_AUTH_TOKEN = process.env.TRANSLATION_LAYER_AUTH_TOKEN ?? '';
export const TRANSLATION_LAYER_HOST = process.env.TRANSLATION_LAYER_HOST ?? 'api.makegoodfood.ca';

let TranslationLayerService = TranslationLayerServiceStub;
if (TRANSLATION_LAYER_SERVICE_URL) {
  TranslationLayerService = TranslationLayerServiceImpl;
}

export default TranslationLayerService;
