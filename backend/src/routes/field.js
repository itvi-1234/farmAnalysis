import express from "express";
import { processRegion } from "../controllers/field.controller.js";

const router = express.Router();

router.post("/process-region", processRegion);

export default router;
