/**
 * TabManager component for handling shader editor tabs
 */
export class TabManager {
    constructor() {
        this.tabs = new Map();
        this.activeTab = null;
        this.init();
    }

    /**
     * Initialize the tab manager
     */
    init() {
        this.setupTabs();
        this.setupEventListeners();
    }

    /**
     * Setup tab elements
     */
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const editors = document.querySelectorAll('.editor');

        tabButtons.forEach(btn => {
            const shaderType = btn.dataset.shader;
            const editorElement = document.getElementById(`${shaderType}Editor`);
            
            if (editorElement) {
                this.tabs.set(shaderType, {
                    button: btn,
                    editor: editorElement,
                    isActive: btn.classList.contains('active')
                });

                if (btn.classList.contains('active')) {
                    this.activeTab = shaderType;
                }
            }
        });
    }

    /**
     * Setup event listeners for tab buttons
     */
    setupEventListeners() {
        this.tabs.forEach((tab, shaderType) => {
            tab.button.addEventListener('click', () => {
                this.switchToTab(shaderType);
            });
        });
    }

    /**
     * Switch to a specific tab
     * @param {string} shaderType - The shader type to switch to
     */
    switchToTab(shaderType) {
        if (!this.tabs.has(shaderType)) {
            console.warn(`Tab "${shaderType}" not found`);
            return;
        }

        // Deactivate all tabs
        this.tabs.forEach(tab => {
            tab.button.classList.remove('active');
            tab.editor.style.display = 'none';
            tab.isActive = false;
        });

        // Activate the selected tab
        const selectedTab = this.tabs.get(shaderType);
        selectedTab.button.classList.add('active');
        selectedTab.editor.style.display = 'block';
        selectedTab.isActive = true;
        
        this.activeTab = shaderType;

        // Trigger custom event
        this.dispatchTabChangeEvent(shaderType);
    }

    /**
     * Get the currently active tab
     * @returns {string|null} The active tab type or null if none
     */
    getActiveTab() {
        return this.activeTab;
    }

    /**
     * Check if a tab is active
     * @param {string} shaderType - The shader type to check
     * @returns {boolean} True if active, false otherwise
     */
    isTabActive(shaderType) {
        return this.activeTab === shaderType;
    }

    /**
     * Get all available tabs
     * @returns {Array<string>} Array of tab types
     */
    getAvailableTabs() {
        return Array.from(this.tabs.keys());
    }

    /**
     * Add a new tab
     * @param {string} shaderType - The shader type
     * @param {HTMLElement} button - The tab button element
     * @param {HTMLElement} editor - The editor element
     */
    addTab(shaderType, button, editor) {
        this.tabs.set(shaderType, {
            button: button,
            editor: editor,
            isActive: false
        });

        // Setup event listener for new tab
        button.addEventListener('click', () => {
            this.switchToTab(shaderType);
        });
    }

    /**
     * Remove a tab
     * @param {string} shaderType - The shader type to remove
     */
    removeTab(shaderType) {
        if (this.tabs.has(shaderType)) {
            const tab = this.tabs.get(shaderType);
            tab.button.remove();
            tab.editor.remove();
            this.tabs.delete(shaderType);

            // If removing active tab, switch to first available
            if (this.activeTab === shaderType) {
                const firstTab = this.tabs.keys().next().value;
                if (firstTab) {
                    this.switchToTab(firstTab);
                } else {
                    this.activeTab = null;
                }
            }
        }
    }

    /**
     * Dispatch a custom tab change event
     * @param {string} shaderType - The newly active shader type
     */
    dispatchTabChangeEvent(shaderType) {
        const event = new CustomEvent('tabChanged', {
            detail: { shaderType, previousTab: this.activeTab }
        });
        document.dispatchEvent(event);
    }
} 
