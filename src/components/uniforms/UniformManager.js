import { DEFAULT_UNIFORMS, DEFAULT_SETTINGS, CONSTANTS } from '../../config/settings.js';
import { isValidUniformName, getDefaultValueForType } from '../../utils/validation.js';
import { UniformUI } from './UniformUI.js';

/**
 * UniformManager component for managing shader uniforms
 */
export class UniformManager {
    constructor() {
        this.uniforms = new Map();
        this.builtinAssociations = new Map();
        this.uniformUI = null;
        this.uniformList = null;
        this.init();
    }

    /**
     * Initialize the uniform manager
     */
    init() {
        this.setupUIElements();
        this.initializeDefaultUniforms();
        this.uniformUI = new UniformUI(this);
        this.generateDefaultUniformUI();
        this.createUniformPlaceholder();
        this.setupEventListeners();
        
        // Send initial uniforms to renderer
        this.sendUniformsToRenderer();
    }

    /**
     * Setup UI elements
     */
    setupUIElements() {
        this.uniformList = document.querySelector('.uniform-list');
        if (!this.uniformList) {
            console.warn('Uniform list element not found');
        }
    }

    /**
     * Initialize default uniforms
     */
    initializeDefaultUniforms() {
        DEFAULT_UNIFORMS.forEach(uniformConfig => {
            this.uniforms.set(uniformConfig.name, {
                type: uniformConfig.type,
                value: uniformConfig.value,
                default: uniformConfig.default
            });

            if (uniformConfig.builtin) {
                this.builtinAssociations.set(uniformConfig.name, uniformConfig.builtin);
            }
        });
    }

    /**
     * Generate UI for default uniforms
     */
    generateDefaultUniformUI() {
        DEFAULT_UNIFORMS.forEach(uniformConfig => {
            this.uniformUI.createUniformUI(
                uniformConfig.name,
                uniformConfig.type,
                uniformConfig.value,
                uniformConfig.default
            );
        });
    }

    /**
     * Create the uniform placeholder at the bottom of the list
     */
    createUniformPlaceholder() {
        if (!this.uniformList) return;

        const placeholderDiv = document.createElement('div');
        placeholderDiv.className = 'uniform-item-placeholder';
        placeholderDiv.id = 'uniformPlaceholder';

        const button = document.createElement('button');
        button.id = 'createUniformBtn';
        button.textContent = '+ Add New Uniform';
        button.addEventListener('click', () => {
            this.createEmptyUniform();
        });

        placeholderDiv.appendChild(button);
        this.uniformList.appendChild(placeholderDiv);
    }

    /**
     * Refresh the uniform placeholder position
     */
    refreshPlaceholder() {
        // Remove existing placeholder
        const existingPlaceholder = document.getElementById('uniformPlaceholder');
        if (existingPlaceholder) {
            existingPlaceholder.remove();
        }
        
        // Add it back at the bottom
        this.createUniformPlaceholder();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for uniform updates from renderer
        document.addEventListener('getUniforms', (e) => {
            this.sendUniformsToRenderer();
        });

        // Listen for uniform value changes
        document.addEventListener('uniformValueChanged', (e) => {
            this.updateUniformValue(e.detail.name, e.detail.value);
        });

        // Listen for uniform value updates from renderer
        document.addEventListener('uniformValuesUpdated', (e) => {
            this.onUniformValuesUpdated(e.detail.uniforms);
        });

        // Listen for resolution changes
        document.addEventListener('resolutionChanged', (e) => {
            // When resolution is applied to canvas, reset the manual edit flag
            this.resetResolutionManualFlag();
            
            const event = new CustomEvent('canvasResizeRequested', {
                detail: {
                    width: e.detail.width,
                    height: e.detail.height
                }
            });
            document.dispatchEvent(event);
        });

        // Listen for canvas resize events (from external sources)
        document.addEventListener('canvasResized', (e) => {
            // When canvas is resized externally, update resolution uniforms and reset manual flag
            this.resetResolutionManualFlag();
            this.updateResolutionFromCanvas(e.detail.width, e.detail.height);
        });
    }

