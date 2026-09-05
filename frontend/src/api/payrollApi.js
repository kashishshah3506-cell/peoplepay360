import axiosClient from './axiosClient';

export const getPayruns = () => axiosClient.get('/payruns');
export const getPayrunById = (id) => axiosClient.get(`/payruns/${id}`);
export const getEligibleEmployees = (periodStart, periodEnd) =>
  axiosClient.get('/payruns/eligible-employees', { params: { period_start: periodStart, period_end: periodEnd } });
export const createPayrun = (data) => axiosClient.post('/payruns', data);
export const computePayrun = (id) => axiosClient.post(`/payruns/${id}/compute`);
export const validatePayrun = (id) => axiosClient.post(`/payruns/${id}/validate`);
export const markPayrunPaid = (id) => axiosClient.post(`/payruns/${id}/mark-paid`);
export const sendAllPayslips = (id) => axiosClient.post(`/payruns/${id}/send-payslips`);

export const getPayslips = (params) => axiosClient.get('/payslips', { params });
export const getPayslipById = (id) => axiosClient.get(`/payslips/${id}`);
export const emailPayslip = (id) => axiosClient.post(`/payslips/${id}/email`);
export const printPayslipUrl = (id) => `http://localhost:5000/api/payslips/${id}/print`;