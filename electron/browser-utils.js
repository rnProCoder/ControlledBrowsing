/**
 * Utility functions for the browser functionality in the Electron app
 */

/**
 * Extract domain from a URL
 * @param {string} url - The URL to extract domain from
 * @returns {string} - The extracted domain
 */
function getDomainFromUrl(url) {
  try {
    if (!url) return '';
    if (!url.includes('://')) {
      url = 'https://' + url;
    }
    return new URL(url).hostname;
  } catch (error) {
    return url;
  }
}

/**
 * Get a friendly page title from URL
 * @param {string} url - The URL to create a title for
 * @returns {string} - A user-friendly title
 */
function getPageTitleFromUrl(url) {
  const domain = getDomainFromUrl(url);
  if (!domain) return 'New Tab';
  
  // Remove www. prefix if present
  let title = domain.replace(/^www\./, '');
  
  // Handle specific known domains with better titles
  const domainTitleMap = {
    'google.com': 'Google',
    'youtube.com': 'YouTube',
    'facebook.com': 'Facebook',
    'wikipedia.org': 'Wikipedia',
    'amazon.com': 'Amazon',
    'twitter.com': 'Twitter',
    'instagram.com': 'Instagram',
    'microsoft.com': 'Microsoft',
    'github.com': 'GitHub',
    'stackoverflow.com': 'Stack Overflow',
    'linkedin.com': 'LinkedIn',
    'reddit.com': 'Reddit',
    'bbc.com': 'BBC',
    'nytimes.com': 'The New York Times',
  };
  
  if (domainTitleMap[title]) {
    return domainTitleMap[title];
  }
  
  // First letter uppercase for general domains
  return title.charAt(0).toUpperCase() + title.slice(1);
}

/**
 * Get the app window title based on the current page
 * @param {string} url - The URL of the current page
 * @param {string} pageTitle - The page title if available
 * @returns {string} - The window title
 */
function getWindowTitle(url, pageTitle) {
  if (!url) return 'BrowseControl';
  const domain = getDomainFromUrl(url);
  
  if (pageTitle) {
    return `${pageTitle} - BrowseControl`;
  }
  
  const derivedTitle = getPageTitleFromUrl(url);
  return `${derivedTitle} - BrowseControl`;
}

module.exports = {
  getDomainFromUrl,
  getPageTitleFromUrl,
  getWindowTitle
};