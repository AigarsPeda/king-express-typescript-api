import express from "express";
import controller from "../controllers/user";

const router = express.Router();

router.put("/user", controller.updateUser);

// router.get('/get/books', controller.getAllBooks);

export = router;
