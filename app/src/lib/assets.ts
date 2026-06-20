/** Public assets — always prefix with Vite base (e.g. /recall/ on GitHub Pages). */
const base = import.meta.env.BASE_URL;

export const LOGO_URL = `${base}logo.png`;
export const FORGET_ME_NOT_URL = `${base}forget-me-not.png`;

export const FAMILY_PHOTOS = {
  susan: `${base}photos/susan.png`,
  robert: `${base}photos/robert.png`,
  lily: `${base}photos/lily.png`,
} as const;

export function familyPhotoUrl(name: string): string | undefined {
  const key = name.trim().toLowerCase() as keyof typeof FAMILY_PHOTOS;
  return FAMILY_PHOTOS[key];
}
