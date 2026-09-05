import axiosClient from './axiosClient';

export const getDashboardSummary = () => axiosClient.get('/dashboard/summary');
export const getKpis = (params) => axiosClient.get('/dashboard/kpis', { params });
export const getSalaryByDepartment = (params) => axiosClient.get('/dashboard/salary-by-department', { params });
export const getMonthlyTrend = () => axiosClient.get('/dashboard/monthly-trend');
export const getAlerts = () => axiosClient.get('/dashboard/alerts');
export const getAttendanceOverview = (params) => axiosClient.get('/dashboard/attendance-overview', { params });
export const getTimeOffOverview = () => axiosClient.get('/dashboard/time-off-overview');
export const getDepartmentOverview = () => axiosClient.get('/dashboard/department-overview');