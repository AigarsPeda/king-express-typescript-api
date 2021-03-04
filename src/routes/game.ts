import express from "express";
import controller from "../controllers/game";

const router = express.Router();

router.post("/create/game", controller.createGame);

// router.get('/get/books', controller.getAllBooks);

export = router;