    /**
     * Create an empty uniform for editing
     */
    createEmptyUniform() {
        // Check if there's already an editing uniform
        const existingEdit = document.querySelector('.uniform-item.editing');
        if (existingEdit) {
            existingEdit.querySelector('input[type="text"]').focus();
            return;
        }

        // Generate temporary ID for the new uniform
        const tempId = `temp_uniform_${Date.now()}`;
        
        // Create UI for empty uniform in editing mode
        this.uniformUI.createUniformEditUI(tempId);
    }

    /**
     * Confirm creation of a new uniform
     * @param {string} tempId - Temporary ID used during editing
     * @param {string} uniformName - The uniform name
     * @param {string} uniformType - The uniform type
     * @param {string} builtinType - The builtin type ('custom' if not builtin)
     * @returns {boolean} True if successful, false otherwise
     */
    confirmUniform(tempId, uniformName, uniformType, builtinType = 'custom') {
        // Validate uniform name
        if (!uniformName) {
            alert('Please enter a uniform name');
            return false;
        }

        if (!isValidUniformName(uniformName)) {
            alert('Invalid uniform name. Use only letters, numbers, and underscores. Must start with letter or underscore.');
            return false;
        }

        if (this.uniforms.has(uniformName)) {
            alert('Uniform with this name already exists');
            return false;
        }

        // Add uniform to collection
        const defaultValue = getDefaultValueForType(uniformType);
        this.uniforms.set(uniformName, { 
            type: uniformType, 
            value: defaultValue, 
            default: false 
        });

        // Set built-in association
        if (builtinType !== 'custom') {
            this.builtinAssociations.set(uniformName, builtinType);
        }

        // Remove the temporary editing UI
        const editElement = document.querySelector(`[data-name="${tempId}"]`);
        if (editElement) {
            editElement.remove();
        }

        // Create the actual uniform UI
        this.uniformUI.createUniformUI(uniformName, uniformType, defaultValue, false);

        // Refresh placeholder position
        this.refreshPlaceholder();

        // Notify about uniform change
        this.dispatchUniformsChanged();
        
        return true;
    }

    /**
     * Edit an existing uniform
     * @param {string} uniformName - The uniform name to edit
     */
    editUniform(uniformName) {
        // Check if there's already an editing uniform
        const existingEdit = document.querySelector('.uniform-item.editing');
        if (existingEdit) {
            existingEdit.querySelector('input[type="text"]').focus();
            return;
        }

        const uniform = this.uniforms.get(uniformName);
        if (!uniform) return;

        const builtinType = this.builtinAssociations.get(uniformName) || 'custom';
        const tempId = `edit_${uniformName}_${Date.now()}`;

        // Remove the current uniform UI
        const currentElement = document.querySelector(`[data-name="${uniformName}"]`);
        if (currentElement) {
            currentElement.remove();
        }

        // Create edit UI with existing values
        this.uniformUI.createUniformEditUI(tempId, uniformName, uniform.type, builtinType);
    }

