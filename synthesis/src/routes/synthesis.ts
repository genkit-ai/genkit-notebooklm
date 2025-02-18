import { Router } from 'express';
import { synthesisController } from '../controllers/synthesisController';

const router = Router();

router.post('/', synthesisController.synthesize);
router.get('/status/:jobId', synthesisController.getStatus);

export { router as synthesisRouter }; 