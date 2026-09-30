// Set NEXT_PUBLIC_API_BASE_URL in .env.local (local dev) and in Vercel project settings (production).
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default BASE_URL;
