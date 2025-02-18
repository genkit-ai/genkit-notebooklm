import { Request, Response, NextFunction } from 'express';
import { synthesize } from '../synthesis';
import { SynthesisRequest } from '../schemas/podcast';

export const synthesisController = {
  synthesize: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const synthesisRequest: SynthesisRequest = req.body;
      const result = await synthesize(synthesisRequest);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  getStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { jobId } = req.params;
      // Implement job status checking logic here
      res.json({ jobId, status: 'pending' });
    } catch (error) {
      next(error);
    }
  }
}; 