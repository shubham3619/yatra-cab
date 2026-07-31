import { createApi } from '@yatracab/ui';

const baseURL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000/api';
export const api = createApi(baseURL);
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
