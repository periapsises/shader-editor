/**
 * CanvasSettings - Manages canvas configuration options
 */
export class CanvasSettings {
    constructor(renderer) {
        this.renderer = renderer;
        this.settings = {
            width: 512,
            height: 512,
            background: 'transparent',
            quality: 1,
            filtering: 'nearest'
        };
        
        this.animationState = {
            isPlaying: true,
            resetOnCompile: true
        };
        
        this.loadSettings();
        this.init();
    }

    /**
     * Initialize canvas settings UI
     */
    init() {
        this.setupEventListeners();
        this.updateUI();
        this.applySettings();
    }

    /**
     * Setup event listeners for canvas settings controls
     */
    setupEventListeners() {
        const canvasWidth = document.getElementById('canvasWidth');
        const canvasHeight = document.getElementById('canvasHeight');
        const canvasBackground = document.getElementById('canvasBackground');
        const renderQuality = document.getElementById('renderQuality');
        const canvasFilterSelect = document.getElementById('canvasFilterSelect');

        if (canvasWidth) {
            canvasWidth.addEventListener('change', (e) => {
                this.updateSetting('width', parseInt(e.target.value));
            });
        }

        if (canvasHeight) {
            canvasHeight.addEventListener('change', (e) => {
                this.updateSetting('height', parseInt(e.target.value));
            });
        }

        if (canvasBackground) {
            canvasBackground.addEventListener('change', (e) => {
                this.updateSetting('background', e.target.value);
            });
        }

        if (renderQuality) {
            renderQuality.addEventListener('change', (e) => {
                this.updateSetting('quality', parseInt(e.target.value));
            });
        }

        if (canvasFilterSelect) {
            canvasFilterSelect.addEventListener('change', (e) => {
                this.updateSetting('filtering', e.target.value);
            });
        }

        // Resolution preset buttons
        const presetButtons = document.querySelectorAll('.preset-btn');
        presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const width = parseInt(btn.dataset.width);
                const height = parseInt(btn.dataset.height);
                this.setResolution(width, height);
            });
        });

        // Animation controls
        const playPauseBtn = document.getElementById('playPauseBtn');
        const resetTimeBtn = document.getElementById('resetTimeBtn');
        const resetOnCompile = document.getElementById('resetOnCompile');

        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                this.toggleAnimation();
            });
        }

        if (resetTimeBtn) {
            resetTimeBtn.addEventListener('click', () => {
                this.resetTime();
            });
        }

        if (resetOnCompile) {
            resetOnCompile.addEventListener('change', (e) => {
                this.animationState.resetOnCompile = e.target.checked;
                this.saveAnimationState();
                this.dispatchAnimationEvent('timeResetOnCompileChanged', {
                    enabled: e.target.checked
                });
            });
        }
    }

    /**
     * Update a specific setting
     */
    updateSetting(key, value) {
        this.settings[key] = value;
        this.applySettings();
        this.saveSettings();
        
        // Dispatch canvasSettingsChanged event for autosave
        const event = new CustomEvent('canvasSettingsChanged', {
            detail: { setting: key, value: value }
        });
        document.dispatchEvent(event);
    }

    /**
     * Set resolution and update UI
     */
    setResolution(width, height) {
        this.settings.width = width;
        this.settings.height = height;
        this.updateUI();
        this.applySettings();
        this.saveSettings();
        
        // Dispatch resolution changed event
        this.dispatchAnimationEvent('resolutionChanged', { width, height });
    }

    /**
     * Toggle animation play/pause
     */
    toggleAnimation() {
        this.animationState.isPlaying = !this.animationState.isPlaying;
        this.updateAnimationUI();
        this.saveAnimationState();
        
        this.dispatchAnimationEvent('animationToggled', {
            isPlaying: this.animationState.isPlaying
        });
    }

    /**
     * Reset animation time
     */
    resetTime() {
        this.dispatchAnimationEvent('animationReset', {});
    }

    /**
     * Dispatch animation-related events
     */
    dispatchAnimationEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    /**
     * Apply current settings to the canvas
     */
    applySettings() {
        if (!this.renderer) return;

        const canvas = this.renderer.canvas;
        if (!canvas) return;

        // Update canvas resolution (internal rendering size)
        const { width, height, quality } = this.settings;
        const actualWidth = width * quality;
        const actualHeight = height * quality;

        canvas.width = actualWidth;
        canvas.height = actualHeight;

        // Set aspect ratio using CSS custom property for responsive scaling
        const aspectRatio = width / height;
        canvas.style.setProperty('--canvas-aspect-ratio', aspectRatio);

        // Update WebGL viewport
        if (this.renderer.gl) {
            this.renderer.gl.viewport(0, 0, actualWidth, actualHeight);
        }

        // Apply background styling
        this.applyBackgroundStyle();

        // Apply texture filtering
        this.applyFilteringStyle();

        // Dispatch filtering changed event for the renderer
        this.dispatchAnimationEvent('canvasFilteringChanged', { mode: this.settings.filtering });

        // Trigger a re-render if the renderer has a compile method
        if (typeof this.renderer.compile === 'function') {
            this.renderer.compile();
        }
    }

    /**
     * Apply background styling based on settings
     */
    applyBackgroundStyle() {
        const canvas = this.renderer.canvas;
        if (!canvas) return;

        const { background } = this.settings;
        
        switch (background) {
            case 'black':
                canvas.style.background = '#000000';
                break;
            case 'white':
                canvas.style.background = '#ffffff';
                break;
            case 'checkerboard':
                canvas.style.background = 'url("data:image/svg+xml,%3csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3e%3cdefs%3e%3cpattern id=\'a\' patternUnits=\'userSpaceOnUse\' width=\'20\' height=\'20\'%3e%3crect fill=\'%23f0f0f0\' width=\'10\' height=\'10\'/%3e%3crect fill=\'%23e0e0e0\' x=\'10\' y=\'10\' width=\'10\' height=\'10\'/%3e%3c/pattern%3e%3c/defs%3e%3crect width=\'100%25\' height=\'100%25\' fill=\'url(%23a)\'/%3e%3c/svg%3e")';
                break;
            case 'transparent':
            default:
                canvas.style.background = 'transparent';
                break;
        }
    }

    /**
     * Apply texture filtering based on settings
     */
    applyFilteringStyle() {
        const canvas = this.renderer.canvas;
        if (!canvas) return;

        const { filtering } = this.settings;
        
        switch (filtering) {
            case 'linear':
                canvas.style.imageRendering = 'auto';
                break;
            case 'nearest':
            default:
                canvas.style.imageRendering = 'pixelated';
                break;
        }
    }

    /**
     * Update UI elements to reflect current settings
     */
    updateUI() {
        const canvasWidth = document.getElementById('canvasWidth');
        const canvasHeight = document.getElementById('canvasHeight');
        const canvasBackground = document.getElementById('canvasBackground');
        const renderQuality = document.getElementById('renderQuality');
        const canvasFilterSelect = document.getElementById('canvasFilterSelect');

        if (canvasWidth) canvasWidth.value = this.settings.width;
        if (canvasHeight) canvasHeight.value = this.settings.height;
        if (canvasBackground) canvasBackground.value = this.settings.background;
        if (renderQuality) renderQuality.value = this.settings.quality;
        if (canvasFilterSelect) canvasFilterSelect.value = this.settings.filtering;
        
        this.updateAnimationUI();
    }

    /**
     * Update animation UI elements
     */
    updateAnimationUI() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const resetOnCompile = document.getElementById('resetOnCompile');

        if (playPauseBtn) {
            playPauseBtn.textContent = this.animationState.isPlaying ? '⏸' : '▶';
            playPauseBtn.title = this.animationState.isPlaying ? 'Pause animation' : 'Play animation';
        }

        if (resetOnCompile) {
            resetOnCompile.checked = this.animationState.resetOnCompile;
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('canvasSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save canvas settings:', error);
        }
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('canvasSettings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('Failed to load canvas settings:', error);
        }
        
        this.loadAnimationState();
    }

    /**
     * Save animation state to localStorage
     */
    saveAnimationState() {
        try {
            localStorage.setItem('animationState', JSON.stringify(this.animationState));
        } catch (error) {
            console.warn('Failed to save animation state:', error);
        }
    }

    /**
     * Load animation state from localStorage
     */
    loadAnimationState() {
        try {
            const saved = localStorage.getItem('animationState');
            if (saved) {
                this.animationState = { ...this.animationState, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('Failed to load animation state:', error);
        }
    }

    /**
     * Get current settings
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Export settings for saving
     * @returns {Object} Exportable settings
     */
    exportSettings() {
        return {
            ...this.settings,
            animation: { ...this.animationState }
        };
    }

    /**
     * Import settings from saved data
     * @param {Object} data - Settings data to import
     */
    importSettings(data) {
        if (data) {
            this.settings = { ...this.settings, ...data };
            if (data.animation) {
                this.animationState = { ...this.animationState, ...data.animation };
            }
            this.applySettings();
            this.updateUI();
            this.updateAnimationUI();
        }
    }

    /**
     * Reset settings to defaults
     */
    resetToDefaults() {
        this.settings = {
            width: 512,
            height: 512,
            background: 'transparent',
            quality: 1,
            filtering: 'nearest'
        };
        this.updateUI();
        this.applySettings();
        this.saveSettings();
    }
} 