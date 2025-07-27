export class UnsavedChangesDialog {
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
        this.element.className = 'unsaved-changes-dialog';
        this.element.innerHTML = `
            <div class="dialog-overlay">
                <div class="dialog-content">
                    <div class="dialog-header">
                        <h3>Unsaved Changes</h3>
                        <button class="close-btn" aria-label="Close">&times;</button>
                    </div>
                    <div class="dialog-body">
                        <p>You have unsaved changes. What would you like to do?</p>
                    </div>
                    <div class="dialog-footer">
                        <button class="cancel-btn">Cancel</button>
                        <button class="dont-save-btn">Don't Save</button>
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
        const dontSaveBtn = this.element.querySelector('.dont-save-btn');
        const saveBtn = this.element.querySelector('.save-btn');

        // Close button
        closeBtn.addEventListener('click', () => {
            this.hide();
        });

        // Cancel button
        cancelBtn.addEventListener('click', () => {
            this.hide();
        });

        // Don't save button
        dontSaveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Don\'t save button clicked!');
            
            this.isResolved = true;
            if (this.resolvePromise) {
                this.resolvePromise('dont-save');
            }
            this.hide();
        });

        // Save button
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Save button clicked!');
            
            this.isResolved = true;
            if (this.resolvePromise) {
                this.resolvePromise('save');
            }
            this.hide();
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.element.classList.contains('show')) {
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

    show() {
        console.log('UnsavedChangesDialog.show() called');
        return new Promise((resolve, reject) => {
            this.resolvePromise = resolve;
            this.rejectPromise = reject;
            this.isResolved = false;
            
            this.element.classList.add('show');
            console.log('Dialog show class added, element:', this.element);
        });
    }

    hide() {
        this.element.classList.remove('show');
        
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