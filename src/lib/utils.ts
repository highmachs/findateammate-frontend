import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { API_BASE_URL } from "./queryClient"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolves a backend asset path (e.g. "/uploads/image.jpg") to a full URL.
 * In split deployment (frontend on Vercel, backend on Render),
 * Vercel rewrites /uploads/* to backend, so relative paths work fine.
 * In unified deployment, API_BASE_URL might be set to backend origin.
 */
export function getAssetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path; // Already absolute
  
  // If API_BASE_URL is set, use it as prefix (for environments that need it)
  if (API_BASE_URL) {
    // Asset paths should not inherit a trailing /api from API base.
    const assetBase = API_BASE_URL.replace(/\/api$/i, "");
    return `${assetBase}${path}`;
  }
  
  // In production with Vercel rewrite, just return the path
  // Vercel will rewrite /uploads/* to backend
  return path;
}

export const getGradient = (name?: string | null) => {
  const colors = [
    'from-primary to-accent',
    'from-accent to-secondary',
    'from-secondary to-primary',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-rose-500',
    'from-blue-500 to-indigo-500'
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

