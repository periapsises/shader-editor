/**
 * PanelManager - Handles resizable panels with splitter and collapsible uniform overlay
 */
export class PanelManager {
    constructor() {
        this.splitter = null;
        this.isDragging = false;
        this.dragData = null;
        this.uniformOverlay = null;
        
        // Simplified layout configuration (just editor/canvas split)
        this.layoutConfig = {
            leftWidth: 50  // Left panel percentage (editor), right gets remainder
        };
        
        this.init();
    }

    /**
     * Initialize the panel manager
     */
    init() {
        this.setupSplitter();
        this.setupUniformOverlay();
        this.setupEventListeners();
        this.loadLayoutConfig();
    }

    /**
     * Setup the main splitter for editor/canvas resizing
     */
    setupSplitter() {
        const splitterElement = document.getElementById('mainSplitter');
        if (splitterElement) {
            this.splitter = {
                element: splitterElement,
                isDragging: false
            };

            splitterElement.addEventListener('mousedown', (e) => {
                this.startSplitterDrag(e);
            });
        }
    }

    /**
     * Setup the collapsible uniform overlay and vertical tabs
     */
    setupUniformOverlay() {
        this.uniformOverlay = document.getElementById('uniformOverlay');
        const toggleBtn = document.getElementById('uniformToggle');
        
        if (toggleBtn && this.uniformOverlay) {
            toggleBtn.addEventListener('click', () => {
                this.toggleUniformOverlay();
            });
        }
        
        // Setup vertical tabs
        this.setupVerticalTabs();
    }

    /**
     * Setup vertical tab switching
     */
    setupVerticalTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn.vertical');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                
                // If panel is collapsed, expand it first
                if (this.uniformOverlay && this.uniformOverlay.classList.contains('collapsed')) {
                    this.toggleUniformOverlay();
                }
                
                // Then switch to the requested tab
                this.switchToTab(tabId);
            });
        });
        
        // Load saved active tab
        const savedTab = localStorage.getItem('activeSettingsTab') || 'canvas';
        this.switchToTab(savedTab);
    }

    /**
     * Switch to a specific tab
     */
    switchToTab(tabId) {
        // Update button states
        const tabButtons = document.querySelectorAll('.tab-btn.vertical');
        tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabId);
        });
        
        // Update content visibility
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}Tab`);
        });
        
        // Save active tab
        localStorage.setItem('activeSettingsTab', tabId);
    }

    /**
     * Toggle the uniform overlay expanded/collapsed
     */
    toggleUniformOverlay() {
        if (this.uniformOverlay) {
            this.uniformOverlay.classList.toggle('collapsed');
            
            // Save state to localStorage
            const isCollapsed = this.uniformOverlay.classList.contains('collapsed');
            localStorage.setItem('uniformOverlayCollapsed', isCollapsed);
        }
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.handleMouseMove(e);
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (this.isDragging) {
                this.handleMouseUp(e);
            }
        });

        // Prevent text selection during drag
        document.addEventListener('selectstart', (e) => {
            if (this.isDragging) {
                e.preventDefault();
            }
        });
    }

    /**
     * Start dragging the splitter
     */
    startSplitterDrag(e) {
        this.isDragging = true;
        this.dragData = {
            startX: e.clientX,
            initialLeftWidth: this.layoutConfig.leftWidth
        };

        if (this.splitter) {
            this.splitter.element.classList.add('dragging');
        }

        e.preventDefault();
    }

    /**
     * Handle mouse movement during drag
     */
    handleMouseMove(e) {
        if (!this.isDragging || !this.dragData) return;

        const workspace = document.getElementById('workspace');
        if (!workspace) return;

        const workspaceRect = workspace.getBoundingClientRect();
        const mouseX = e.clientX - workspaceRect.left;
        const workspaceWidth = workspaceRect.width;
        
        // Calculate new left panel width as percentage
        const newLeftWidth = Math.max(20, Math.min(80, (mouseX / workspaceWidth) * 100));
        
        // Apply temporary layout during drag
        this.applyLayout({ leftWidth: newLeftWidth });
    }

    /**
     * Handle mouse up (end drag)
     */
    handleMouseUp(e) {
        if (!this.isDragging) return;

        this.isDragging = false;
        
        if (this.splitter) {
            this.splitter.element.classList.remove('dragging');
        }

        // Save final layout
        this.saveLayoutConfig();
        this.dragData = null;
    }

    /**
     * Apply layout configuration to panel areas
     */
    applyLayout(config = this.layoutConfig) {
        const leftArea = document.getElementById('leftArea');
        const rightArea = document.getElementById('rightArea');
        
        if (leftArea && rightArea) {
            const leftWidth = config.leftWidth;
            const rightWidth = 100 - leftWidth;
            
            leftArea.style.flexBasis = `${leftWidth}%`;
            rightArea.style.flexBasis = `${rightWidth}%`;
            
            // Update internal config
            this.layoutConfig.leftWidth = leftWidth;
        }
    }

    /**
     * Save layout configuration to localStorage
     */
    saveLayoutConfig() {
        try {
            localStorage.setItem('panelLayout', JSON.stringify({
                leftWidth: this.layoutConfig.leftWidth
            }));
        } catch (error) {
            console.warn('Failed to save layout configuration:', error);
        }
    }

    /**
     * Load layout configuration from localStorage
     */
    loadLayoutConfig() {
        try {
            const saved = localStorage.getItem('panelLayout');
            if (saved) {
                const config = JSON.parse(saved);
                this.layoutConfig.leftWidth = config.leftWidth || 50;
            }
            
            // Load uniform overlay state
            const uniformCollapsed = localStorage.getItem('uniformOverlayCollapsed');
            if (uniformCollapsed === 'true' && this.uniformOverlay) {
                this.uniformOverlay.classList.add('collapsed');
            } else if (uniformCollapsed === 'false' && this.uniformOverlay) {
                this.uniformOverlay.classList.remove('collapsed');
            }
            
            // Load active tab state (handled in setupVerticalTabs)
            // This is here as a reference point for the loading order
            
            // Apply the loaded layout
            this.applyLayout();
        } catch (error) {
            console.warn('Failed to load layout configuration:', error);
            this.applyLayout(); // Apply default layout
        }
    }
} 