import express from "express";
import controller from "../controllers/game";

const router = express.Router();

router.post("/game", controller.saveGame);
router.get("/game/:id", controller.getTournamentGames);

export = router;
