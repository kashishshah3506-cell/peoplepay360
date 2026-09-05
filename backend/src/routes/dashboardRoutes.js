const express = require('express');
const router = express.Router();
const {
  getKpis, getSalaryByDepartment, getMonthlySalaryTrend, getPayrollAlerts,
  getAttendanceOverview, getTimeOffOverview, getDepartmentOverview, getDashboardSummary,
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

const dashboardRoles = ['Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'];

router.get('/summary', protect, authorize(...dashboardRoles), getDashboardSummary);
router.get('/kpis', protect, authorize(...dashboardRoles), getKpis);
router.get('/salary-by-department', protect, authorize(...dashboardRoles), getSalaryByDepartment);
router.get('/monthly-trend', protect, authorize(...dashboardRoles), getMonthlySalaryTrend);
router.get('/alerts', protect, authorize(...dashboardRoles), getPayrollAlerts);
router.get('/attendance-overview', protect, authorize(...dashboardRoles), getAttendanceOverview);
router.get('/time-off-overview', protect, authorize(...dashboardRoles), getTimeOffOverview);
router.get('/department-overview', protect, authorize(...dashboardRoles), getDepartmentOverview);

module.exports = router;