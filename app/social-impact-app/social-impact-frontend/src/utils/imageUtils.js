/**
 * Core image utility functions for validation, fallbacks, and placeholder checks.
 */

export const isValidImageUrl = (url, isBroken = false) => {
  if (isBroken) return false;
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed === '') return false;
  if (trimmed.includes('placeholder.com') || trimmed.includes('via.placeholder')) return false;
  return true;
};

/**
 * Dynamically optimizes image URLs (e.g. Unsplash) for lower bandwidth and fast loading.
 */
export const optimizeImageUrl = (url, width = 480, quality = 75) => {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('w', width.toString());
      parsed.searchParams.set('q', quality.toString());
      return parsed.toString();
    } catch (_) {
      return url;
    }
  }
  return url;
};

export const getImageWithFallback = (url, fallback, isBroken = false) => {
  const resolved = isValidImageUrl(url, isBroken) ? url : fallback;
  return optimizeImageUrl(resolved);
};
