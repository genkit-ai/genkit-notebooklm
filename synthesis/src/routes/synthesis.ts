import { Router } from 'express';
import { synthesisController } from '../controllers/synthesisController';

const router = Router();

router.post('/', synthesisController.synthesize);

export { router as synthesisRouter }; 