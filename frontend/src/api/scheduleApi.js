import axiosClient from './axiosClient';

export const getSchedules = () => axiosClient.get('/schedules');
export const getScheduleById = (id) => axiosClient.get(`/schedules/${id}`);
export const createSchedule = (data) => axiosClient.post('/schedules', data);
export const updateSchedule = (id, data) => axiosClient.put(`/schedules/${id}`, data);
export const deleteSchedule = (id) => axiosClient.delete(`/schedules/${id}`);