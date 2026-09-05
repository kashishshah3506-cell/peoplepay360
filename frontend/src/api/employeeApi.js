import axiosClient from './axiosClient';

export const getEmployees = () => axiosClient.get('/employees');
export const getEmployeeById = (id) => axiosClient.get(`/employees/${id}`);
export const createEmployee = (data) => axiosClient.post('/employees', data);
export const updateEmployee = (id, data) => axiosClient.put(`/employees/${id}`, data);
export const deleteEmployee = (id) => axiosClient.delete(`/employees/${id}`);

export const getDepartments = () => axiosClient.get('/departments');
export const createDepartment = (data) => axiosClient.post('/departments', data);

export const getJobPositions = () => axiosClient.get('/job-positions');
export const createJobPosition = (data) => axiosClient.post('/job-positions', data);

export const getSchedules = () => axiosClient.get('/schedules');