    /**
     * Confirm editing of an existing uniform
     * @param {string} tempId - Temporary ID used during editing
     * @param {string} oldName - The original uniform name
     * @param {string} newName - The new uniform name
     * @param {string} newType - The new uniform type
     * @param {string} builtinType - The builtin type
     * @returns {boolean} True if successful, false otherwise
     */
    confirmEditUniform(tempId, oldName, newName, newType, builtinType) {
        // Validate new uniform name
        if (!newName) {
            alert('Please enter a uniform name');
            return false;
        }

        if (!isValidUniformName(newName)) {
            alert('Invalid uniform name. Use only letters, numbers, and underscores. Must start with letter or underscore.');
            return false;
        }

        if (newName !== oldName && this.uniforms.has(newName)) {
            alert('Uniform with this name already exists');
            return false;
        }

        // Get old uniform data
        const oldUniform = this.uniforms.get(oldName);
        if (!oldUniform) return false;

        // Remove old uniform if name changed
        if (newName !== oldName) {
            this.uniforms.delete(oldName);
            this.builtinAssociations.delete(oldName);
        }

        // Update uniform with new values
        let newValue;
        if (newType === oldUniform.type && newName === oldName) {
            // Keep existing value if type and name didn't change
            newValue = oldUniform.value;
        } else {
            // Reset to default value for new type
            newValue = getDefaultValueForType(newType);
        }

        this.uniforms.set(newName, {
            type: newType,
            value: newValue,
            default: oldUniform.default
        });

        // Update built-in association
        if (builtinType !== 'custom') {
            this.builtinAssociations.set(newName, builtinType);
        } else {
            this.builtinAssociations.delete(newName);
        }

        // Remove the temporary editing UI
        const editElement = document.querySelector(`[data-name="${tempId}"]`);
        if (editElement) {
            editElement.remove();
        }

        // Create the updated uniform UI
        this.uniformUI.createUniformUI(newName, newType, newValue, oldUniform.default);

        // Refresh placeholder position
        this.refreshPlaceholder();

        // Notify about uniform change
        this.dispatchUniformsChanged();

        return true;
    }

    /**
     * Cancel uniform editing
     * @param {string} tempId - Temporary ID used during editing
     */
    cancelUniform(tempId) {
        // Remove the temporary editing UI
        const editElement = document.querySelector(`[data-name="${tempId}"]`);
        if (editElement) {
            editElement.remove();
        }
    }

    /**
     * Remove a uniform
     * @param {string} uniformName - The uniform name to remove
     */
    removeUniform(uniformName) {
        const uniform = this.uniforms.get(uniformName);
        if (!uniform || uniform.default) {
            return; // Can't remove default uniforms or non-existent uniforms
        }

        this.uniforms.delete(uniformName);
        this.builtinAssociations.delete(uniformName);
        
        // Remove UI element
        const uniformElement = document.querySelector(`[data-name="${uniformName}"]`);
        if (uniformElement) {
            uniformElement.remove();
        }

        // Refresh placeholder position
        this.refreshPlaceholder();

        // Notify about uniform change
        this.dispatchUniformsChanged();
    }

    /**
     * Update a uniform value
     * @param {string} uniformName - The uniform name
     * @param {*} value - The new value
     * @param {boolean} isManualEdit - Whether this is a manual user edit (default: true)
     */
    updateUniformValue(uniformName, value, isManualEdit = true) {
        const uniform = this.uniforms.get(uniformName);
        if (!uniform) return;
        
        uniform.value = value;
        
        // Mark resolution uniforms as manually edited when changed by user
        const builtinType = this.builtinAssociations.get(uniformName);
        if (builtinType === 'resolution' && isManualEdit) {
            uniform.manuallyEdited = true;
        }
        
        // Update display
        this.uniformUI.updateValueDisplay(uniformName, uniform.type, value);
        
        // Notify about uniform change
        this.dispatchUniformsChanged();
    }

    /**
     * Reset the manual edit flag for resolution uniforms
     * Called when resolution is applied to canvas
     */
    resetResolutionManualFlag() {
        for (const [uniformName, builtinType] of this.builtinAssociations) {
            if (builtinType === 'resolution') {
                const uniform = this.uniforms.get(uniformName);
                if (uniform) {
                    uniform.manuallyEdited = false;
                }
            }
        }
    }

    /**
     * Update resolution uniforms from canvas dimensions
     * Called when canvas is resized externally
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    updateResolutionFromCanvas(width, height) {
        for (const [uniformName, builtinType] of this.builtinAssociations) {
            if (builtinType === 'resolution') {
                const uniform = this.uniforms.get(uniformName);
                if (uniform) {
                    uniform.value = [width, height];
                    uniform.manuallyEdited = false;
                    this.uniformUI.updateValueDisplay(uniformName, uniform.type, uniform.value);
                }
            }
        }
    }

    /**
     * Get all uniforms
     * @returns {Map} The uniforms map
     */
    getUniforms() {
        return this.uniforms;
    }

    /**
     * Get builtin associations
     * @returns {Map} The builtin associations map
     */
    getBuiltinAssociations() {
        return this.builtinAssociations;
    }

