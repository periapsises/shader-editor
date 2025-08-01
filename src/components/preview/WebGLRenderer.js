import { initWebGL, createProgram, createFullScreenQuad, setUniformValue, createTexture, parseShaderErrors } from '../../utils/webgl.js';
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
        this.keyStates = new Map(); // Track key states by key code
        this.mouseButtonStates = new Map(); // Track mouse button states
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
        
        // Canvas filtering mode
        this.canvasFiltering = 'nearest'; // 'nearest' or 'linear'
        
        // FPS tracking
        this.frameTimes = [];
        this.maxFrameSamples = 60; // Track last 60 frames
        this.lastFrameTime = 0;
        this.fpsUpdateInterval = 500; // Update FPS display every 500ms
        this.lastFpsUpdate = 0;
        
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

        // Apply initial canvas filtering
        this.applyCanvasFiltering();

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
                // Calculate the actual visible area of the canvas considering object-fit: contain
                const canvasAspect = this.canvas.width / this.canvas.height;
                const displayAspect = rect.width / rect.height;
                
                let visibleWidth, visibleHeight, offsetX, offsetY;
                
                if (canvasAspect > displayAspect) {
                    // Canvas is wider - will have top/bottom letterboxing
                    visibleWidth = rect.width;
                    visibleHeight = rect.width / canvasAspect;
                    offsetX = 0;
                    offsetY = (rect.height - visibleHeight) / 2;
                } else {
                    // Canvas is taller - will have left/right pillarboxing
                    visibleWidth = rect.height * canvasAspect;
                    visibleHeight = rect.height;
                    offsetX = (rect.width - visibleWidth) / 2;
                    offsetY = 0;
                }
                
                // Calculate mouse position relative to the visible canvas area only
                const mouseX = e.clientX - rect.left - offsetX;
                const mouseY = e.clientY - rect.top - offsetY;
                
                // Normalize to 0-1 range, but clamp to ensure we stay within bounds
                this.mousePos.x = Math.max(0, Math.min(1, mouseX / visibleWidth));
                this.mousePos.y = Math.max(0, Math.min(1, 1.0 - (mouseY / visibleHeight)));
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

        // Listen for keyboard events for key state tracking
        document.addEventListener('keydown', (e) => {
            this.keyStates.set(e.code, true);
        });

        document.addEventListener('keyup', (e) => {
            this.keyStates.set(e.code, false);
        });

        // Listen for mouse button events for button state tracking
        document.addEventListener('mousedown', (e) => {
            this.mouseButtonStates.set(`Mouse${e.button}`, true);
        });

        document.addEventListener('mouseup', (e) => {
            this.mouseButtonStates.set(`Mouse${e.button}`, false);
        });

        // Handle window blur to reset key states (prevents stuck keys/buttons)
        window.addEventListener('blur', () => {
            this.keyStates.clear();
            this.mouseButtonStates.clear();
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

        // Listen for canvas filtering changes
        document.addEventListener('canvasFilteringChanged', (e) => {
            this.setCanvasFiltering(e.detail.mode);
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

            // Try to compile shaders individually to get better error information
            let allErrors = [];
            let vertexShader, fragmentShader;

            // Compile vertex shader
            try {
                vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
                this.gl.shaderSource(vertexShader, vertexSource);
                this.gl.compileShader(vertexShader);

                if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
                    const error = this.gl.getShaderInfoLog(vertexShader);
                    this.gl.deleteShader(vertexShader);
                    const parsedErrors = parseShaderErrors(error, 'vertex');
                    allErrors = allErrors.concat(parsedErrors);
                    throw new Error(`Vertex shader compilation failed: ${error}`);
                }
            } catch (error) {
                if (allErrors.length === 0) {
                    // If parsing didn't extract any errors, add a general one
                    allErrors.push({
                        line: 0,
                        column: 0,
                        message: error.message,
                        type: 'error',
                        shaderType: 'vertex'
                    });
                }
                this.dispatchDetailedError(error.message, allErrors);
                this.dispatchEvent('shaderCompiled', { success: false, error: error.message, errors: allErrors });
                return;
            }

            // Compile fragment shader
            try {
                fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
                this.gl.shaderSource(fragmentShader, fragmentSource);
                this.gl.compileShader(fragmentShader);

                if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
                    const error = this.gl.getShaderInfoLog(fragmentShader);
                    this.gl.deleteShader(fragmentShader);
                    const parsedErrors = parseShaderErrors(error, 'fragment');
                    allErrors = allErrors.concat(parsedErrors);
                    throw new Error(`Fragment shader compilation failed: ${error}`);
                }
            } catch (error) {
                if (vertexShader) {
                    this.gl.deleteShader(vertexShader);
                }
                if (allErrors.length === 0) {
                    // If parsing didn't extract any errors, add a general one
                    allErrors.push({
                        line: 0,
                        column: 0,
                        message: error.message,
                        type: 'error',
                        shaderType: 'fragment'
                    });
                }
                this.dispatchDetailedError(error.message, allErrors);
                this.dispatchEvent('shaderCompiled', { success: false, error: error.message, errors: allErrors });
                return;
            }

            // Create and link program
            try {
                this.program = this.gl.createProgram();
                this.gl.attachShader(this.program, vertexShader);
                this.gl.attachShader(this.program, fragmentShader);
                this.gl.linkProgram(this.program);

                if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
                    const error = this.gl.getProgramInfoLog(this.program);
                    this.gl.deleteProgram(this.program);
                    this.program = null;
                    throw new Error('Shader program linking failed: ' + error);
                }

                // Clean up shaders (they're now part of the program)
                this.gl.deleteShader(vertexShader);
                this.gl.deleteShader(fragmentShader);

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

                // Clear any errors and annotations
                this.dispatchEvent('shaderCompiled', { success: true, errors: [] });

            } catch (error) {
                // Clean up shaders if program creation failed
                if (vertexShader) {
                    this.gl.deleteShader(vertexShader);
                }
                if (fragmentShader) {
                    this.gl.deleteShader(fragmentShader);
                }
                
                this.dispatchError(error.message);
                this.dispatchEvent('shaderCompiled', { success: false, error: error.message });
            }

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
        const currentFrameTime = performance.now();
        
        if (!this.gl || !this.program) {
            this.animationId = requestAnimationFrame(() => this.render());
            return;
        }

        // Update FPS tracking
        this.updateFPS(currentFrameTime);

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
                case 'keyState':
                    // For key state uniforms, get the key code from the uniform's metadata
                    // and return the boolean state of that key or mouse button
                    const keyCode = uniform.keyCode;
                    if (keyCode) {
                        // Check both keyboard keys and mouse buttons
                        newValue = this.keyStates.get(keyCode) || this.mouseButtonStates.get(keyCode) || false;
                    } else {
                        newValue = false;
                    }
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
     * Show detailed error with parsed error information
     * @param {string} message - The error message
     * @param {Array} errors - Array of parsed error objects
     */
    dispatchDetailedError(message, errors) {
        const event = new CustomEvent('renderError', { 
            detail: { 
                message,
                errors: errors || []
            } 
        });
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
     * Set canvas filtering mode
     * @param {string} mode - 'nearest' or 'linear'
     */
    setCanvasFiltering(mode) {
        this.canvasFiltering = mode;
        this.applyCanvasFiltering();
        
        this.dispatchEvent('canvasFilteringUpdated', { mode });
    }

    /**
     * Apply canvas filtering to the canvas element
     */
    applyCanvasFiltering() {
        if (!this.canvas) return;
        
        if (this.canvasFiltering === 'nearest') {
            // Pixelated/crisp rendering
            this.canvas.style.imageRendering = 'pixelated';
            this.canvas.style.imageRendering = '-moz-crisp-edges';
            this.canvas.style.imageRendering = 'crisp-edges';
        } else {
            // Smooth rendering (browser default)
            this.canvas.style.imageRendering = 'auto';
        }
    }

    /**
     * Get current canvas filtering mode
     * @returns {string} Current filtering mode
     */
    getCanvasFiltering() {
        return this.canvasFiltering;
    }

    /**
     * Update FPS tracking and display
     * @param {number} currentTime - Current timestamp from performance.now()
     */
    updateFPS(currentTime) {
        // Calculate frame time
        if (this.lastFrameTime > 0) {
            const frameTime = currentTime - this.lastFrameTime;
            this.frameTimes.push(frameTime);
            
            // Keep only the last N frames for rolling average
            if (this.frameTimes.length > this.maxFrameSamples) {
                this.frameTimes.shift();
            }
        }
        
        this.lastFrameTime = currentTime;
        
        // Update FPS display periodically
        if (currentTime - this.lastFpsUpdate >= this.fpsUpdateInterval) {
            this.updateFPSDisplay();
            this.lastFpsUpdate = currentTime;
        }
    }

    /**
     * Update the FPS display in the UI
     */
    updateFPSDisplay() {
        if (this.frameTimes.length === 0) return;
        
        // Calculate average frame time
        const avgFrameTime = this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;
        
        // Convert to FPS (1000ms / avgFrameTime)
        const fps = 1000 / avgFrameTime;
        
        // Update display
        const fpsElement = document.getElementById('fpsValue');
        if (fpsElement) {
            fpsElement.textContent = Math.round(fps).toString();
        }
        
        // Dispatch FPS event for other components that might want to track performance
        this.dispatchEvent('fpsUpdated', { fps: Math.round(fps) });
    }

    /**
     * Get current FPS
     * @returns {number} Current FPS
     */
    getCurrentFPS() {
        if (this.frameTimes.length === 0) return 0;
        
        const avgFrameTime = this.frameTimes.length > 0 
            ? this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length 
            : 0;
            
        return avgFrameTime > 0 ? Math.round(1000 / avgFrameTime) : 0;
    }

    /**
     * Export canvas state for saving
     * @returns {Object} Canvas state data
     */
    exportCanvasState() {
        return {
            width: this.canvas.width,
            height: this.canvas.height,
            filtering: this.canvasFiltering
        };
    }

    /**
     * Import canvas state from saved data
     * @param {Object} data - Canvas state data
     */
    importCanvasState(data) {
        if (data) {
            if (data.width && data.height) {
                this.resize(data.width, data.height);
            }
            if (data.filtering) {
                this.setCanvasFiltering(data.filtering);
            }
        }
    }

    /**
     * Export view state for saving
     * @returns {Object} View state data
     */
    exportViewState() {
        return {
            offset: { ...this.viewOffset },
            zoom: this.viewZoom,
            panZoomEnabled: this.panZoomEnabled
        };
    }

    /**
     * Import view state from saved data
     * @param {Object} data - View state data
     */
    importViewState(data) {
        if (data) {
            if (data.offset) {
                this.viewOffset = { ...data.offset };
            }
            if (data.zoom !== undefined) {
                this.viewZoom = data.zoom;
            }
            if (data.panZoomEnabled !== undefined) {
                this.panZoomEnabled = data.panZoomEnabled;
            }
            this.updateCanvasTransform();
        }
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
