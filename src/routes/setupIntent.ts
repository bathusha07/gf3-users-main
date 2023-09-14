import express = require('express');
import container from '../container';
import SetupIntentController from '../controllers/SetupIntentController';

const setupIntentRoutes = express.Router();

const controller = container.resolve<SetupIntentController>('setupIntentController');

setupIntentRoutes.route('/').post(controller.createSetupIntent);

export default setupIntentRoutes;
