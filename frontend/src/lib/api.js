// src/lib/api.js
const API_BASE = 'http://localhost:5000/api';

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // CRITICAL: ensures HTTP-only cookies are sent and received
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }
  
  // Handle empty responses
  if (response.status === 204) return null;
  
  return response.json();
};
