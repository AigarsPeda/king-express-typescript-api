import express from "express";
import controller from "../controllers/auth";

const router = express.Router();

router.post("/signup", controller.createUser);
router.post("/login", controller.loginUser);

export = router;
