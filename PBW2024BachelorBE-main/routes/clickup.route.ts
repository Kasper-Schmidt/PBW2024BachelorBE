import express from "express";
const router = express.Router();

import {
  getClickUpTasksFromList,
  getClickupListUsers,
} from "../controllers/clickup.controller";

// ---GET---
router.get("/tasks/:email", getClickUpTasksFromList);
router.get("/members", getClickupListUsers);

export default router;
