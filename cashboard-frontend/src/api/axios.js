import axios from 'axios';

const api = axios.create({
  baseURL: 'http://10.0.2.2:8000/api/', // replace with your IP, not localhost
  timeout: 5000,
});

export default api;
