import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

export default apiClient;

export const fetcher = (url) => apiClient.get(url).then(({ data }) => data);
