// src/lib/api.js
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api';

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  let response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // CRITICAL: ensures HTTP-only cookies are sent and received
  });
  
  // If access token is expired (401), try to refresh it
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/register') && !endpoint.includes('/auth/google')) {
    try {
      const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (refreshResponse.ok) {
        // Retry original request
        response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          credentials: 'include',
        });
      } else {
        // Refresh token expired or invalid, force logout
        if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
    } catch (refreshErr) {
      console.error('Token refresh failed', refreshErr);
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Properly extract the error message to prevent [object Object]
    let errorMsg = `API request failed with status ${response.status}`;
    if (errorData.error) {
      if (typeof errorData.error === 'string') {
        errorMsg = errorData.error;
      } else if (errorData.error.message) {
        errorMsg = errorData.error.message;
      } else {
        errorMsg = JSON.stringify(errorData.error);
      }
    } else if (errorData.message) {
      errorMsg = errorData.message;
    }

    throw new Error(errorMsg);
  }
  
  // Handle empty responses
  if (response.status === 204) return null;
  
  return response.json();
};
