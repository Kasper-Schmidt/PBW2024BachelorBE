import express from "express";
import { exportCSV } from "../controllers/global.controller";

const router = express.Router();
router.post("/exportcsv", exportCSV);

export default router;
