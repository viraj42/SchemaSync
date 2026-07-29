import { apiFetch } from './client';

export async function login(apiKey) {
  const data = await apiFetch('/api/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apiKey }),
  });
  if (data && data.token) {
    localStorage.setItem('schemasync_token', data.token);
  }
  return data;
}
