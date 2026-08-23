import axiosClient from './axios.js'

export const getIncidents = () => {
  return axiosClient.get('/incidents')
}

export const createReport = (reportData) => {
  return axiosClient.post('/reports', reportData)
}

export const getReports = () => {
  return axiosClient.get('/reports')
}
export const checkHealth = () => {
  return axiosClient.get('/health')
}