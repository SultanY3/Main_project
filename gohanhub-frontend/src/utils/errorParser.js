export function parseApiError(error) {
  const data = error.response?.data;

  if (!data) return "An error occurred. Please try again.";
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  if (data.error) return data.error;
  if (typeof data.message === 'string') return data.message;
  if (Array.isArray(data)) return data[0];

  // Handles validation errors like { field: [msg] }
  const firstKey = Object.keys(data)[0];
  if (firstKey && Array.isArray(data[firstKey]) && data[firstKey][0]) {
    return `${firstKey}: ${data[firstKey][0]}`;
  }

  // Fallback for unexpected structures
  return JSON.stringify(data);
}
