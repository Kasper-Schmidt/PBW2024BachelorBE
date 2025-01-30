import express from "express";
const router = express.Router();

import {
  getTeamupAuth,
  getTeamupUsers,
  getTeamupSubcalenders,
  getTeamupUserEvents
} from "../controllers/teamup.controller";

// ---GET---
router.get("/searchUser/:calendarId", getTeamupUsers);
router.get("/subcalendars", getTeamupSubcalenders);
router.get("/userEvents/:email", getTeamupUserEvents);

// ---POST---
router.post("/auth", getTeamupAuth);


export default router;
