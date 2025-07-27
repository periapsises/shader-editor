/**
 * Controls component for handling UI controls
 */
export class Controls {
    constructor() {
        this.elements = new Map();
        this.eventListeners = new Map();
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.init();
    }

    /**
     * Initialize the controls
     */
    init() {
        this.setupControlElements();
        this.setupEventListeners();
        
        // Initialize record controls visibility
        this.setRecordingState(false);
    }

    /**
     * Setup control elements
     */
    setupControlElements() {
        // Auto-compile checkbox
        const autoCompileCheckbox = document.getElementById('autoCompile');
        if (autoCompileCheckbox) {
            this.elements.set('autoCompile', autoCompileCheckbox);
        }

        // Compile button
        const compileBtn = document.getElementById('compileBtn');
        if (compileBtn) {
            this.elements.set('compileBtn', compileBtn);
        }

        // Reset button
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            this.elements.set('resetBtn', resetBtn);
        }

        // Save button
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            this.elements.set('saveBtn', saveBtn);
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            this.elements.set('exportBtn', exportBtn);
        }

        // Load button
        const loadBtn = document.getElementById('loadBtn');
        if (loadBtn) {
            this.elements.set('loadBtn', loadBtn);
        }

        // Load input
        const loadInput = document.getElementById('loadInput');
        if (loadInput) {
            this.elements.set('loadInput', loadInput);
        }

        // Examples button
        const examplesBtn = document.getElementById('examplesBtn');
        if (examplesBtn) {
            this.elements.set('examplesBtn', examplesBtn);
        }

        // Screenshot button
        const screenshotBtn = document.getElementById('screenshotBtn');
        if (screenshotBtn) {
            this.elements.set('screenshotBtn', screenshotBtn);
        }

        // Record button
        const recordBtn = document.getElementById('recordBtn');
        if (recordBtn) {
            this.elements.set('recordBtn', recordBtn);
        }

        // Record controls
        const recordControls = document.getElementById('recordControls');
        if (recordControls) {
            this.elements.set('recordControls', recordControls);
        }

        // Record duration
        const recordDuration = document.getElementById('recordDuration');
        if (recordDuration) {
            this.elements.set('recordDuration', recordDuration);
        }

        // Pan/zoom toggle
        const panZoomToggle = document.getElementById('panZoomToggle');
        if (panZoomToggle) {
            this.elements.set('panZoomToggle', panZoomToggle);
        }

        // Reset view button
        const resetViewBtn = document.getElementById('resetViewBtn');
        if (resetViewBtn) {
            this.elements.set('resetViewBtn', resetViewBtn);
        }

        // Autosave toggle
        const autosaveToggle = document.getElementById('autosaveToggle');
        if (autosaveToggle) {
            this.elements.set('autosaveToggle', autosaveToggle);
        }

        // Autosave interval selector
        const autosaveInterval = document.getElementById('autosaveInterval');
        if (autosaveInterval) {
            this.elements.set('autosaveInterval', autosaveInterval);
        }

        // Menu buttons
        const fileMenuBtn = document.getElementById('fileMenuBtn');
        if (fileMenuBtn) {
            this.elements.set('fileMenuBtn', fileMenuBtn);
        }

        const toolsMenuBtn = document.getElementById('toolsMenuBtn');
        if (toolsMenuBtn) {
            this.elements.set('toolsMenuBtn', toolsMenuBtn);
        }

        const settingsMenuBtn = document.getElementById('settingsMenuBtn');
        if (settingsMenuBtn) {
            this.elements.set('settingsMenuBtn', settingsMenuBtn);
        }

        // Menu panels
        const fileMenuPanel = document.getElementById('fileMenuPanel');
        if (fileMenuPanel) {
            this.elements.set('fileMenuPanel', fileMenuPanel);
        }

        const toolsMenuPanel = document.getElementById('toolsMenuPanel');
        if (toolsMenuPanel) {
            this.elements.set('toolsMenuPanel', toolsMenuPanel);
        }

        const settingsMenuPanel = document.getElementById('settingsMenuPanel');
        if (settingsMenuPanel) {
            this.elements.set('settingsMenuPanel', settingsMenuPanel);
        }




    }

    /**
     * Setup event listeners for controls
     */
    setupEventListeners() {
        // Auto-compile checkbox
        const autoCompileCheckbox = this.elements.get('autoCompile');
        if (autoCompileCheckbox) {
            const listener = (e) => {
                this.onAutoCompileChange(e.target.checked);
            };
            autoCompileCheckbox.addEventListener('change', listener);
            this.eventListeners.set('autoCompile', listener);
        }

        // Compile button
        const compileBtn = this.elements.get('compileBtn');
        if (compileBtn) {
            const listener = () => {
                this.onCompileClick();
            };
            compileBtn.addEventListener('click', listener);
            this.eventListeners.set('compileBtn', listener);
        }

        // Reset button
        const resetBtn = this.elements.get('resetBtn');
        if (resetBtn) {
            const listener = () => {
                this.onResetClick();
            };
            resetBtn.addEventListener('click', listener);
            this.eventListeners.set('resetBtn', listener);
        }

        // Save button
        const saveBtn = this.elements.get('saveBtn');
        if (saveBtn) {
            const listener = () => {
                this.onSaveClick('combined'); // Default to combined save
            };
            saveBtn.addEventListener('click', listener);
            this.eventListeners.set('saveBtn', listener);
        }

        // Note: Old save dropdown functionality removed - now using menu system

        // Export button
        const exportBtn = this.elements.get('exportBtn');
        if (exportBtn) {
            const listener = () => {
                this.onExportClick();
            };
            exportBtn.addEventListener('click', listener);
            this.eventListeners.set('exportBtn', listener);
        }

        // Load button
        const loadBtn = this.elements.get('loadBtn');
        if (loadBtn) {
            const listener = () => {
                this.onLoadClick();
            };
            loadBtn.addEventListener('click', listener);
            this.eventListeners.set('loadBtn', listener);
        }

        // Load input
        const loadInput = this.elements.get('loadInput');
        if (loadInput) {
            const listener = (e) => {
                this.onLoadInputChange(e);
            };
            loadInput.addEventListener('change', listener);
            this.eventListeners.set('loadInput', listener);
        }

        // Examples button
        const examplesBtn = this.elements.get('examplesBtn');
        if (examplesBtn) {
            const listener = () => {
                this.onExamplesClick();
            };
            examplesBtn.addEventListener('click', listener);
            this.eventListeners.set('examplesBtn', listener);
        }

        // Screenshot button
        const screenshotBtn = this.elements.get('screenshotBtn');
        if (screenshotBtn) {
            const listener = () => {
                this.onScreenshotClick();
            };
            screenshotBtn.addEventListener('click', listener);
            this.eventListeners.set('screenshotBtn', listener);
        }

        // Record button
        const recordBtn = this.elements.get('recordBtn');
        if (recordBtn) {
            const listener = () => {
                this.onRecordClick();
            };
            recordBtn.addEventListener('click', listener);
            this.eventListeners.set('recordBtn', listener);
        }

        // Pan/zoom toggle
        const panZoomToggle = this.elements.get('panZoomToggle');
        if (panZoomToggle) {
            const listener = (e) => {
                this.onPanZoomToggle(e.target.checked);
            };
            panZoomToggle.addEventListener('change', listener);
            this.eventListeners.set('panZoomToggle', listener);
        }

        // Reset view button
        const resetViewBtn = this.elements.get('resetViewBtn');
        if (resetViewBtn) {
            const listener = () => {
                this.onResetViewClick();
            };
            resetViewBtn.addEventListener('click', listener);
            this.eventListeners.set('resetViewBtn', listener);
        }

        // Autosave toggle
        const autosaveToggle = this.elements.get('autosaveToggle');
        if (autosaveToggle) {
            const listener = (e) => {
                this.onAutosaveToggle(e.target.checked);
            };
            autosaveToggle.addEventListener('change', listener);
            this.eventListeners.set('autosaveToggle', listener);
        }

        // Autosave interval selector
        const autosaveInterval = this.elements.get('autosaveInterval');
        if (autosaveInterval) {
            const listener = (e) => {
                this.onAutosaveIntervalChange(parseFloat(e.target.value));
            };
            autosaveInterval.addEventListener('change', listener);
            this.eventListeners.set('autosaveInterval', listener);
        }

        // Menu buttons
        const fileMenuBtn = this.elements.get('fileMenuBtn');
        if (fileMenuBtn) {
            const listener = (e) => {
                e.stopPropagation();
                this.toggleMenu('file');
            };
            fileMenuBtn.addEventListener('click', listener);
            this.eventListeners.set('fileMenuBtn', listener);
        }

        const toolsMenuBtn = this.elements.get('toolsMenuBtn');
        if (toolsMenuBtn) {
            const listener = (e) => {
                e.stopPropagation();
                this.toggleMenu('tools');
            };
            toolsMenuBtn.addEventListener('click', listener);
            this.eventListeners.set('toolsMenuBtn', listener);
        }

        const settingsMenuBtn = this.elements.get('settingsMenuBtn');
        if (settingsMenuBtn) {
            const listener = (e) => {
                e.stopPropagation();
                this.toggleMenu('settings');
            };
            settingsMenuBtn.addEventListener('click', listener);
            this.eventListeners.set('settingsMenuBtn', listener);
        }

        // Save dropdown items in the new menu
        const fileMenuPanel = this.elements.get('fileMenuPanel');
        if (fileMenuPanel) {
            const listener = (e) => {
                if (e.target.classList.contains('menu-item-small')) {
                    const saveType = e.target.dataset.saveType;
                    this.onSaveClick(saveType);
                    this.hideAllMenus();
                }
            };
            fileMenuPanel.addEventListener('click', listener);
            this.eventListeners.set('fileMenuPanel', listener);
        }





        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.toolbar-menu')) {
                this.hideAllMenus();
            }
        });

        // Close menus when pressing escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllMenus();
            }
        });
    }

    /**
     * Handle auto-compile change
     * @param {boolean} enabled - Whether auto-compile is enabled
     */
    onAutoCompileChange(enabled) {
        this.dispatchEvent('autoCompileChanged', { enabled });
    }

    /**
     * Handle compile button click
     */
    onCompileClick() {
        this.dispatchEvent('compileRequested');
    }

    /**
     * Handle reset button click
     */
    onResetClick() {
        this.dispatchEvent('resetRequested');
    }

    /**
     * Handle save button click
     * @param {string} saveType - Type of save: 'combined', 'fragment', or 'vertex'
     */
    onSaveClick(saveType = 'combined') {
        this.dispatchEvent('shaderSaveRequested', { saveType });
    }

    // Note: Old save dropdown methods removed - now using menu system

    /**
     * Handle export button click
     */
    onExportClick() {
        this.dispatchEvent('projectExportRequested');
    }

    /**
     * Handle load button click
     */
    onLoadClick() {
        const loadInput = this.elements.get('loadInput');
        if (loadInput) {
            loadInput.click();
        }
    }

    /**
     * Handle examples button click
     */
    onExamplesClick() {
        const event = new CustomEvent('examplesRequested');
        document.dispatchEvent(event);
    }

    /**
     * Handle load input change
     * @param {Event} event - File input change event
     */
    onLoadInputChange(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    this.dispatchEvent('loadRequested', { data });
                } catch (error) {
                    console.error('Failed to parse project file:', error);
                    alert('Invalid project file format');
                }
            };
            reader.readAsText(file);
        }
        // Reset the input so the same file can be loaded again
        event.target.value = '';
    }

    /**
     * Handle screenshot button click
     */
    onScreenshotClick() {
        this.dispatchEvent('screenshotRequested');
    }

    /**
     * Handle record button click
     */
    onRecordClick() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    /**
     * Handle pan/zoom toggle change
     * @param {boolean} enabled - Whether pan/zoom is enabled
     */
    onPanZoomToggle(enabled) {
        this.dispatchEvent('panZoomToggled', { enabled });
    }

    /**
     * Handle reset view button click
     */
    onResetViewClick() {
        this.dispatchEvent('viewResetRequested');
    }

    /**
     * Handle autosave toggle change
     * @param {boolean} enabled - Whether autosave is enabled
     */
    onAutosaveToggle(enabled) {
        this.dispatchEvent('autosaveToggled', { enabled });
    }

    /**
     * Handle autosave interval change
     * @param {number} intervalMinutes - Autosave interval in minutes
     */
    onAutosaveIntervalChange(intervalMinutes) {
        this.dispatchEvent('autosaveIntervalChanged', { intervalMinutes });
    }

    /**
     * Start video recording
     */
    startRecording() {
        const recordDuration = this.elements.get('recordDuration');
        const duration = recordDuration ? parseInt(recordDuration.value) : 5;
        
        this.dispatchEvent('recordingStarted', { duration });
    }

    /**
     * Stop video recording
     */
    stopRecording() {
        this.dispatchEvent('recordingStopped');
    }

    /**
     * Update recording state
     * @param {boolean} isRecording - Whether recording is active
     */
    setRecordingState(isRecording) {
        this.isRecording = isRecording;
        const recordBtn = this.elements.get('recordBtn');
        const recordControls = this.elements.get('recordControls');
        
        if (recordBtn) {
            if (isRecording) {
                recordBtn.classList.add('recording');
                
                // Update text and icon if they exist (handle both toolbar and menu structures)
                const btnText = recordBtn.querySelector('.btn-text') || recordBtn.querySelector('.menu-text');
                const btnIcon = recordBtn.querySelector('.btn-icon') || recordBtn.querySelector('.menu-icon');
                
                if (btnText) btnText.textContent = 'Stop';
                if (btnIcon) btnIcon.textContent = '⏹';
                recordBtn.title = 'Stop recording';
            } else {
                recordBtn.classList.remove('recording');
                
                // Update text and icon if they exist (handle both toolbar and menu structures)
                const btnText = recordBtn.querySelector('.btn-text') || recordBtn.querySelector('.menu-text');
                const btnIcon = recordBtn.querySelector('.btn-icon') || recordBtn.querySelector('.menu-icon');
                
                if (btnText) btnText.textContent = 'Record Video';
                if (btnIcon) btnIcon.textContent = '🎥';
                recordBtn.title = 'Record video';
            }
        }

        if (recordControls) {
            recordControls.style.display = isRecording ? 'none' : 'flex';
        }
    }

    /**
     * Get the auto-compile state
     * @returns {boolean} True if auto-compile is enabled
     */
    isAutoCompileEnabled() {
        const checkbox = this.elements.get('autoCompile');
        return checkbox ? checkbox.checked : false;
    }

    /**
     * Set the auto-compile state
     * @param {boolean} enabled - Whether to enable auto-compile
     */
    setAutoCompileEnabled(enabled) {
        const checkbox = this.elements.get('autoCompile');
        if (checkbox) {
            checkbox.checked = enabled;
        }
    }

    /**
     * Get the pan/zoom state
     * @returns {boolean} True if pan/zoom is enabled
     */
    isPanZoomEnabled() {
        const checkbox = this.elements.get('panZoomToggle');
        return checkbox ? checkbox.checked : false;
    }

    /**
     * Set the pan/zoom state
     * @param {boolean} enabled - Whether to enable pan/zoom
     */
    setPanZoomEnabled(enabled) {
        const checkbox = this.elements.get('panZoomToggle');
        if (checkbox) {
            checkbox.checked = enabled;
        }
    }

    /**
     * Get the autosave state
     * @returns {boolean} True if autosave is enabled
     */
    isAutosaveEnabled() {
        const checkbox = this.elements.get('autosaveToggle');
        return checkbox ? checkbox.checked : false;
    }

    /**
     * Set the autosave state
     * @param {boolean} enabled - Whether to enable autosave
     */
    setAutosaveEnabled(enabled) {
        const checkbox = this.elements.get('autosaveToggle');
        if (checkbox) {
            checkbox.checked = enabled;
        }
    }

    /**
     * Get the autosave interval
     * @returns {number} Autosave interval in minutes
     */
    getAutosaveInterval() {
        const select = this.elements.get('autosaveInterval');
        return select ? parseFloat(select.value) : 1;
    }

    /**
     * Set the autosave interval
     * @param {number} intervalMinutes - Autosave interval in minutes
     */
    setAutosaveInterval(intervalMinutes) {
        const select = this.elements.get('autosaveInterval');
        if (select) {
            select.value = intervalMinutes.toString();
        }
    }

    /**
     * Enable or disable a control
     * @param {string} controlName - The name of the control
     * @param {boolean} enabled - Whether to enable the control
     */
    setControlEnabled(controlName, enabled) {
        const element = this.elements.get(controlName);
        if (element) {
            element.disabled = !enabled;
        }
    }

    /**
     * Add a custom control
     * @param {string} name - The control name
     * @param {HTMLElement} element - The control element
     * @param {string} event - The event to listen for
     * @param {Function} handler - The event handler
     */
    addControl(name, element, event, handler) {
        this.elements.set(name, element);
        element.addEventListener(event, handler);
        this.eventListeners.set(name, handler);
    }

    /**
     * Remove a control
     * @param {string} name - The control name
     */
    removeControl(name) {
        const element = this.elements.get(name);
        const listener = this.eventListeners.get(name);
        
        if (element && listener) {
            element.removeEventListener('click', listener);
            element.removeEventListener('change', listener);
        }
        
        this.elements.delete(name);
        this.eventListeners.delete(name);
    }

    /**
     * Toggle menu visibility
     * @param {string} menuName - The menu to toggle ('file', 'tools', 'settings')
     */
    toggleMenu(menuName) {
        const panel = this.elements.get(`${menuName}MenuPanel`);
        const button = this.elements.get(`${menuName}MenuBtn`);
        
        if (!panel || !button) return;

        const isVisible = panel.classList.contains('show');
        
        // Hide all other menus first
        this.hideAllMenus();
        
        if (!isVisible) {
            // Show this menu
            panel.classList.add('show');
            button.classList.add('active');
        }
    }

    /**
     * Hide all menus
     */
    hideAllMenus() {
        const menus = ['file', 'tools', 'settings'];
        
        menus.forEach(menuName => {
            const panel = this.elements.get(`${menuName}MenuPanel`);
            const button = this.elements.get(`${menuName}MenuBtn`);
            
            if (panel) {
                panel.classList.remove('show');
            }
            if (button) {
                button.classList.remove('active');
            }
        });
    }





    /**
     * Dispatch a custom event
     * @param {string} eventName - The event name
     * @param {Object} detail - The event detail data
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        this.elements.forEach((element, name) => {
            const listener = this.eventListeners.get(name);
            if (listener) {
                element.removeEventListener('click', listener);
                element.removeEventListener('change', listener);
            }
        });
        
        this.elements.clear();
        this.eventListeners.clear();
    }
} 
