import { Request, Response, NextFunction } from 'express';
import { synthesize } from '../synthesis';
import { SynthesisRequest } from '../schemas/podcast';

export const synthesisController = {
  synthesize: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const synthesisRequest: SynthesisRequest = req.body;

      try {
        // Start synthesis process asynchronously
        const result = await synthesize(synthesisRequest);
        // Emit the response of synthesize
        return res.json({ status: 'success', result });
      } catch (error: unknown) {
        return res.status(500).json({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error occurred' });
      }
    } catch (error) {
      next(error);
    }
  }
}; 