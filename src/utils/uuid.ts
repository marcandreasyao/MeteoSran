/**
 * Generates a safe, universally compatible UUID v4.
 * Falls back to a standard math-based pseudo-random generator if crypto.randomUUID is not available.
 * This is crucial for insecure contexts (HTTP) or older mobile browsers where crypto.randomUUID is undefined.
 */
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
