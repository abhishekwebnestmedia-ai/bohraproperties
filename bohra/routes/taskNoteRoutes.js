const express = require("express");
const router = express.Router();

const { requireSignIn } = require("../middleware/authmiddleware");
const noteController = require("../controllers/taskNoteController");

router.post("/", requireSignIn, noteController.createNote);
router.get("/", requireSignIn, noteController.getNotes);
router.get("/:id", requireSignIn, noteController.getNoteById);

// ✅ only update api (updates everything + adds comments array)
router.put("/:id", requireSignIn, noteController.updateNote);

router.delete("/:id", requireSignIn, noteController.deleteNote);

module.exports = router;
