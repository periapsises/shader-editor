/**
 * Debounce utility function
 * @param {Function} func - The function to debounce
 * @param {number} wait - The delay in milliseconds
 * @param {boolean} immediate - Whether to execute immediately
 * @returns {Function} The debounced function
 */
export function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

/**
 * Creates a debounced version of a method that can be called multiple times
 * @param {Function} method - The method to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} The debounced method
 */
export function createDebouncedMethod(method, delay = 500) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => method.apply(this, args), delay);
    };
} 