    /**
     * Get a specific uniform
     * @param {string} uniformName - The uniform name
     * @returns {Object|null} The uniform object or null if not found
     */
    getUniform(uniformName) {
        return this.uniforms.get(uniformName) || null;
    }

    /**
     * Check if a uniform exists
     * @param {string} uniformName - The uniform name
     * @returns {boolean} True if uniform exists
     */
    hasUniform(uniformName) {
        return this.uniforms.has(uniformName);
    }

    /**
     * Update built-in uniform values based on current state
     * @param {number} currentTime - Current time
     * @param {Object} mousePos - Mouse position
     * @param {Array} resolution - Canvas resolution
     */
    updateBuiltinUniforms(currentTime, mousePos, resolution) {
        for (const [uniformName, builtinType] of this.builtinAssociations) {
            const uniform = this.uniforms.get(uniformName);
            if (!uniform) continue;

            let newValue;
            switch (builtinType) {
                case 'time':
                    newValue = currentTime;
                    break;
                case 'resolution':
                    newValue = resolution;
                    break;
                case 'mouse':
                    newValue = [mousePos.x, mousePos.y];
                    break;
                default:
                    continue;
            }

            uniform.value = newValue;
            this.uniformUI.updateValueDisplay(uniformName, uniform.type, newValue);
        }
    }

