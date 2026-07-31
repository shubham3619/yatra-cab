import { createApi } from '@yatracab/ui';

const baseURL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:5100/api';
export const api = createApi(baseURL);
