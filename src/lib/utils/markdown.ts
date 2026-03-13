/**
 * Extract a plain-text preview from markdown content
 * Strips markdown syntax and returns first N characters
 */
export function extractPreview(markdown: string, maxLength = 200): string {
  return markdown
    .replace(/#{1,6}\s+/g, '')        // headers
    .replace(/\*\*(.+?)\*\*/g, '$1')  // bold
    .replace(/\*(.+?)\*/g, '$1')      // italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
    .replace(/!\[.*?\]\(.*?\)/g, '')   // images
    .replace(/>\s+/g, '')              // blockquotes
    .replace(/\n+/g, ' ')             // newlines
    .trim()
    .slice(0, maxLength)
    .concat('...');
}

/**
 * Estimate reading time for an article
 */
export function estimateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

/**
 * Count words in markdown content
 */
export function wordCount(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length;
}
