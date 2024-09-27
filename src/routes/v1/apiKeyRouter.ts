import { Router } from 'express';
import apiKeyController from '../../controllers/apiKeyController';

const router = Router();

router.route('/generate-api-key').post(apiKeyController.createApiKey);

export default router;
