import axiosClient from './axiosClient';

export const getTimeOffTypes = () => axiosClient.get('/time-off-types');
export const createTimeOffType = (data) => axiosClient.post('/time-off-types', data);
export const updateTimeOffType = (id, data) => axiosClient.put(`/time-off-types/${id}`, data);
export const deleteTimeOffType = (id) => axiosClient.delete(`/time-off-types/${id}`);

export const getAllocations = (employeeId) =>
  axiosClient.get('/allocations', { params: employeeId ? { employee_id: employeeId } : {} });
export const createAllocation = (data) => axiosClient.post('/allocations', data);
export const updateAllocationStatus = (id, status) => axiosClient.put(`/allocations/${id}/status`, { status });
export const deleteAllocation = (id) => axiosClient.delete(`/allocations/${id}`);

export const getTimeOffRequests = (employeeId) =>
  axiosClient.get('/time-off-requests', { params: employeeId ? { employee_id: employeeId } : {} });
export const createTimeOffRequest = (data) => axiosClient.post('/time-off-requests', data);
export const updateRequestStatus = (id, status) => axiosClient.put(`/time-off-requests/${id}/status`, { status });
export const deleteTimeOffRequest = (id) => axiosClient.delete(`/time-off-requests/${id}`);