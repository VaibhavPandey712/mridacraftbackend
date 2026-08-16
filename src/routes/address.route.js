import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
    listAddresses,
    createAddress,
    updateAddress,
    setDefaultAddress,
    deleteAddress,
} from "../controllers/address.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", listAddresses);
router.post("/", createAddress);
router.put("/:id", updateAddress);
router.put("/:id/default", setDefaultAddress);
router.delete("/:id", deleteAddress);

export default router;
