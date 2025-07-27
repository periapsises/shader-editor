export class Notification {
    constructor() {
        this.element = null;
        this.timeout = null;
        this.init();
    }

    init() {
        this.createNotificationElement();
    }

    createNotificationElement() {
        this.element = document.createElement('div');
        this.element.className = 'notification';
        this.element.innerHTML = `
            <div class="notification-content">
                <span class="notification-message"></span>
                <button class="notification-close" aria-label="Close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(this.element);
        
        // Setup close button
        const closeBtn = this.element.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.hide();
        });
    }

    show(message, type = 'success', duration = 3000) {
        const messageEl = this.element.querySelector('.notification-message');
        messageEl.textContent = message;
        
        // Set type-specific styling
        this.element.className = `notification ${type}`;
        
        // Show notification
        this.element.classList.add('show');
        
        // Auto-hide after duration
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        
        if (duration > 0) {
            this.timeout = setTimeout(() => {
                this.hide();
            }, duration);
        }
    }

    hide() {
        this.element.classList.remove('show');
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }

    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    }

    error(message, duration = 5000) {
        this.show(message, 'error', duration);
    }

    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }

    destroy() {
        this.hide();
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
} 