    /**
     * Send uniforms to renderer
     */
    sendUniformsToRenderer() {
        const event = new CustomEvent('uniformsUpdate', {
            detail: {
                uniforms: this.uniforms,
                builtinAssociations: this.builtinAssociations
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Handle uniform value updates from renderer
     * @param {Array} uniforms - Array of updated uniforms
     */
    onUniformValuesUpdated(uniforms) {
        uniforms.forEach(uniform => {
            // Update internal uniform value
            const existingUniform = this.uniforms.get(uniform.name);
            if (existingUniform) {
                existingUniform.value = uniform.value;
            }

            // Update UI display
            this.uniformUI.updateUniformDisplay(uniform.name, uniform.type, uniform.value);
        });
    }

    /**
     * Dispatch uniforms changed event
     */
    dispatchUniformsChanged() {
        const event = new CustomEvent('uniformsChanged', {
            detail: {
                uniforms: this.uniforms,
                builtinAssociations: this.builtinAssociations
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Reset all uniforms to default values
     */
    resetUniforms() {
        // Clear all custom uniforms
        const customUniforms = Array.from(this.uniforms.keys()).filter(name => 
            !this.uniforms.get(name).default
        );
        
        customUniforms.forEach(name => {
            this.removeUniform(name);
        });

        // Reset default uniforms to default values
        DEFAULT_UNIFORMS.forEach(uniformConfig => {
            const uniform = this.uniforms.get(uniformConfig.name);
            if (uniform) {
                uniform.value = uniformConfig.value;
                this.uniformUI.updateValueDisplay(uniformConfig.name, uniform.type, uniform.value);
            }
        });

        this.dispatchUniformsChanged();
    }

    /**
     * Get uniform count
     * @returns {number} Number of uniforms
     */
    getUniformCount() {
        return this.uniforms.size;
    }

    /**
     * Export uniforms configuration
     * @returns {Object} Exportable uniforms data
     */
    async exportUniforms() {
        const uniformsArray = [];
        
        // Export all uniforms
        for (const [name, uniform] of this.uniforms) {
            let exportValue = uniform.value;
            
            // Special handling for texture uniforms
            if (uniform.type === 'texture') {
                const builtinType = this.builtinAssociations.get(name);
                
                // Skip serialization for lastFrame textures - they are generated dynamically
                if (builtinType === 'lastFrame') {
                    exportValue = null; // Export as null, will be recreated by renderer
                } else if (uniform.value && uniform.value.image) {
                    // Regular user textures - convert to base64
                    try {
                        // Convert image to base64 data URL
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const img = uniform.value.image;
                        
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        ctx.drawImage(img, 0, 0);
                        
                        const dataURL = canvas.toDataURL('image/png');
                        
                        exportValue = {
                            dataURL: dataURL,
                            filter: uniform.value.filter || 'linear',
                            wrapS: uniform.value.wrapS || 'clamp',
                            wrapT: uniform.value.wrapT || 'clamp',
                            isDataTexture: uniform.value.isDataTexture || false,
                            filename: uniform.value.file ? uniform.value.file.name : 'texture.png',
                            width: img.naturalWidth,
                            height: img.naturalHeight
                        };
                    } catch (error) {
                        console.warn(`Failed to export texture for uniform ${name}:`, error);
                        exportValue = null;
                    }
                }
            }
            
            uniformsArray.push({
                name: name,
                type: uniform.type,
                value: exportValue,
                default: uniform.default
            });
        }

        // Convert builtin associations to object
        const builtinAssociationsObj = {};
        for (const [name, builtinType] of this.builtinAssociations) {
            builtinAssociationsObj[name] = builtinType;
        }

        return {
            uniforms: uniformsArray,
            builtinAssociations: builtinAssociationsObj
        };
    }

    /**
     * Import uniforms configuration
     * @param {Object} data - Importable uniforms data
     */
    async importUniforms(data) {
        if (!data || !data.uniforms) return;

        // Clear existing custom uniforms
        this.resetUniforms();

        // Import builtin associations first so we can check for special uniforms
        if (data.builtinAssociations) {
            this.builtinAssociations.clear();
            for (const [name, builtinType] of Object.entries(data.builtinAssociations)) {
                this.builtinAssociations.set(name, builtinType);
            }
        }

        // Import uniforms
        for (const uniformData of data.uniforms) {
            if (!uniformData.default) {
                let importValue = uniformData.value;
                const builtinType = this.builtinAssociations.get(uniformData.name);
                
                // Special handling for texture uniforms
                if (uniformData.type === 'texture') {
                    if (builtinType === 'lastFrame') {
                        // LastFrame textures are generated dynamically by the renderer
                        // Set initial null value, renderer will populate it
                        importValue = null;
                    } else if (uniformData.value && uniformData.value.dataURL) {
                        // Regular user textures - restore from base64
                        try {
                            // Restore image from base64 data URL
                            const img = new Image();
                            img.onload = () => {
                                const textureData = {
                                    file: null, // We don't have the original file
                                    filter: uniformData.value.filter || 'linear',
                                    wrapS: uniformData.value.wrapS || 'clamp',
                                    wrapT: uniformData.value.wrapT || 'clamp',
                                    isDataTexture: uniformData.value.isDataTexture || false,
                                    image: img,
                                    texture: null,
                                    filename: uniformData.value.filename || 'texture.png'
                                };
                                
                                // Update the uniform value with restored texture
                                this.uniforms.set(uniformData.name, {
                                    type: uniformData.type,
                                    value: textureData,
                                    default: false
                                });
                                
                                // Update UI to show restored texture
                                this.uniformUI.updateValueDisplay(uniformData.name, uniformData.type, textureData);
                            };
                            img.src = uniformData.value.dataURL;
                            
                            // Set initial value while image loads
                            importValue = {
                                file: null,
                                filter: uniformData.value.filter || 'linear',
                                wrapS: uniformData.value.wrapS || 'clamp',
                                wrapT: uniformData.value.wrapT || 'clamp',
                                isDataTexture: uniformData.value.isDataTexture || false,
                                image: null,
                                texture: null,
                                filename: uniformData.value.filename || 'texture.png'
                            };
                        } catch (error) {
                            console.warn(`Failed to import texture for uniform ${uniformData.name}:`, error);
                            importValue = null;
                        }
                    }
                }
                
                this.uniforms.set(uniformData.name, {
                    type: uniformData.type,
                    value: importValue,
                    default: false
                });

                this.uniformUI.createUniformUI(
                    uniformData.name,
                    uniformData.type,
                    importValue,
                    false
                );
            }
        }

        // Refresh placeholder position
        this.refreshPlaceholder();

        this.dispatchUniformsChanged();
    }
} 
