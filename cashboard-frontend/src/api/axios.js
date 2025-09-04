import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.cashboardapp.ir/',  // <-- your live backend
  timeout: 5000,
});

export default api;
