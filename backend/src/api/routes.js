import express from 'express';
import { search, stream } from './controllers';

const router = express.Router();

// Search endpoint
router.get('/search', search);

// Stream endpoint
router.get('/stream', stream);

export default router;
