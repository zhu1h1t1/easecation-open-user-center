// Open-source repo should default to the local mock backend unless explicitly overridden.
export const BACKEND_DOMAIN = import.meta.env.VITE_BACKEND_DOMAIN || 'http://localhost:9000';
