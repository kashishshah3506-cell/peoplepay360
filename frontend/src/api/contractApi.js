import axiosClient from './axiosClient';

export const getContracts = (employeeId) =>
  axiosClient.get('/contracts', { params: employeeId ? { employee_id: employeeId } : {} });
export const getContractById = (id) => axiosClient.get(`/contracts/${id}`);
export const createContract = (data) => axiosClient.post('/contracts', data);
export const updateContract = (id, data) => axiosClient.put(`/contracts/${id}`, data);
export const deleteContract = (id) => axiosClient.delete(`/contracts/${id}`);

export const getSalaryStructures = () => axiosClient.get('/salary-structures');