import { initWebGL, createProgram, createFullScreenQuad, setUniformValue, createTexture } from '../../utils/webgl.js';
import { DEFAULT_SETTINGS } from '../../config/settings.js';

/**
 * WebGLRenderer component for handling WebGL rendering
 */
export class WebGLRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.gl = null;
        this.program = null;
        this.vertexBuffer = null;
        this.positionLocation = null;
        this.uniformLocations = new Map();
        this.mousePos = { x: 0, y: 0 };
        this.currentTime = 0;
        this.startTime = Date.now();
        this.isPlaying = true;
        this.animationId = null;
        this.settings = DEFAULT_SETTINGS.canvas;
        this.resetTimeOnCompile = DEFAULT_SETTINGS.animation.resetTimeOnCompile; // Track reset time setting
        this.currentUniforms = new Map();
        this.currentBuiltinAssociations = new Map();
        
        // Frame buffer for last frame texture
        this.lastFrameFramebuffer = null;
        this.lastFrameTexture = null;
        this.isFirstFrame = true;
        
        // Pan and zoom state
        this.panZoomEnabled = false;
        this.viewOffset = { x: 0, y: 0 };
        this.viewZoom = 1.0;
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        this.minZoom = 0.1;
        this.maxZoom = 10.0;
        
        this.init();
    }

    /**
     * Initialize the WebGL renderer
     */
    init() {
        this.setupCanvas();
        this.setupWebGL();
        this.setupEventListeners();
        this.startRenderLoop();
        
        // Dispatch initial animation state
        this.dispatchEvent('animationStateChanged', { playing: this.isPlaying });
    }

    /**
     * Setup the canvas element
     */
    setupCanvas() {
        if (!this.canvas) {
            throw new Error(`Canvas element not found`);
        }

        // Set canvas size
        this.canvas.width = this.settings.width;
        this.canvas.height = this.settings.height;

        // Setup mouse tracking
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            
            if (this.panZoomEnabled && this.isDragging) {
                // Handle panning
                const deltaX = e.clientX - this.lastMousePos.x;
                const deltaY = e.clientY - this.lastMousePos.y;
                this.applyPan(deltaX, deltaY);
                this.lastMousePos = { x: e.clientX, y: e.clientY };
            } else {
                // Regular mouse tracking for shaders
                // Since we're using CSS transforms, mouse coordinates stay in original shader space
                this.mousePos.x = (e.clientX - rect.left) / rect.width;
                this.mousePos.y = 1.0 - (e.clientY - rect.top) / rect.height;
            }
        });

        // Setup pan and zoom interactions
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.panZoomEnabled && e.button === 0) { // Left mouse button
                this.isDragging = true;
                this.lastMousePos = { x: e.clientX, y: e.clientY };
                this.canvas.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (this.panZoomEnabled && e.button === 0) {
                this.isDragging = false;
                this.canvas.style.cursor = 'grab';
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            if (this.panZoomEnabled) {
                this.isDragging = false;
                this.canvas.style.cursor = 'grab';
            }
        });

        // Setup zoom with mouse wheel
        this.canvas.addEventListener('wheel', (e) => {
            if (this.panZoomEnabled) {
                e.preventDefault();
                this.applyZoom(-e.deltaY, e.clientX, e.clientY);
            }
        }, { passive: false });
    }

    /**
     * Setup WebGL context and resources
     */
    setupWebGL() {
        try {
            this.gl = initWebGL(this.canvas);
            
            // Enable blending for transparency
            this.gl.enable(this.gl.BLEND);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
            
            this.vertexBuffer = createFullScreenQuad(this.gl);
            this.setupLastFrameBuffer();
        } catch (error) {
            this.dispatchError(error.message);
        }
    }

    /**
     * Setup framebuffer and texture for last frame storage
     */
    setupLastFrameBuffer() {
        if (!this.gl) return;

        const gl = this.gl;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clean up existing resources
        if (this.lastFrameFramebuffer) {
            gl.deleteFramebuffer(this.lastFrameFramebuffer);
        }
        if (this.lastFrameTexture) {
            gl.deleteTexture(this.lastFrameTexture);
        }

        // Create texture for storing the last frame
        this.lastFrameTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.lastFrameTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Create framebuffer
        this.lastFrameFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lastFrameFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.lastFrameTexture, 0);

        // Check framebuffer completeness
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error('Last frame framebuffer is not complete');
        }

        // Restore default framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        // Reset first frame flag
        this.isFirstFrame = true;
    }

    /**
     * Copy current frame content to the last frame buffer
     */
    copyCurrentFrameToBuffer() {
        if (!this.gl || !this.lastFrameFramebuffer || !this.lastFrameTexture) return;

        const gl = this.gl;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Bind the last frame framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lastFrameFramebuffer);
        
        // Set viewport for the framebuffer
        gl.viewport(0, 0, width, height);
        
        // Clear the framebuffer
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Copy from the main canvas to the framebuffer
        // We do this by reading from the main framebuffer and drawing to our framebuffer
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null); // Read from default (canvas) framebuffer
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.lastFrameFramebuffer); // Draw to our framebuffer
        gl.blitFramebuffer(
            0, 0, width, height,  // source rectangle
            0, 0, width, height,  // destination rectangle
            gl.COLOR_BUFFER_BIT,  // buffer mask
            gl.NEAREST            // filter
        );
        
        // Restore the default framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, width, height);
        
        // Mark that we now have a valid last frame
        this.isFirstFrame = false;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for shader changes
        document.addEventListener('shaderChanged', (e) => {
            this.onShaderChanged(e.detail);
        });

        // Listen for uniform updates
        document.addEventListener('uniformUpdated', (e) => {
            this.onUniformUpdated(e.detail);
        });

        // Listen for uniform data from manager
        document.addEventListener('uniformsUpdate', (e) => {
            this.currentUniforms = e.detail.uniforms;
            this.currentBuiltinAssociations = e.detail.builtinAssociations;
        });

        // Listen for animation controls
        document.addEventListener('animationToggled', (e) => {
            this.toggleAnimation();
        });

        document.addEventListener('animationReset', () => {
            this.resetAnimation();
        });

        // Listen for time reset setting changes
        document.addEventListener('timeResetOnCompileChanged', (e) => {
            this.setResetTimeOnCompile(e.detail.enabled);
        });

        // Listen for pan/zoom control events
        document.addEventListener('panZoomToggled', (e) => {
            this.setPanZoomEnabled(e.detail.enabled);
        });

        document.addEventListener('viewResetRequested', () => {
            this.resetView();
        });
    }

    /**
     * Handle shader changes
     * @param {Object} detail - The shader change details
     */
    onShaderChanged(detail) {
        if (detail.allShaders) {
            this.compileShaders(detail.allShaders.vertex, detail.allShaders.fragment);
        }
    }

    /**
     * Handle uniform updates
     * @param {Object} detail - The uniform update details
     */
    onUniformUpdated(detail) {
        // Uniform locations will be updated on next render
        // This is handled in the render loop
    }

    /**
     * Compile shaders and create program
     * @param {string} vertexSource - The vertex shader source
     * @param {string} fragmentSource - The fragment shader source
     */
    compileShaders(vertexSource, fragmentSource) {
        if (!this.gl) return;

        try {
            this.hideError();

            // Clean up old program
            if (this.program) {
                this.gl.deleteProgram(this.program);
            }

            // Create new program
            this.program = createProgram(this.gl, vertexSource, fragmentSource);
            this.gl.useProgram(this.program);

            // Get attribute locations
            this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');

            // Setup vertex attributes
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
            this.gl.enableVertexAttribArray(this.positionLocation);
            this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);

            // Clear uniform locations - they will be updated on next render
            this.uniformLocations.clear();

            // Reset time if setting is enabled
            if (this.resetTimeOnCompile) {
                this.resetAnimation();
            }

            this.dispatchEvent('shaderCompiled', { success: true });

        } catch (error) {
            this.dispatchError(error.message);
            this.dispatchEvent('shaderCompiled', { success: false, error: error.message });
        }
    }

    /**
     * Update uniform locations
     * @param {Map} uniforms - The uniforms map
     */
    updateUniformLocations(uniforms) {
        if (!this.program) return;

        for (const [uniformName, uniform] of uniforms) {
            const location = this.gl.getUniformLocation(this.program, uniformName);
            if (location !== null) {
                this.uniformLocations.set(uniformName, location);
            }
        }
    }

    /**
     * Start the render loop
     */
    startRenderLoop() {
        this.render();
    }

    /**
     * Main render function
     */
    render() {
        if (!this.gl || !this.program) {
            this.animationId = requestAnimationFrame(() => this.render());
            return;
        }

        // Update time
        if (this.isPlaying) {
            this.currentTime = (Date.now() - this.startTime) / 1000.0;
        }

        // Clear the canvas
        this.gl.clearColor(...this.settings.backgroundColor);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Get uniforms from the uniform manager
        const uniformsEvent = new CustomEvent('getUniforms');
        document.dispatchEvent(uniformsEvent);

        // Set uniforms and render
        this.setUniforms(this.currentUniforms, this.currentBuiltinAssociations);

        this.animationId = requestAnimationFrame(() => this.render());
    }



    /**
     * Set uniforms for rendering
     * @param {Map} uniforms - The uniforms map
     * @param {Map} builtinAssociations - The builtin associations map
     */
    setUniforms(uniforms, builtinAssociations) {
        if (!this.gl || !this.program) return;

        // Update uniform locations if needed
        this.updateUniformLocations(uniforms);

        // Update built-in uniform values (but don't override manually edited resolution uniforms)
        const updatedUniforms = [];
        for (const [uniformName, builtinType] of builtinAssociations) {
            const uniform = uniforms.get(uniformName);
            if (!uniform) continue;

            let newValue;
            let shouldUpdate = true;
            
            switch (builtinType) {
                case 'time':
                    newValue = this.currentTime;
                    break;
                case 'resolution':
                    // Don't automatically override resolution uniform - let manual edits persist
                    // Only update if the uniform hasn't been manually set or if canvas was programmatically resized
                    if (!uniform.manuallyEdited) {
                        newValue = [this.canvas.width, this.canvas.height];
                    } else {
                        shouldUpdate = false;
                    }
                    break;
                case 'mouse':
                    newValue = [this.mousePos.x, this.mousePos.y];
                    break;
                case 'lastFrame':
                    // Create texture data object for the last frame
                    if (this.lastFrameTexture && !this.isFirstFrame) {
                        newValue = {
                            texture: this.lastFrameTexture,
                            filter: 'linear',
                            wrapS: 'clamp',
                            wrapT: 'clamp',
                            isLastFrame: true // Special flag to identify this as a last frame texture
                        };
                    } else {
                        // For the first frame, provide a black texture
                        newValue = null;
                    }
                    break;
                default:
                    continue;
            }

            // Update uniform value only if we should
            if (shouldUpdate) {
                uniform.value = newValue;
                updatedUniforms.push({
                    name: uniformName,
                    type: uniform.type,
                    value: newValue
                });
            }
        }

        // Notify UI of uniform value changes
        if (updatedUniforms.length > 0) {
            this.dispatchEvent('uniformValuesUpdated', { uniforms: updatedUniforms });
        }

        // Set all uniforms with proper texture unit assignment
        let textureUnit = 0;
        for (const [uniformName, uniform] of uniforms) {
            const location = this.uniformLocations.get(uniformName);
            if (location) {
                if (uniform.type === 'texture') {
                    this.setTextureUniform(location, uniform.value, textureUnit);
                    textureUnit++;
                } else {
                    setUniformValue(this.gl, location, uniform.type, uniform.value);
                }
            }
        }

        // Draw the quad
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        
        // Copy current frame to last frame buffer for next frame
        this.copyCurrentFrameToBuffer();
    }



    /**
     * Set a texture uniform with proper texture unit assignment
     * @param {WebGLUniformLocation} location - The uniform location
     * @param {*} value - The texture value
     * @param {number} textureUnit - The texture unit index to use
     */
    setTextureUniform(location, value, textureUnit) {
        if (!value) return;

        // Handle lastFrame texture differently
        if (value.isLastFrame) {
            if (value.texture) {
                // Bind to the assigned texture unit
                this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
                this.gl.bindTexture(this.gl.TEXTURE_2D, value.texture);
                // Set the uniform to the texture unit index
                this.gl.uniform1i(location, textureUnit);
            }
            return;
        }

        // Handle regular user textures
        if (!value.image) return;

        // Create or recreate WebGL texture if needed
        if (!value.texture || value.needsUpdate) {
            if (value.texture) {
                this.gl.deleteTexture(value.texture);
            }
            value.texture = createTexture(this.gl, value.image, value.filter, value.wrapS, value.wrapT, value.isDataTexture);
            value.needsUpdate = false;
        }

        if (value.texture) {
            // Bind to the assigned texture unit
            this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
            this.gl.bindTexture(this.gl.TEXTURE_2D, value.texture);
            // Set the uniform to the texture unit index
            this.gl.uniform1i(location, textureUnit);
        }
    }

    /**
     * Toggle animation playback
     * @param {boolean} playing - Whether animation should be playing
     */
    toggleAnimation(playing) {
        if (playing !== undefined) {
            this.isPlaying = playing;
        } else {
            this.isPlaying = !this.isPlaying;
        }

        if (this.isPlaying) {
            this.startTime = Date.now() - this.currentTime * 1000;
        }

        this.dispatchEvent('animationStateChanged', { playing: this.isPlaying });
    }

    /**
     * Reset animation time
     */
    resetAnimation() {
        this.currentTime = 0;
        this.startTime = Date.now();
        // Don't dispatch 'animationReset' event to avoid infinite loops
        // This method resets the time internally when called by event listeners
    }

    /**
     * Set whether time should reset on shader compilation
     * @param {boolean} enabled - Whether to reset time on compile
     */
    setResetTimeOnCompile(enabled) {
        this.resetTimeOnCompile = enabled;
    }

    /**
     * Get current animation state
     * @returns {Object} Animation state
     */
    getAnimationState() {
        return {
            playing: this.isPlaying,
            currentTime: this.currentTime,
            resetTimeOnCompile: this.resetTimeOnCompile
        };
    }

    /**
     * Get current mouse position
     * @returns {Object} Mouse position
     */
    getMousePosition() {
        return { ...this.mousePos };
    }

    /**
     * Resize the canvas
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.settings.width = width;
        this.settings.height = height;
        
        if (this.gl) {
            this.gl.viewport(0, 0, width, height);
            // Recreate framebuffer with new size
            this.setupLastFrameBuffer();
        }
    }

    /**
     * Show an error
     * @param {string} message - The error message
     */
    dispatchError(message) {
        const event = new CustomEvent('renderError', { detail: { message } });
        document.dispatchEvent(event);
    }

    /**
     * Hide error
     */
    hideError() {
        const event = new CustomEvent('renderErrorCleared');
        document.dispatchEvent(event);
    }

    /**
     * Dispatch a custom event
     * @param {string} eventName - The event name
     * @param {*} detail - The event detail
     */
    dispatchEvent(eventName, detail = null) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    /**
     * Toggle pan and zoom mode
     * @param {boolean} enabled - Whether pan/zoom should be enabled
     */
    setPanZoomEnabled(enabled) {
        this.panZoomEnabled = enabled;
        this.isDragging = false;
        
        // Update canvas cursor and visual hints
        if (enabled) {
            this.canvas.style.cursor = 'grab';
            this.canvas.classList.add('pan-zoom-enabled');
            this.canvas.parentElement.classList.add('pan-zoom-active');
        } else {
            this.canvas.style.cursor = 'default';
            this.canvas.classList.remove('pan-zoom-enabled');
            this.canvas.parentElement.classList.remove('pan-zoom-active');
            // Reset transform when disabled
            this.canvas.style.transform = '';
        }
        
        this.dispatchEvent('panZoomModeChanged', { enabled });
    }

    /**
     * Reset view to default position and zoom
     */
    resetView() {
        // Reset to fit-to-container zoom if canvas is larger than container
        const bounds = this.calculateZoomBounds();
        this.viewZoom = Math.max(1.0, bounds.minZoom);
        this.viewOffset = { x: 0, y: 0 };
        this.isDragging = false;
        
        // Apply bounds checking
        const panBounds = this.calculatePanBounds();
        this.viewOffset.x = Math.max(panBounds.minX, Math.min(panBounds.maxX, this.viewOffset.x));
        this.viewOffset.y = Math.max(panBounds.minY, Math.min(panBounds.maxY, this.viewOffset.y));
        
        this.updateCanvasTransform();
        
        this.dispatchEvent('viewReset', {
            offset: { ...this.viewOffset },
            zoom: this.viewZoom
        });
    }

    /**
     * Update CSS transform on canvas for pan/zoom display
     */
    updateCanvasTransform() {
        if (!this.canvas) return;
        
        const transform = `translate(${this.viewOffset.x}px, ${this.viewOffset.y}px) scale(${this.viewZoom})`;
        this.canvas.style.transform = transform;
        this.canvas.style.transformOrigin = 'center center';
    }

    /**
     * Calculate pan boundaries to keep content visible
     * @returns {Object} Bounds object with minX, maxX, minY, maxY
     */
    calculatePanBounds() {
        if (!this.canvas || !this.canvas.parentElement) {
            return { minX: -Infinity, maxX: Infinity, minY: -Infinity, maxY: Infinity };
        }

        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        // Calculate scaled canvas dimensions
        const scaledCanvasWidth = canvasRect.width * this.viewZoom;
        const scaledCanvasHeight = canvasRect.height * this.viewZoom;
        
        // Calculate bounds to keep at least 100px of canvas visible
        const margin = 100;
        const maxOffsetX = (containerRect.width + scaledCanvasWidth) / 2 - margin;
        const minOffsetX = -(containerRect.width + scaledCanvasWidth) / 2 + margin;
        const maxOffsetY = (containerRect.height + scaledCanvasHeight) / 2 - margin;
        const minOffsetY = -(containerRect.height + scaledCanvasHeight) / 2 + margin;
        
        return {
            minX: minOffsetX,
            maxX: maxOffsetX,
            minY: minOffsetY,
            maxY: maxOffsetY
        };
    }

    /**
     * Calculate zoom boundaries
     * @returns {Object} Bounds object with minZoom, maxZoom
     */
    calculateZoomBounds() {
        if (!this.canvas || !this.canvas.parentElement) {
            return { minZoom: this.minZoom, maxZoom: this.maxZoom };
        }

        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        // Calculate minimum zoom to fit canvas in container with some margin
        const marginFactor = 0.1; // 10% margin
        const fitZoomX = (containerRect.width * (1 - marginFactor)) / canvasRect.width;
        const fitZoomY = (containerRect.height * (1 - marginFactor)) / canvasRect.height;
        const fitZoom = Math.min(fitZoomX, fitZoomY);
        
        // Minimum zoom is the smaller of fit zoom or 0.1x
        const minZoom = Math.min(fitZoom, 0.1);
        
        return {
            minZoom: Math.max(0.05, minZoom), // Never go below 5%
            maxZoom: this.maxZoom
        };
    }

    /**
     * Apply zoom at a specific point
     * @param {number} delta - Zoom delta (positive for zoom in, negative for zoom out)
     * @param {number} mouseX - Mouse X position (global coordinates)
     * @param {number} mouseY - Mouse Y position (global coordinates)
     */
    applyZoom(delta, mouseX, mouseY) {
        if (!this.panZoomEnabled) return;

        const zoomFactor = delta > 0 ? 1.1 : 0.9;
        const bounds = this.calculateZoomBounds();
        const newZoom = Math.max(bounds.minZoom, Math.min(bounds.maxZoom, this.viewZoom * zoomFactor));
        
        if (newZoom !== this.viewZoom) {
            // Get mouse position relative to container
            const container = this.canvas.parentElement;
            const containerRect = container.getBoundingClientRect();
            const containerX = mouseX - containerRect.left;
            const containerY = mouseY - containerRect.top;
            
            // Calculate the point in the transformed space
            const transformedX = (containerX - containerRect.width / 2 - this.viewOffset.x) / this.viewZoom;
            const transformedY = (containerY - containerRect.height / 2 - this.viewOffset.y) / this.viewZoom;
            
            // Update zoom
            this.viewZoom = newZoom;
            
            // Adjust offset to keep the zoom point fixed
            this.viewOffset.x = containerX - containerRect.width / 2 - transformedX * this.viewZoom;
            this.viewOffset.y = containerY - containerRect.height / 2 - transformedY * this.viewZoom;
            
            // Apply pan bounds after zoom to keep content in bounds
            const panBounds = this.calculatePanBounds();
            this.viewOffset.x = Math.max(panBounds.minX, Math.min(panBounds.maxX, this.viewOffset.x));
            this.viewOffset.y = Math.max(panBounds.minY, Math.min(panBounds.maxY, this.viewOffset.y));
            
            this.updateCanvasTransform();
            
            this.dispatchEvent('viewChanged', {
                offset: { ...this.viewOffset },
                zoom: this.viewZoom
            });
        }
    }

    /**
     * Apply pan offset
     * @param {number} deltaX - X delta in pixels
     * @param {number} deltaY - Y delta in pixels
     */
    applyPan(deltaX, deltaY) {
        if (!this.panZoomEnabled) return;

        // Calculate new offset
        const newOffsetX = this.viewOffset.x + deltaX;
        const newOffsetY = this.viewOffset.y + deltaY;
        
        // Apply bounds checking
        const bounds = this.calculatePanBounds();
        this.viewOffset.x = Math.max(bounds.minX, Math.min(bounds.maxX, newOffsetX));
        this.viewOffset.y = Math.max(bounds.minY, Math.min(bounds.maxY, newOffsetY));
        
        this.updateCanvasTransform();
        
        this.dispatchEvent('viewChanged', {
            offset: { ...this.viewOffset },
            zoom: this.viewZoom
        });
    }

    /**
     * Get current view state
     * @returns {Object} Current view state
     */
    getViewState() {
        return {
            enabled: this.panZoomEnabled,
            offset: { ...this.viewOffset },
            zoom: this.viewZoom
        };
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        if (this.gl) {
            if (this.program) {
                this.gl.deleteProgram(this.program);
            }
            if (this.vertexBuffer) {
                this.gl.deleteBuffer(this.vertexBuffer);
            }
        }

        this.uniformLocations.clear();
    }
} 