import express from "express";
import controller from "../controllers/tournament";

const router = express.Router();

router.post("/tournament/create", controller.createTournaments);
router.post("/tournament/finish", controller.finishTournament);

// ?from_date=from_date
router.get("/tournaments", controller.getAllTournaments);

export = router;
