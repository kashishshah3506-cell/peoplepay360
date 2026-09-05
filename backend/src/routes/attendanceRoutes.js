const express = require("express");
const router = express.Router();
const { getAttendance, getAttendanceById, checkIn, checkOut, updateAttendance, deleteAttendance } = require("../controllers/attendanceController");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");

router.post("/check-in", authMiddleware, checkIn);
router.post("/check-out", authMiddleware, checkOut);
router.get("/", authMiddleware, authorize("Admin", "HR Manager"), getAttendance);
router.get("/:id", authMiddleware, authorize("Admin", "HR Manager"), getAttendanceById);
router.put("/:id", authMiddleware, authorize("Admin", "HR Manager"), updateAttendance);
router.delete("/:id", authMiddleware, authorize("Admin", "HR Manager"), deleteAttendance);

module.exports = router;
