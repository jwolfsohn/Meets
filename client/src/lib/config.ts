function defaultApiBaseUrl() {
  // Works on localhost and on LAN (e.g. when testing on a phone via your Mac’s IP)
  // Example: if app is served from http://192.168.1.10:5173 → API defaults to http://192.168.1.10:5000
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:5000`;
  }
  return 'http://localhost:5000';
}

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) || defaultApiBaseUrl();


