/**
 * PanelManager - Handles resizable panels with splitters
 */
export class PanelManager {
    constructor() {
        this.splitters = new Map();
        this.isDragging = false;
        this.dragData = null;
        this.layoutConfig = {
            leftWidth: 33, // percentage
            rightWidth: 33, // percentage
        };
        
        this.init();
    }

    /**
     * Initialize the panel manager
     */
    init() {
        this.setupSplitters();
        this.setupEventListeners();
        this.loadLayoutConfig();
    }



    /**
     * Setup splitter elements for resizing
     */
    setupSplitters() {
        const splitterElements = document.querySelectorAll('.splitter');
        
        splitterElements.forEach(splitter => {
            const direction = splitter.dataset.direction;
            const splitterId = splitter.id;
            
            this.splitters.set(splitterId, {
                element: splitter,
                direction: direction,
                isDragging: false
            });

            splitter.addEventListener('mousedown', (e) => {
                this.startSplitterDrag(e, splitterId);
            });
        });
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        document.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });

        document.addEventListener('mouseup', (e) => {
            this.handleMouseUp(e);
        });

        // Prevent text selection during drag
        document.addEventListener('selectstart', (e) => {
            if (this.isDragging) {
                e.preventDefault();
            }
        });
    }

    /**
     * Start dragging a splitter
     */
    startSplitterDrag(e, splitterId) {
        this.isDragging = true;
        this.dragData = {
            type: 'splitter',
            splitterId: splitterId,
            startX: e.clientX,
            startY: e.clientY,
            // Store initial layout state
            initialLeftWidth: this.layoutConfig.leftWidth,
            initialRightWidth: this.layoutConfig.rightWidth
        };

        const splitter = this.splitters.get(splitterId);
        splitter.element.classList.add('dragging');
        
        document.body.style.cursor = splitter.direction === 'horizontal' ? 'col-resize' : 'row-resize';
    }

    /**
     * Handle mouse move during drag
     */
    handleMouseMove(e) {
        if (!this.isDragging || !this.dragData) return;

        if (this.dragData.type === 'splitter') {
            this.handleSplitterDrag(e);
        }
    }

    /**
     * Handle splitter dragging
     */
    handleSplitterDrag(e) {
        const workspace = document.getElementById('workspace');
        const workspaceRect = workspace.getBoundingClientRect();
        
        if (this.dragData.splitterId === 'leftSplitter') {
            // Calculate desired left width based on mouse position
            const mouseRelativeX = e.clientX - workspaceRect.left;
            const desiredLeftWidth = (mouseRelativeX / workspaceRect.width) * 100;
            
            // Calculate new layout with cascading constraints
            const newLayout = this.calculateCascadingLayout('left', desiredLeftWidth);
            this.applyTemporaryLayout(newLayout.left, newLayout.right);
            
        } else if (this.dragData.splitterId === 'rightSplitter') {
            // Calculate desired right width based on distance from right edge
            const mouseRelativeX = e.clientX - workspaceRect.left;
            const distanceFromRight = workspaceRect.width - mouseRelativeX;
            const desiredRightWidth = (distanceFromRight / workspaceRect.width) * 100;
            
            // Calculate new layout with cascading constraints
            const newLayout = this.calculateCascadingLayout('right', desiredRightWidth);
            this.applyTemporaryLayout(newLayout.left, newLayout.right);
        }
    }

    /**
     * Calculate layout with cascading push behavior
     * @param {string} draggedSide - 'left' or 'right'
     * @param {number} desiredWidth - Desired width for the dragged panel
     * @returns {Object} Object with left and right widths
     */
    calculateCascadingLayout(draggedSide, desiredWidth) {
        const minWidth = 15; // Minimum width for any panel
        let leftWidth = this.dragData.initialLeftWidth;
        let rightWidth = this.dragData.initialRightWidth;
        let centerWidth = 100 - leftWidth - rightWidth;
        
        if (draggedSide === 'left') {
            // Calculate how much the left panel wants to change
            const requestedLeftWidth = Math.max(minWidth, desiredWidth);
            const deltaLeft = requestedLeftWidth - leftWidth;
            
            if (deltaLeft > 0) {
                // Expanding left panel - first try to shrink center
                const availableFromCenter = Math.max(0, centerWidth - minWidth);
                const takeFromCenter = Math.min(deltaLeft, availableFromCenter);
                
                leftWidth += takeFromCenter;
                centerWidth -= takeFromCenter;
                
                const remainingDelta = deltaLeft - takeFromCenter;
                
                // If center hit minimum and we still need space, push right splitter
                if (remainingDelta > 0 && centerWidth <= minWidth) {
                    const availableFromRight = Math.max(0, rightWidth - minWidth);
                    const takeFromRight = Math.min(remainingDelta, availableFromRight);
                    
                    leftWidth += takeFromRight;
                    rightWidth -= takeFromRight;
                }
            } else if (deltaLeft < 0) {
                // Shrinking left panel - only allow if above minimum
                const actualShrink = Math.min(Math.abs(deltaLeft), leftWidth - minWidth);
                leftWidth -= actualShrink;
                centerWidth += actualShrink; // Give space back to center
            }
            
        } else {
            // Calculate how much the right panel wants to change
            const requestedRightWidth = Math.max(minWidth, desiredWidth);
            const deltaRight = requestedRightWidth - rightWidth;
            
            if (deltaRight > 0) {
                // Expanding right panel - first try to shrink center
                const availableFromCenter = Math.max(0, centerWidth - minWidth);
                const takeFromCenter = Math.min(deltaRight, availableFromCenter);
                
                rightWidth += takeFromCenter;
                centerWidth -= takeFromCenter;
                
                const remainingDelta = deltaRight - takeFromCenter;
                
                // If center hit minimum and we still need space, push left splitter
                if (remainingDelta > 0 && centerWidth <= minWidth) {
                    const availableFromLeft = Math.max(0, leftWidth - minWidth);
                    const takeFromLeft = Math.min(remainingDelta, availableFromLeft);
                    
                    rightWidth += takeFromLeft;
                    leftWidth -= takeFromLeft;
                }
            } else if (deltaRight < 0) {
                // Shrinking right panel - only allow if above minimum
                const actualShrink = Math.min(Math.abs(deltaRight), rightWidth - minWidth);
                rightWidth -= actualShrink;
                centerWidth += actualShrink; // Give space back to center
            }
        }
        
        // Debug logging
        const finalCenterWidth = 100 - leftWidth - rightWidth;
        console.log(`Push calc: ${draggedSide} splitter, desired: ${desiredWidth.toFixed(1)}%, result: L=${leftWidth.toFixed(1)}%, C=${finalCenterWidth.toFixed(1)}%, R=${rightWidth.toFixed(1)}%`);
        
        return { left: leftWidth, right: rightWidth };
    }

    /**
     * Handle mouse up (end drag)
     */
    handleMouseUp(e) {
        if (!this.isDragging) return;

        if (this.dragData && this.dragData.type === 'splitter') {
            const splitter = this.splitters.get(this.dragData.splitterId);
            if (splitter) {
                splitter.element.classList.remove('dragging');
            }

            // Calculate final layout values using the same cascading logic
            const workspace = document.getElementById('workspace');
            const workspaceRect = workspace.getBoundingClientRect();
            
            if (this.dragData.splitterId === 'leftSplitter') {
                const mouseRelativeX = e.clientX - workspaceRect.left;
                const desiredLeftWidth = (mouseRelativeX / workspaceRect.width) * 100;
                
                const finalLayout = this.calculateCascadingLayout('left', desiredLeftWidth);
                this.layoutConfig.leftWidth = finalLayout.left;
                this.layoutConfig.rightWidth = finalLayout.right;
                
            } else if (this.dragData.splitterId === 'rightSplitter') {
                const mouseRelativeX = e.clientX - workspaceRect.left;
                const distanceFromRight = workspaceRect.width - mouseRelativeX;
                const desiredRightWidth = (distanceFromRight / workspaceRect.width) * 100;
                
                const finalLayout = this.calculateCascadingLayout('right', desiredRightWidth);
                this.layoutConfig.leftWidth = finalLayout.left;
                this.layoutConfig.rightWidth = finalLayout.right;
            }

            // Apply final layout and save configuration
            this.applyLayout();
            this.saveLayoutConfig();
        }

        this.isDragging = false;
        this.dragData = null;
        document.body.style.cursor = '';
    }

    /**
     * Apply temporary layout during drag (visual only)
     */
    applyTemporaryLayout(leftWidth, rightWidth) {
        const leftArea = document.getElementById('leftArea');
        const centerArea = document.getElementById('centerArea');
        const rightArea = document.getElementById('rightArea');

        const centerWidth = 100 - leftWidth - rightWidth;

        if (leftArea) leftArea.style.flex = `0 0 ${leftWidth}%`;
        if (centerArea) centerArea.style.flex = `0 0 ${centerWidth}%`;
        if (rightArea) rightArea.style.flex = `0 0 ${rightWidth}%`;
    }

    /**
     * Apply layout configuration
     */
    applyLayout() {
        this.applyTemporaryLayout(this.layoutConfig.leftWidth, this.layoutConfig.rightWidth);
    }

    /**
     * Save layout configuration to localStorage
     */
    saveLayoutConfig() {
        const config = {
            layout: this.layoutConfig
        };

        localStorage.setItem('shader_editor_layout', JSON.stringify(config));
    }

    /**
     * Load layout configuration from localStorage
     */
    loadLayoutConfig() {
        try {
            const saved = localStorage.getItem('shader_editor_layout');
            if (saved) {
                const config = JSON.parse(saved);
                
                if (config.layout) {
                    this.layoutConfig = { ...this.layoutConfig, ...config.layout };
                    this.applyLayout();
                }
            }
        } catch (error) {
            console.warn('Failed to load layout configuration:', error);
        }
    }

    /**
     * Reset layout to default
     */
    resetLayout() {
        this.layoutConfig = {
            leftWidth: 33,
            rightWidth: 33
        };

        this.applyLayout();
        this.saveLayoutConfig();
    }

    /**
     * Cleanup
     */
    destroy() {
        // Clean up event listeners and reset styles
        document.body.style.cursor = '';
        this.splitters.clear();
    }
} 