import axiosClient from './axiosClient';

export const getAttendance = (employeeId) =>
  axiosClient.get('/attendance', { params: employeeId ? { employee_id: employeeId } : {} });
export const checkIn = (employeeId) => axiosClient.post('/attendance/check-in', { employee_id: employeeId });
export const checkOut = (employeeId) => axiosClient.post('/attendance/check-out', { employee_id: employeeId });
export const updateAttendance = (id, data) => axiosClient.put(`/attendance/${id}`, data);
export const deleteAttendance = (id) => axiosClient.delete(`/attendance/${id}`);