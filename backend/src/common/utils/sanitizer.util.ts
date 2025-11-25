import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

// Create a DOMPurify instance with JSDOM window
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param dirty - The potentially unsafe HTML string
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  return purify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Strips all HTML tags from a string
 * @param html - The HTML string
 * @returns Plain text without HTML tags
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return purify.sanitize(html, { ALLOWED_TAGS: [] });
}

/**
 * Sanitizes message content for storage
 * @param content - The message content
 * @returns Sanitized content
 */
export function sanitizeMessageContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // For messages, we strip all HTML to prevent XSS
  return stripHtml(content);
}
