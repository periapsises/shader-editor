/**
 * ErrorConsole component for displaying shader compilation errors
 */
export class ErrorConsole {
    constructor() {
        this.errorElement = null;
        this.isVisible = false;
        this.init();
    }

    /**
     * Initialize the error console
     */
    init() {
        this.errorElement = document.getElementById('errorConsole');
        if (!this.errorElement) {
            console.warn('Error console element not found');
        }
    }

    /**
     * Show an error message
     * @param {string} message - The error message to display
     */
    showError(message) {
        if (!this.errorElement) return;
        
        this.errorElement.textContent = message;
        this.errorElement.classList.add('show');
        this.isVisible = true;
        
        // Scroll to bottom if there are multiple lines
        this.errorElement.scrollTop = this.errorElement.scrollHeight;
    }

    /**
     * Hide the error console
     */
    hideError() {
        if (!this.errorElement) return;
        
        this.errorElement.classList.remove('show');
        this.isVisible = false;
    }

    /**
     * Clear the error console
     */
    clearError() {
        if (!this.errorElement) return;
        
        this.errorElement.textContent = '';
        this.hideError();
    }

    /**
     * Check if error console is currently visible
     * @returns {boolean} True if visible, false otherwise
     */
    isErrorVisible() {
        return this.isVisible;
    }

    /**
     * Toggle error console visibility
     */
    toggleError() {
        if (this.isVisible) {
            this.hideError();
        } else if (this.errorElement && this.errorElement.textContent) {
            this.showError(this.errorElement.textContent);
        }
    }

    /**
     * Set error console max height
     * @param {number} height - The maximum height in pixels
     */
    setMaxHeight(height) {
        if (this.errorElement) {
            this.errorElement.style.maxHeight = `${height}px`;
        }
    }
} 