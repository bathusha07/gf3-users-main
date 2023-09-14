import express = require('express');
import container from '../container';
import AgreementController from '../controllers/AgreementController';

const agreementRoutes = express.Router();
const controller = container.resolve<AgreementController>('agreementController');

agreementRoutes.route('/').post(controller.createAgreement);

export default agreementRoutes;
