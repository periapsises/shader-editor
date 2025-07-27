export class ProjectNameDialog {
    constructor() {
        this.element = null;
        this.resolvePromise = null;
        this.rejectPromise = null;
        this.isResolved = false;
        this.init();
    }

    init() {
        this.createDialogElement();
        this.setupEventListeners();
    }

    createDialogElement() {
        this.element = document.createElement('div');
        this.element.className = 'project-name-dialog';
        this.element.innerHTML = `
            <div class="dialog-overlay">
                <div class="dialog-content">
                    <div class="dialog-header">
                        <h3>Save Project</h3>
                        <button class="close-btn" aria-label="Close">&times;</button>
                    </div>
                    <div class="dialog-body">
                        <label for="project-name-input">Project Name:</label>
                        <input type="text" id="project-name-input" placeholder="Enter project name..." />
                    </div>
                    <div class="dialog-footer">
                        <button class="cancel-btn">Cancel</button>
                        <button class="save-btn">Save</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.element);
    }

    setupEventListeners() {
        const closeBtn = this.element.querySelector('.close-btn');
        const cancelBtn = this.element.querySelector('.cancel-btn');
        const saveBtn = this.element.querySelector('.save-btn');
        const input = this.element.querySelector('#project-name-input');

        // Ensure elements exist
        if (!closeBtn || !cancelBtn || !saveBtn || !input) {
            console.error('Dialog elements not found:', { closeBtn, cancelBtn, saveBtn, input });
            return;
        }

        // Close button
        closeBtn.addEventListener('click', () => {
            this.hide();
        });

        // Cancel button
        cancelBtn.addEventListener('click', () => {
            this.hide();
        });

        // Save button - multiple event listeners for better compatibility
        const handleSave = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const projectName = input.value.trim();
            if (projectName) {
                // Add visual feedback
                saveBtn.classList.add('clicked');
                setTimeout(() => {
                    saveBtn.classList.remove('clicked');
                    this.isResolved = true;
                    if (this.resolvePromise) {
                        this.resolvePromise(projectName);
                    }
                    this.hide();
                }, 150);
            } else {
                input.focus();
            }
        };

        saveBtn.addEventListener('click', handleSave);
        saveBtn.addEventListener('mousedown', handleSave);

        // Enter key
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            } else if (e.key === 'Escape') {
                this.hide();
            }
        });

        // Click outside to close
        this.element.querySelector('.dialog-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hide();
            }
        });
    }

    show(defaultName = '') {
        return new Promise((resolve, reject) => {
            this.resolvePromise = resolve;
            this.rejectPromise = reject;
            this.isResolved = false;
            
            const input = this.element.querySelector('#project-name-input');
            input.value = defaultName;
            input.focus();
            input.select();
            
            this.element.classList.add('show');
        });
    }

    hide() {
        this.element.classList.remove('show');
        
        // Only reject if we haven't already resolved
        if (this.rejectPromise && !this.isResolved) {
            this.rejectPromise(new Error('Dialog cancelled'));
        }
        
        this.resolvePromise = null;
        this.rejectPromise = null;
        this.isResolved = false;
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
} 