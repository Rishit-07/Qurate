import express from "express";
import {login,register, resetPassword, changeEmail} from "../controllers/authController.js";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", resetPassword);
router.post("/change-email", changeEmail);

export default router;