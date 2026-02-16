import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 120000,
});

// CSV Upload
export const uploadCSV = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

// Reports
export const getReports = () => api.get('/reports/');
export const getReport = (id) => api.get(`/reports/${id}/`);
export const deleteReport = (id) => api.delete(`/reports/${id}/delete/`);

// AI Insights
export const generateInsights = (id) => api.post(`/reports/${id}/insights/`);
export const askFollowUp = (id, question) =>
    api.post(`/reports/${id}/follow-up/`, { question });

// Health Check
export const getHealth = () => api.get('/health/');

export default api;
