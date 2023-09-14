import express = require('express');
import container from '../container';
import AddressController from '../controllers/AddressController';

const addressRoutes = express.Router();
const controller = container.resolve<AddressController>('addressController');
addressRoutes.route('/').post(controller.createAddress);
addressRoutes.route('/:id').patch(controller.updateAddress);

export default addressRoutes;
