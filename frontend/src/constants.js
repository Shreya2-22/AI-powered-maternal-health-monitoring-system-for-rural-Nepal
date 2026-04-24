// Central API URL — imported by all components that need it.
// Keeping this in its own file fixes the eslint-plugin-react-refresh warning
// that fires when a non-component named export (API) lives alongside a
// component default export in App.jsx.
export const API = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';