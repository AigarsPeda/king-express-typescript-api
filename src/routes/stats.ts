import express from "express";
import controller from "../controllers/stats";

const router = express.Router();

router.get("/user/stats", controller.getUsersStats);

export = router;
