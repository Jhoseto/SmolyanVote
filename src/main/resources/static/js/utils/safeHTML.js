/**
 * Safe HTML Utility Functions
 * Prevents XSS attacks by sanitizing HTML before insertion
 * Uses DOMPurify library for sanitization
 * 
 * Usage:
 *   import { safeSetHTML, safeSetText } from '/js/utils/safeHTML.js';
 *   
 *   // For HTML content that needs formatting
 *   safeSetHTML(element, '<strong>User Input</strong>');
 *   
 *   // For plain text (safest)
 *   safeSetText(element, 'User Input');
 */

// Load DOMPurify from CDN (no npm build needed for Java project)
const loadDOMPurify = () => {
  return new Promise((resolve, reject) => {
    if (window.DOMPurify) {
      resolve(window.DOMPurify);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/dompurify@3.0.10/dist/purify.min.js';
    script.onload = () => {
      if (window.DOMPurify) {
        console.log('✅ DOMPurify loaded successfully');
        resolve(window.DOMPurify);
      } else {
        reject(new Error('DOMPurify failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load DOMPurify script'));
    document.head.appendChild(script);
  });
};

// Initialize DOMPurify
let purifyReady = loadDOMPurify();

// Default safe configuration
const DEFAULT_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'a', 'span', 'div', 'img', 'i', 'b', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'
  ],
  ALLOWED_ATTR: [
    'href', 'class', 'src', 'alt', 'title', 'target', 'rel', 'id', 
    'data-user-id', 'data-event-id', 'data-signal-id', 'data-publication-id'
  ],
  ALLOW_DATA_ATTR: false, // Only specific data- attributes from ALLOWED_ATTR
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
  FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover']
};

/**
 * Safely set innerHTML with XSS protection (Async version)
 * @param {HTMLElement} element - Target element
 * @param {string} html - HTML string to insert
 * @param {Object} config - DOMPurify configuration (optional)
 */
export const safeSetHTML = async (element, html, config = {}) => {
  try {
    const DOMPurify = await purifyReady;
    const clean = DOMPurify.sanitize(html, { ...DEFAULT_CONFIG, ...config });
    element.innerHTML = clean;
  } catch (error) {
    console.error('❌ DOMPurify error, falling back to textContent:', error);
    element.textContent = html; // Fallback to safe text
  }
};

/**
 * Safely set innerHTML with XSS protection (Synchronous version)
 * Use this if DOMPurify is already loaded
 * @param {HTMLElement} element - Target element
 * @param {string} html - HTML string to insert
 * @param {Object} config - DOMPurify configuration (optional)
 */
export const safeSetHTMLSync = (element, html, config = {}) => {
  if (!window.DOMPurify) {
    console.warn('⚠️ DOMPurify not loaded yet, falling back to textContent');
    element.textContent = html; // Fallback to pure text
    return;
  }
  
  try {
    const clean = window.DOMPurify.sanitize(html, { ...DEFAULT_CONFIG, ...config });
    element.innerHTML = clean;
  } catch (error) {
    console.error('❌ DOMPurify error, falling back to textContent:', error);
    element.textContent = html;
  }
};

/**
 * Safely set text content (for user-generated data without HTML)
 * This is the safest option - no HTML allowed
 * @param {HTMLElement} element - Target element
 * @param {string} text - Text to insert
 */
export const safeSetText = (element, text) => {
  element.textContent = text;
};

/**
 * Sanitize HTML string and return cleaned version
 * @param {string} html - HTML to sanitize
 * @param {Object} config - DOMPurify configuration (optional)
 * @returns {Promise<string>} Sanitized HTML
 */
export const sanitizeHTML = async (html, config = {}) => {
  try {
    const DOMPurify = await purifyReady;
    return DOMPurify.sanitize(html, { ...DEFAULT_CONFIG, ...config });
  } catch (error) {
    console.error('❌ DOMPurify error:', error);
    return ''; // Return empty string on error
  }
};

/**
 * Sanitize HTML string and return cleaned version (Synchronous)
 * @param {string} html - HTML to sanitize
 * @param {Object} config - DOMPurify configuration (optional)
 * @returns {string} Sanitized HTML
 */
export const sanitizeHTMLSync = (html, config = {}) => {
  if (!window.DOMPurify) {
    console.warn('⚠️ DOMPurify not loaded yet');
    return '';
  }
  
  try {
    return window.DOMPurify.sanitize(html, { ...DEFAULT_CONFIG, ...config });
  } catch (error) {
    console.error('❌ DOMPurify error:', error);
    return '';
  }
};

/**
 * Check if DOMPurify is ready
 * @returns {Promise<boolean>}
 */
export const isDOMPurifyReady = async () => {
  try {
    await purifyReady;
    return true;
  } catch {
    return false;
  }
};

// Pre-load DOMPurify on script load
purifyReady.catch(err => {
  console.error('❌ Failed to load DOMPurify:', err);
});

// Export for testing/debugging
export { purifyReady };
