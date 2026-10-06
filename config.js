// Single source of truth for the backend URL. Set it in .env.local (see .env.example).
// NEXT_PUBLIC_ vars are inlined at build time, so restart `next dev` after changing it.
const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");

if (!BASE_URL) {
  console.error("NEXT_PUBLIC_API_BASE_URL is not set. Add it to .env.local.");
}

export default BASE_URL;
