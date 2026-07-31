import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, Toaster } from '@yatracab/ui';
import { api } from './api.js';
import App from './App.jsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15000 } },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider api={api} roles={['customer']}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <Toaster position="top-center" toastOptions={{ style: { borderRadius: '12px' } }} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
