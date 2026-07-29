export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('schemasync_token');
  const headers = { ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Use the API base URL from the environment if available, otherwise default to relative path
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const fullUrl = `${baseUrl}${path}`;

  const response = await fetch(fullUrl, { ...options, headers });

  if (response.status === 401) {
    localStorage.removeItem('schemasync_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      if (errorData && (errorData.message || errorData.error)) {
        errorMessage = errorData.message || errorData.error || response.statusText;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }
    } catch {
      // Fallback to statusText if response body is not JSON
    }
    throw new Error(errorMessage || 'An error occurred');
  }

  if (response.status === 204 || response.status === 202) {
    const text = await response.text();
    if (!text) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return undefined;
    }
  }

  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
