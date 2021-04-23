import express from "express";
import controller from "../controllers/tournament";

const router = express.Router();

router.post("/tournament/create", controller.createTournaments);
router.post("/tournament/finish", controller.finishTournament);
router.get("/tournaments", controller.getAllTournaments);

export = router;
