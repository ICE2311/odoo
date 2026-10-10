import { z } from 'zod';

const PRIVATE_HOSTS = /^(localhost|127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/;

export const publicUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((val) => {
    try {
      const url = new URL(val);
      if (url.protocol !== 'https:') return false;
      if (PRIVATE_HOSTS.test(url.hostname)) return false;
      return true;
    } catch {
      return false;
    }
  }, 'Must be a valid public HTTPS URL');

export function normaliseShareLink(url: string): string {
  try {
    const u = new URL(url);

    // Google Drive: /file/d/<id>/view or /file/d/<id>/preview
    const driveMatch = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (u.hostname === 'drive.google.com' && driveMatch) {
      return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
    }

    // Dropbox: dl=0 -> raw=1
    if (
      u.hostname.includes('dropbox.com') &&
      u.searchParams.get('dl') === '0'
    ) {
      u.searchParams.set('raw', '1');
      u.searchParams.delete('dl');
      return u.toString();
    }

    return url;
  } catch {
    return url;
  }
}

