import express from "express";
import controller from "../controllers/game";

const router = express.Router();

router.post("/create/game", controller.createGame);
router.get("/games", controller.getAllGames);

export = router;
