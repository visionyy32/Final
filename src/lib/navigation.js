// This file will hold our direct navigation functions

/**
 * Navigate to a specific page
 * @param {string} page - The page to navigate to
 */
export const navigateTo = (page) => {
  // Store the page in localStorage for persistence across page reloads
  localStorage.setItem('currentPage', page);
  
  // Trigger a custom event to notify the App component of page change
  const event = new CustomEvent('navigate', { detail: { page } });
  window.dispatchEvent(event);
  
  // Scroll to top of page for better user experience
  window.scrollTo(0, 0);
};

/**
 * Get the current page from localStorage
 * @returns {string} The current page or 'landing' if none is stored
 */
export const getCurrentPage = () => {
  return localStorage.getItem('currentPage') || 'landing';
};

/**
 * Clear the current page from localStorage
 */
export const clearCurrentPage = () => {
  localStorage.removeItem('currentPage');
};
