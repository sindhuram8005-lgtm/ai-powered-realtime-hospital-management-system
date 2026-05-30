import { deleteFile } from "../controllers/uploadthing.ts";
import { requireAuth } from "../middleware/auth.ts";

import express from "express";

const uploadthingRouter = express.Router();

uploadthingRouter.delete("/", requireAuth, deleteFile);

export default uploadthingRouter;
