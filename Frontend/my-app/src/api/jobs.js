import { apiFetch } from './client';

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch('/api/jobs/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function getJob(jobId) {
  return apiFetch(`/api/jobs/${jobId}`);
}

export async function getFailures(jobId, page = 0, size = 20) {
  return apiFetch(`/api/jobs/${jobId}/failures?page=${page}&size=${size}`);
}

export async function retryRecord(jobId, recordId) {
  return apiFetch(`/api/jobs/${jobId}/retry/${recordId}`, {
    method: 'POST',
  });
}

export async function correctRecord(jobId, recordId, fields) {
  return apiFetch(`/api/jobs/${jobId}/failures/${recordId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(fields),
  });
}
