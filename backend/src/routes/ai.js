import express from 'express';
import { generateAIResponse, generateAlertDescriptions } from '../controllers/ai.controller.js';

const router = express.Router();

// AI routes
router.post('/generate', generateAIResponse);
router.post('/alert-descriptions', generateAlertDescriptions);

export default router;
