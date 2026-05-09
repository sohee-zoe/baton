/**
 * Convert a string to kebab-case slug safe for filenames.
 */
export function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, '')   // strip special chars (keep hangul)
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'task';
}
