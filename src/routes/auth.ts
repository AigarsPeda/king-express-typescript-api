import express from "express";
import controller from "../controllers/auth";

const router = express.Router();

router.post("/signup", controller.createUser);
router.post("/login", controller.loginUser);
// router.get('/get/books', controller.getAllBooks);

export = router;
