import express from "express";
import controller from "../controllers/user";

const router = express.Router();

router.post("/create/user", controller.createUser);
router.post("/login/user", controller.loginUser);
// router.get('/get/books', controller.getAllBooks);

export = router;
