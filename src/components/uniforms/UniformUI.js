import { DEFAULT_SETTINGS, CONSTANTS } from '../../config/settings.js';
import { debounce } from '../../utils/debounce.js';

/**
 * UniformUI component for creating and managing uniform UI elements
 */
export class UniformUI {
    constructor(uniformManager) {
        this.uniformManager = uniformManager;
        this.uniformList = document.querySelector('.uniform-list');
        
        // Debounced function for resolution changes to prevent excessive updates
        this.debouncedResolutionChange = debounce((width, height) => {
            const event = new CustomEvent('resolutionChanged', {
                detail: { width, height }
            });
            document.dispatchEvent(event);
        }, 300); // 300ms delay
    }

    /**
     * Create UI for a uniform
     * @param {string} uniformName - The uniform name
     * @param {string} uniformType - The uniform type
     * @param {*} defaultValue - The default value
     * @param {boolean} isDefault - Whether this is a default uniform
     */
    createUniformUI(uniformName, uniformType, defaultValue, isDefault = false) {
        if (!this.uniformList) return;

        const uniformDiv = document.createElement('div');
        uniformDiv.className = `uniform-item ${isDefault ? 'default-uniform' : 'custom-uniform'}`;
        uniformDiv.setAttribute('data-name', uniformName);
        uniformDiv.setAttribute('data-type', uniformType);

        // Create main container
        const mainContainer = document.createElement('div');
        mainContainer.className = 'uniform-main-container';

        // Create header section (always visible)
        const headerDiv = this.createHeaderSection(uniformName, uniformType, isDefault);
        
        // Create details section (collapsible)
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'uniform-details';
        
        // Create value control
        const valueControl = this.createValueControl(uniformName, uniformType, defaultValue);
        valueControl.id = `${uniformName}Value`;
        
        detailsDiv.appendChild(valueControl);

        mainContainer.appendChild(headerDiv);
        mainContainer.appendChild(detailsDiv);
        
        uniformDiv.appendChild(mainContainer);
        
        // Insert before the placeholder button instead of appending to the end
        const placeholder = document.getElementById('uniformPlaceholder');
        if (placeholder) {
            this.uniformList.insertBefore(uniformDiv, placeholder);
        } else {
            this.uniformList.appendChild(uniformDiv);
        }

        // Restore collapsed state from localStorage
        const collapsedUniforms = JSON.parse(localStorage.getItem('collapsedUniforms') || '[]');
        if (collapsedUniforms.includes(uniformName)) {
            uniformDiv.classList.add('collapsed');
            detailsDiv.style.display = 'none';
            const toggleBtn = uniformDiv.querySelector('.collapse-toggle-btn');
            if (toggleBtn) {
                toggleBtn.textContent = '▶';
                toggleBtn.title = 'Expand uniform details';
            }
        }
    }

    /**
     * Create header section for uniform (name, type, buttons, toggle)
     * @param {string} uniformName - The uniform name
     * @param {string} uniformType - The uniform type
     * @param {boolean} isDefault - Whether this is a default uniform
     * @returns {HTMLElement} The header section element
     */
    createHeaderSection(uniformName, uniformType, isDefault) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'uniform-info';
        
        // Top row with name and buttons
        const topRowDiv = document.createElement('div');
        topRowDiv.className = 'uniform-top-row';
        
        // Make the header clickable to toggle collapse
        topRowDiv.style.cursor = 'pointer';
        topRowDiv.addEventListener('click', (e) => {
            // Only toggle if clicked on the header itself, not on buttons
            if (e.target === topRowDiv || e.target.classList.contains('uniform-name')) {
                this.toggleUniformCollapse(uniformName);
            }
        });
        
        const nameSpan = document.createElement('div');
        nameSpan.className = 'uniform-name';
        nameSpan.textContent = uniformName;
        
        // Button container
        const topButtonsDiv = document.createElement('div');
        topButtonsDiv.className = 'uniform-top-buttons';
        
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = '✎';
        editBtn.title = 'Edit uniform';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.uniformManager.editUniform(uniformName);
        });
        topButtonsDiv.appendChild(editBtn);
        
        // Delete button for custom uniforms
        if (!isDefault) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '×';
            deleteBtn.title = 'Remove uniform';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.uniformManager.removeUniform(uniformName);
            });
            topButtonsDiv.appendChild(deleteBtn);
        }
        
        // Collapse toggle button (rightmost)
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'collapse-toggle-btn';
        toggleBtn.textContent = '▼';
        toggleBtn.title = 'Toggle uniform details';
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleUniformCollapse(uniformName);
        });
        topButtonsDiv.appendChild(toggleBtn);
        
        topRowDiv.appendChild(nameSpan);
        topRowDiv.appendChild(topButtonsDiv);
        
        // Meta information
        const metaDiv = document.createElement('div');
        metaDiv.className = 'uniform-meta';
        metaDiv.style.cursor = 'pointer';
        metaDiv.addEventListener('click', () => {
            this.toggleUniformCollapse(uniformName);
        });
        
        const typeSpan = document.createElement('span');
        typeSpan.className = 'uniform-type';
        typeSpan.textContent = uniformType;
        metaDiv.appendChild(typeSpan);

        // Show built-in association
        const builtinType = this.uniformManager.builtinAssociations.get(uniformName);
        if (builtinType) {
            const builtinSpan = document.createElement('span');
            builtinSpan.className = 'uniform-builtin';
            builtinSpan.textContent = builtinType;
            metaDiv.appendChild(builtinSpan);
        }
        
        infoDiv.appendChild(topRowDiv);
        infoDiv.appendChild(metaDiv);
        
        return infoDiv;
    }

    /**
     * Get description for builtin uniform types
     * @param {string} builtinType - The builtin type
     * @returns {string} Human-readable description
     */
    getBuiltinDescription(builtinType) {
        switch (builtinType) {
            case 'time':
                return 'animation time';
            case 'resolution':
                return 'canvas resolution';
            case 'mouse':
                return 'mouse position';
            case 'lastFrame':
                return 'previous frame texture';
            case 'keyState':
                return 'keyboard input';
            default:
                return 'system value';
        }
    }

    /**
     * Create value control for uniform
     * @param {string} uniformName - The uniform name
     * @param {string} uniformType - The uniform type
     * @param {*} defaultValue - The default value
     * @returns {HTMLElement} The value control element
     */
    createValueControl(uniformName, uniformType, defaultValue) {
        const builtinType = this.uniformManager.builtinAssociations.get(uniformName);
        
        // For all built-in uniforms, show "Linked to [description]" with current value
        if (builtinType && builtinType !== 'custom') {
            const display = document.createElement('span');
            display.className = 'uniform-value readonly linked';
            
            const description = this.getBuiltinDescription(builtinType);
            const currentValue = this.formatValueForDisplay(uniformType, defaultValue);
            
            // Special handling for key state uniforms
            if (builtinType === 'keyState') {
                const uniform = this.uniformManager.getUniform(uniformName);
                const keyCode = uniform ? uniform.keyCode : null;
                const keyLabel = keyCode ? this.getKeyDisplayName(keyCode) : 'No key';
                display.innerHTML = `<em>Linked to ${description}</em><br><small>${currentValue} (${keyLabel})</small>`;
            } else {
                display.innerHTML = `<em>Linked to ${description}</em><br><small>${currentValue}</small>`;
            }
            
            return display;
        }
        
        // For custom uniforms, create interactive controls
        switch (uniformType) {
            case 'float':
                return this.createFloatControl(uniformName, defaultValue);
            case 'int':
                return this.createIntControl(uniformName, defaultValue);
            case 'bool':
                return this.createBoolControl(uniformName, defaultValue);
            case 'vec2':
            case 'vec3':
            case 'vec4':
                return this.createVecControl(uniformName, uniformType, defaultValue);
            case 'texture':
                return this.createTextureControl(uniformName, defaultValue);
            default:
                const fallback = document.createElement('span');
                fallback.className = 'uniform-value';
                fallback.textContent = 'Unknown type';
                return fallback;
        }
    }

    /**
     * Create float control
     * @param {string} uniformName - The uniform name
     * @param {number} defaultValue - The default value
     * @returns {HTMLElement} The float control element
     */
    createFloatControl(uniformName, defaultValue) {
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '0.01';
        input.value = defaultValue;
        input.className = 'uniform-value editable';
        input.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.uniformManager.updateUniformValue(uniformName, value);
        });
        return input;
    }

    /**
     * Create int control
     * @param {string} uniformName - The uniform name
     * @param {number} defaultValue - The default value
     * @returns {HTMLElement} The int control element
     */
    createIntControl(uniformName, defaultValue) {
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '1';
        input.value = defaultValue;
        input.className = 'uniform-value editable';
        input.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.uniformManager.updateUniformValue(uniformName, value);
        });
        return input;
    }

    /**
     * Create bool control
     * @param {string} uniformName - The uniform name
     * @param {boolean} defaultValue - The default value
     * @returns {HTMLElement} The bool control element
     */
    createBoolControl(uniformName, defaultValue) {
        const container = document.createElement('div');
        container.className = 'uniform-value bool-control clickable';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = defaultValue;
        checkbox.id = `${uniformName}Checkbox`;
        
        const label = document.createElement('label');
        label.htmlFor = `${uniformName}Checkbox`;
        label.textContent = defaultValue ? 'true' : 'false';
        label.className = 'bool-label';
        
        const updateValue = () => {
            label.textContent = checkbox.checked ? 'true' : 'false';
            this.uniformManager.updateUniformValue(uniformName, checkbox.checked);
        };
        
        checkbox.addEventListener('change', updateValue);
        container.addEventListener('click', (e) => {
            if (e.target === checkbox) return;
            checkbox.checked = !checkbox.checked;
            updateValue();
        });
        
        container.appendChild(checkbox);
        container.appendChild(label);
        return container;
    }

    /**
     * Create vector control
     * @param {string} uniformName - The uniform name
     * @param {string} uniformType - The uniform type
     * @param {Array} defaultValue - The default value
     * @returns {HTMLElement} The vector control element
     */
    createVecControl(uniformName, uniformType, defaultValue) {
        const container = document.createElement('div');
        container.className = 'uniform-value vec-control';
        
        const componentCount = parseInt(uniformType.slice(-1));
        const labels = CONSTANTS.VECTOR_COMPONENT_LABELS;
        const inputs = [];
        
        // Check if this is a resolution uniform for special handling
        const builtinType = this.uniformManager.builtinAssociations.get(uniformName);
        const isResolution = builtinType === 'resolution';

        for (let i = 0; i < componentCount; i++) {
            const inputContainer = document.createElement('div');
            inputContainer.className = 'vec-input-item';
            
            const label = document.createElement('label');
            label.textContent = labels[i];
            label.className = 'vec-label';
            
            const input = document.createElement('input');
            input.type = 'number';
            input.step = isResolution ? '1' : '0.01';
            input.min = isResolution ? '1' : undefined;
            input.max = isResolution ? '4096' : undefined;
            input.value = isResolution ? Math.round(defaultValue[i]) : defaultValue[i];
            input.className = 'vec-input';
            input.addEventListener('input', () => {
                const values = inputs.map(inp => isResolution ? parseInt(inp.value) : parseFloat(inp.value));
                this.uniformManager.updateUniformValue(uniformName, values);
                
                // For resolution uniforms, also apply to canvas with debouncing
                if (isResolution && values.length >= 2) {
                    this.debouncedResolutionChange(Math.round(values[0]), Math.round(values[1]));
                }
            });

            inputs.push(input);
            inputContainer.appendChild(label);
            inputContainer.appendChild(input);
            container.appendChild(inputContainer);
        }

        return container;
    }

    /**
     * Create texture control with preview and filter options
     * @param {string} uniformName - The uniform name
     * @param {*} defaultValue - The default value
     * @returns {HTMLElement} The texture control element
     */
    createTextureControl(uniformName, defaultValue) {
        const container = document.createElement('div');
        container.className = 'uniform-value texture-control';
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        const dropZone = document.createElement('div');
        dropZone.className = 'texture-drop-zone';
        dropZone.textContent = 'Drop image here or click to select';
        
        // Create texture preview container (initially hidden)
        const previewContainer = document.createElement('div');
        previewContainer.className = 'texture-preview-container';
        previewContainer.style.display = 'none';
        
        const preview = document.createElement('img');
        preview.className = 'texture-preview';
        preview.style.maxWidth = '100%';
        preview.style.maxHeight = '120px';
        preview.style.objectFit = 'contain';
        
        // Create filter controls
        const filterContainer = document.createElement('div');
        filterContainer.className = 'texture-filter-container';
        
        // Filter row
        const filterRow = document.createElement('div');
        filterRow.className = 'texture-control-row';
        
        const filterLabel = document.createElement('label');
        filterLabel.className = 'texture-filter-label';
        filterLabel.textContent = 'Filter:';
        
        const filterSelect = document.createElement('select');
        filterSelect.className = 'texture-filter-select';
        
        const linearOption = document.createElement('option');
        linearOption.value = 'linear';
        linearOption.textContent = 'Linear';
        filterSelect.appendChild(linearOption);
        
        const nearestOption = document.createElement('option');
        nearestOption.value = 'nearest';
        nearestOption.textContent = 'Nearest';
        filterSelect.appendChild(nearestOption);
        
        filterRow.appendChild(filterLabel);
        filterRow.appendChild(filterSelect);
        
        // Wrap S row
        const wrapSRow = document.createElement('div');
        wrapSRow.className = 'texture-control-row';
        
        const wrapSLabel = document.createElement('label');
        wrapSLabel.className = 'texture-filter-label';
        wrapSLabel.textContent = 'Wrap S:';
        
        const wrapSSelect = document.createElement('select');
        wrapSSelect.className = 'texture-filter-select';
        
        const wrapSOptions = [
            { value: 'clamp', text: 'Clamp' },
            { value: 'repeat', text: 'Repeat' },
            { value: 'mirror', text: 'Mirror' }
        ];
        
        wrapSOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            wrapSSelect.appendChild(optionElement);
        });
        
        wrapSRow.appendChild(wrapSLabel);
        wrapSRow.appendChild(wrapSSelect);
        
        // Wrap T row
        const wrapTRow = document.createElement('div');
        wrapTRow.className = 'texture-control-row';
        
        const wrapTLabel = document.createElement('label');
        wrapTLabel.className = 'texture-filter-label';
        wrapTLabel.textContent = 'Wrap T:';
        
        const wrapTSelect = document.createElement('select');
        wrapTSelect.className = 'texture-filter-select';
        
        const wrapTOptions = [
            { value: 'clamp', text: 'Clamp' },
            { value: 'repeat', text: 'Repeat' },
            { value: 'mirror', text: 'Mirror' }
        ];
        
        wrapTOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            wrapTSelect.appendChild(optionElement);
        });
        
        wrapTRow.appendChild(wrapTLabel);
        wrapTRow.appendChild(wrapTSelect);
        
        // Data texture row
        const dataTextureRow = document.createElement('div');
        dataTextureRow.className = 'texture-control-row';
        
        const dataTextureLabel = document.createElement('label');
        dataTextureLabel.className = 'texture-filter-label';
        dataTextureLabel.textContent = 'Data:';
        dataTextureLabel.title = 'Enable for textures containing raw data values instead of colors';
        
        const dataTextureCheckbox = document.createElement('input');
        dataTextureCheckbox.type = 'checkbox';
        dataTextureCheckbox.className = 'texture-data-checkbox';
        dataTextureCheckbox.title = 'Use linear color space and nearest filtering for data textures';
        
        dataTextureRow.appendChild(dataTextureLabel);
        dataTextureRow.appendChild(dataTextureCheckbox);
        
        // Clear button row
        const clearRow = document.createElement('div');
        clearRow.className = 'texture-control-row';
        clearRow.style.justifyContent = 'flex-end';
        
        const clearBtn = document.createElement('button');
        clearBtn.className = 'texture-clear-btn';
        clearBtn.textContent = '×';
        clearBtn.title = 'Remove texture';
        
        clearRow.appendChild(clearBtn);
        
        // Add all rows to container
        filterContainer.appendChild(filterRow);
        filterContainer.appendChild(wrapSRow);
        filterContainer.appendChild(wrapTRow);
        filterContainer.appendChild(dataTextureRow);
        filterContainer.appendChild(clearRow);
        
        // Resolution info element
        const resolutionInfo = document.createElement('div');
        resolutionInfo.className = 'texture-resolution-info';
        resolutionInfo.textContent = 'No texture loaded';

        previewContainer.appendChild(preview);
        previewContainer.appendChild(resolutionInfo);
        previewContainer.appendChild(filterContainer);
        
        // Function to handle file processing (shared between file input and drag/drop)
        const processFile = (file) => {
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const textureData = {
                            file: file,
                            filename: file.name,
                            filter: filterSelect.value || 'linear',
                            wrapS: wrapSSelect.value || 'clamp',
                            wrapT: wrapTSelect.value || 'clamp',
                            isDataTexture: dataTextureCheckbox.checked,
                            image: img,
                            texture: null
                        };
                        this.uniformManager.updateUniformValue(uniformName, textureData);
                        
                        // Update the resolution info immediately
                        const resolutionInfo = container.querySelector('.texture-resolution-info');
                        if (resolutionInfo) {
                            const width = img.naturalWidth || img.width || 0;
                            const height = img.naturalHeight || img.height || 0;
                            const fileSize = this.formatFileSize(file.size);
                            const aspectRatio = this.formatAspectRatio(width, height);
                            const aspectInfo = aspectRatio ? ` • ${aspectRatio}` : '';
                            resolutionInfo.textContent = `${width} × ${height}${aspectInfo} • ${fileSize}`;
                        }
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        
        // Click to select file
        dropZone.addEventListener('click', () => fileInput.click());
        
        // File input change handler
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                processFile(e.target.files[0]);
            }
        });
        
        // Filter change handler
        filterSelect.addEventListener('change', (e) => {
            const uniform = this.uniformManager.uniforms.get(uniformName);
            if (uniform && uniform.value && uniform.value.image) {
                uniform.value.filter = e.target.value;
                uniform.value.needsUpdate = true; // Flag to recreate WebGL texture
                this.uniformManager.updateUniformValue(uniformName, uniform.value);
            }
        });
        
        // Wrap S change handler
        wrapSSelect.addEventListener('change', (e) => {
            const uniform = this.uniformManager.uniforms.get(uniformName);
            if (uniform && uniform.value && uniform.value.image) {
                uniform.value.wrapS = e.target.value;
                uniform.value.needsUpdate = true; // Flag to recreate WebGL texture
                this.uniformManager.updateUniformValue(uniformName, uniform.value);
            }
        });
        
        // Wrap T change handler
        wrapTSelect.addEventListener('change', (e) => {
            const uniform = this.uniformManager.uniforms.get(uniformName);
            if (uniform && uniform.value && uniform.value.image) {
                uniform.value.wrapT = e.target.value;
                uniform.value.needsUpdate = true; // Flag to recreate WebGL texture
                this.uniformManager.updateUniformValue(uniformName, uniform.value);
            }
        });
        
        // Data texture change handler
        dataTextureCheckbox.addEventListener('change', (e) => {
            const uniform = this.uniformManager.uniforms.get(uniformName);
            if (uniform && uniform.value && uniform.value.image) {
                uniform.value.isDataTexture = e.target.checked;
                uniform.value.needsUpdate = true; // Flag to recreate WebGL texture
                this.uniformManager.updateUniformValue(uniformName, uniform.value);
            }
        });
        
        // Clear button handler
        clearBtn.addEventListener('click', () => {
            this.uniformManager.updateUniformValue(uniformName, null);
        });
        
        // Drag and drop handlers
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Only remove drag-over if we're actually leaving the drop zone
            if (!dropZone.contains(e.relatedTarget)) {
                dropZone.classList.remove('drag-over');
            }
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                processFile(files[0]);
            }
        });
        
        // Initialize with default value if provided
        if (defaultValue) {
            // The display will be updated automatically when the uniform manager processes this
            setTimeout(() => {
                this.updateTextureControlDisplay(container, defaultValue);
                
                // Update resolution info immediately if texture is already loaded
                if (defaultValue && defaultValue.image) {
                    const resolutionInfo = container.querySelector('.texture-resolution-info');
                    if (resolutionInfo) {
                        const width = defaultValue.image.naturalWidth || defaultValue.image.width || 0;
                        const height = defaultValue.image.naturalHeight || defaultValue.image.height || 0;
                        const fileSize = defaultValue.file ? this.formatFileSize(defaultValue.file.size) : '';
                        const aspectRatio = this.formatAspectRatio(width, height);
                        const aspectInfo = aspectRatio ? ` • ${aspectRatio}` : '';
                        const sizeInfo = fileSize ? ` • ${fileSize}` : '';
                        resolutionInfo.textContent = `${width} × ${height}${aspectInfo}${sizeInfo}`;
                    }
                }
            }, 0);
        }
        
        container.appendChild(fileInput);
        container.appendChild(dropZone);
        container.appendChild(previewContainer);
        
        return container;
    }

    /**
     * Create time control buttons
     * @param {string} uniformName - The uniform name
     * @returns {HTMLElement} The time buttons element
     */
    createTimeButtons(uniformName) {
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'time-button-group';

        const playPauseBtn = document.createElement('button');
        playPauseBtn.textContent = '▶';
        playPauseBtn.id = `${uniformName}PlayPause`;
        playPauseBtn.addEventListener('click', () => {
            const event = new CustomEvent('animationToggled', {
                detail: { uniformName: uniformName }
            });
            document.dispatchEvent(event);
        });

        const resetBtn = document.createElement('button');
        resetBtn.textContent = '⏹';
        resetBtn.addEventListener('click', () => {
            const event = new CustomEvent('animationReset', {
                detail: { uniformName: uniformName }
            });
            document.dispatchEvent(event);
        });

        // Create reset on compile checkbox
        const resetCompileContainer = document.createElement('div');
        resetCompileContainer.className = 'time-reset-compile-control';

        const resetCompileCheckbox = document.createElement('input');
        resetCompileCheckbox.type = 'checkbox';
        resetCompileCheckbox.id = `${uniformName}ResetOnCompile`;
        resetCompileCheckbox.checked = true; // Enabled by default
        resetCompileCheckbox.addEventListener('change', (e) => {
            const event = new CustomEvent('timeResetOnCompileChanged', {
                detail: { 
                    uniformName: uniformName,
                    enabled: e.target.checked 
                }
            });
            document.dispatchEvent(event);
        });

        const resetCompileLabel = document.createElement('label');
        resetCompileLabel.htmlFor = `${uniformName}ResetOnCompile`;
        resetCompileLabel.textContent = 'Reset on compile';
        resetCompileLabel.className = 'time-reset-compile-label';

        resetCompileContainer.appendChild(resetCompileCheckbox);
        resetCompileContainer.appendChild(resetCompileLabel);

        buttonGroup.appendChild(playPauseBtn);
        buttonGroup.appendChild(resetBtn);
        buttonGroup.appendChild(resetCompileContainer);
        
        return buttonGroup;
    }

    /**
     * Create resolution control buttons
     * @param {string} uniformName - The uniform name
     * @returns {HTMLElement} The resolution buttons element
     */
    createResolutionButtons(uniformName) {
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'resolution-button-group';

        // Common resolution presets
        const presetContainer = document.createElement('div');
        presetContainer.className = 'resolution-presets';
        
        const presets = [
            { label: '512×512', width: 512, height: 512 },
            { label: '1024×1024', width: 1024, height: 1024 },
            { label: '1920×1080', width: 1920, height: 1080 },
            { label: '1280×720', width: 1280, height: 720 }
        ];

        presets.forEach(preset => {
            const presetBtn = document.createElement('button');
            const aspectRatio = this.formatAspectRatio(preset.width, preset.height);
            presetBtn.textContent = `${preset.label} (${aspectRatio})`;
            presetBtn.className = 'resolution-preset-btn';
            presetBtn.title = `Set resolution to ${preset.label}`;
            presetBtn.addEventListener('click', () => {
                // Update the uniform value
                this.uniformManager.updateUniformValue(uniformName, [preset.width, preset.height]);
                
                // Apply to canvas immediately
                const event = new CustomEvent('resolutionChanged', {
                    detail: { 
                        width: preset.width,
                        height: preset.height
                    }
                });
                document.dispatchEvent(event);
            });
            presetContainer.appendChild(presetBtn);
        });

        buttonGroup.appendChild(presetContainer);

        return buttonGroup;
    }

    /**
     * Format a value for display in the UI
     * @param {string} type - The uniform type
     * @param {*} value - The value to format
     * @returns {string} The formatted value
     */
    formatValueForDisplay(type, value) {
        switch (type) {
            case 'float':
                return value.toFixed(2);
            case 'int':
                return value.toString();
            case 'bool':
                return value ? 'true' : 'false';
            case 'vec2':
                return `(${value[0].toFixed(2)}, ${value[1].toFixed(2)})`;
            case 'vec3':
                return `(${value[0].toFixed(2)}, ${value[1].toFixed(2)}, ${value[2].toFixed(2)})`;
            case 'vec4':
                return `(${value[0].toFixed(2)}, ${value[1].toFixed(2)}, ${value[2].toFixed(2)}, ${value[3].toFixed(2)})`;
            case 'texture':
                if (value && value.isLastFrame) {
                    // Special display for lastFrame textures - show canvas resolution
                    const canvas = document.getElementById('glCanvas');
                    if (canvas) {
                        const aspectRatio = this.formatAspectRatio(canvas.width, canvas.height);
                        const aspectInfo = aspectRatio ? ` • ${aspectRatio}` : '';
                        return `Previous Frame (${canvas.width}×${canvas.height}${aspectInfo})`;
                    }
                    return 'Previous Frame';
                } else if (value && value.image) {
                    const filename = value.filename || (value.file ? value.file.name : 'texture');
                    const width = value.image.naturalWidth || value.image.width || 0;
                    const height = value.image.naturalHeight || value.image.height || 0;
                    const aspectRatio = this.formatAspectRatio(width, height);
                    const aspectInfo = aspectRatio ? ` • ${aspectRatio}` : '';
                    return `${filename} (${width}×${height}${aspectInfo})`;
                } else if (value && value.filename) {
                    return `${value.filename} (Loading...)`;
                }
                return value ? 'Loaded (Unknown size)' : 'None';
            default:
                return String(value);
        }
    }

    /**
     * Update play/pause button states for all time uniforms
     * @param {boolean} isPlaying - Whether animation is playing
     */
    updateTimeButtons(isPlaying) {
        // Update all play/pause buttons
        for (const [uniformName, builtinType] of this.uniformManager.builtinAssociations) {
            if (builtinType === 'time') {
                const btn = document.getElementById(`${uniformName}PlayPause`);
                if (btn) {
                    btn.textContent = isPlaying ? '⏸' : '▶';
                }
            }
        }
    }

    /**
     * Update the display for a specific uniform
     * @param {string} uniformName - The uniform name
     * @param {string} type - The uniform type
     * @param {*} value - The new value
     */
    updateUniformDisplay(uniformName, type, value) {
        const element = document.getElementById(`${uniformName}Value`);
        if (!element) return;

        // Update the display based on element type
        if (element.classList.contains('readonly')) {
            // For read-only displays, update text content
            element.textContent = this.formatValueForDisplay(type, value);
        } else if (element.classList.contains('editable')) {
            // For editable input controls, update value
            switch (type) {
                case 'float':
                    element.value = value.toFixed(2);
                    break;
                case 'int':
                    element.value = value.toString();
                    break;
            }
        } else if (element.classList.contains('bool-control')) {
            // For boolean controls
            const checkbox = element.querySelector('input[type="checkbox"]');
            const label = element.querySelector('.bool-label');
            if (checkbox && label) {
                checkbox.checked = value;
                label.textContent = value ? 'true' : 'false';
            }
        } else if (element.classList.contains('vec-control')) {
            // For vector controls
            const inputs = element.querySelectorAll('.vec-input');
            inputs.forEach((input, index) => {
                if (index < value.length) {
                    input.value = value[index].toFixed(2);
                }
            });
        }
    }

    /**
     * Get display name for a key code
     * @param {string} keyCode - The key code (e.g., 'Space', 'Mouse0')
     * @returns {string} User-friendly display name
     */
    getKeyDisplayName(keyCode) {
        // Handle mouse buttons
        if (keyCode.startsWith('Mouse')) {
            const buttonNum = keyCode.replace('Mouse', '');
            switch (buttonNum) {
                case '0': return 'Left Mouse Button';
                case '1': return 'Middle Mouse Button';
                case '2': return 'Right Mouse Button';
                default: return `Mouse Button ${buttonNum}`;
            }
        }
        
        // Handle common keyboard keys
        const keyMappings = {
            'Space': 'Spacebar',
            'Enter': 'Enter',
            'Escape': 'Escape',
            'Tab': 'Tab',
            'ShiftLeft': 'Left Shift',
            'ShiftRight': 'Right Shift',
            'ControlLeft': 'Left Ctrl',
            'ControlRight': 'Right Ctrl',
            'AltLeft': 'Left Alt',
            'AltRight': 'Right Alt',
            'ArrowUp': 'Up Arrow',
            'ArrowDown': 'Down Arrow',
            'ArrowLeft': 'Left Arrow',
            'ArrowRight': 'Right Arrow'
        };
        
        // Handle letter keys (KeyA -> A)
        if (keyCode.startsWith('Key')) {
            return keyCode.replace('Key', '');
        }
        
        // Handle digit keys (Digit0 -> 0)
        if (keyCode.startsWith('Digit')) {
            return keyCode.replace('Digit', '');
        }
        
        // Return mapped name or original code
        return keyMappings[keyCode] || keyCode;
    }

    /**
     * Create uniform edit UI
     * @param {string} tempId - Temporary ID for the editing uniform
     * @param {string} existingName - Existing uniform name (for editing)
     * @param {string} existingType - Existing uniform type (for editing)
     * @param {string} existingBuiltin - Existing builtin type (for editing)
     */
    createUniformEditUI(tempId, existingName = '', existingType = 'float', existingBuiltin = 'custom') {
        if (!this.uniformList) return;

        const uniformDiv = document.createElement('div');
        uniformDiv.className = 'uniform-item editing';
        uniformDiv.setAttribute('data-name', tempId);

        // Create configuration row
        const configDiv = document.createElement('div');
        configDiv.className = 'uniform-config-row';

        // Name input
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'uniform name';
        nameInput.maxLength = CONSTANTS.UNIFORM_NAME_MAX_LENGTH;
        nameInput.value = existingName;
        
        // Type select
        const typeSelect = document.createElement('select');
        DEFAULT_SETTINGS.uniforms.allowedTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            if (type === existingType) option.selected = true;
            typeSelect.appendChild(option);
        });

        // Built-in select
        const builtinSelect = document.createElement('select');
        builtinSelect.className = 'builtin-select';
        DEFAULT_SETTINGS.uniforms.builtinTypes.forEach(builtin => {
            const option = document.createElement('option');
            option.value = builtin.value;
            option.textContent = builtin.label;
            if (builtin.value === existingBuiltin) option.selected = true;
            builtinSelect.appendChild(option);
        });

        // Key recording for keyState builtin (initially hidden)
        const keyRecordDiv = document.createElement('div');
        keyRecordDiv.className = 'key-record-container';
        keyRecordDiv.style.display = existingBuiltin === 'keyState' ? 'block' : 'none';
        
        const keyDisplay = document.createElement('div');
        keyDisplay.className = 'key-display';
        
        const keyRecordBtn = document.createElement('button');
        keyRecordBtn.className = 'key-record-btn';
        keyRecordBtn.type = 'button';
        
        // State management for key recording
        let recordedKeyCode = '';
        let isRecording = false;
        
        // Set existing key if editing
        const existingUniform = this.uniformManager.getUniform(existingName);
        if (existingUniform && existingUniform.keyCode) {
            recordedKeyCode = existingUniform.keyCode;
        }
        
        const updateKeyDisplay = () => {
            if (recordedKeyCode) {
                const keyName = this.getKeyDisplayName(recordedKeyCode);
                keyDisplay.textContent = `Selected: ${keyName}`;
                keyRecordBtn.textContent = 'Change Key';
            } else {
                keyDisplay.textContent = 'No key selected';
                keyRecordBtn.textContent = 'Record Key';
            }
        };
        
        const startRecording = () => {
            if (isRecording) return;
            
            isRecording = true;
            keyRecordBtn.textContent = 'Press any key or mouse button...';
            keyRecordBtn.disabled = true;
            keyDisplay.textContent = 'Listening for input...';
            
            // Key recording event handlers
            const handleKeyDown = (e) => {
                e.preventDefault();
                e.stopPropagation();
                recordedKeyCode = e.code;
                stopRecording();
            };
            
            const handleMouseDown = (e) => {
                e.preventDefault();
                e.stopPropagation();
                recordedKeyCode = `Mouse${e.button}`;
                stopRecording();
            };
            
            const stopRecording = () => {
                if (!isRecording) return;
                
                isRecording = false;
                keyRecordBtn.disabled = false;
                
                // Remove event listeners
                document.removeEventListener('keydown', handleKeyDown, true);
                document.removeEventListener('mousedown', handleMouseDown, true);
                
                updateKeyDisplay();
            };
            
            // Add event listeners with capture=true to intercept before other handlers
            document.addEventListener('keydown', handleKeyDown, true);
            document.addEventListener('mousedown', handleMouseDown, true);
            
            // Auto-cancel after 10 seconds
            setTimeout(() => {
                if (isRecording) {
                    stopRecording();
                }
            }, 10000);
        };
        
        keyRecordBtn.addEventListener('click', startRecording);
        
        updateKeyDisplay();
        
        keyRecordDiv.appendChild(keyDisplay);
        keyRecordDiv.appendChild(keyRecordBtn);

        // Show/hide key recording based on builtin type
        builtinSelect.addEventListener('change', () => {
            if (builtinSelect.value === 'keyState') {
                keyRecordDiv.style.display = 'block';
                typeSelect.value = 'bool'; // Force bool type for key states
                typeSelect.disabled = true;
            } else {
                keyRecordDiv.style.display = 'none';
                typeSelect.disabled = false;
            }
        });

        // Force bool type and disable type selection for keyState
        if (existingBuiltin === 'keyState') {
            typeSelect.value = 'bool';
            typeSelect.disabled = true;
        }

        // Confirm button
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'confirm-btn';
        confirmBtn.textContent = '✓';
        confirmBtn.title = 'Confirm uniform';
        
        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn';
        cancelBtn.textContent = '×';
        cancelBtn.title = 'Cancel';

        // Event handlers
        const handleConfirm = () => {
            const name = nameInput.value.trim();
            const type = typeSelect.value;
            const builtin = builtinSelect.value;
            
            // For keyState uniforms, validate that a key is recorded
            if (builtin === 'keyState' && !recordedKeyCode) {
                alert('Please record a key for the key state uniform');
                return;
            }
            
            const keyCode = builtin === 'keyState' ? recordedKeyCode : null;
            
            if (existingName) {
                this.uniformManager.confirmEditUniform(tempId, existingName, name, type, builtin, keyCode);
            } else {
                this.uniformManager.confirmUniform(tempId, name, type, builtin, keyCode);
            }
        };

        const handleCancel = () => {
            this.uniformManager.cancelUniform(tempId);
        };

        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleConfirm();
            } else if (e.key === 'Escape') {
                handleCancel();
            }
        });

        configDiv.appendChild(nameInput);
        configDiv.appendChild(typeSelect);
        configDiv.appendChild(builtinSelect);
        configDiv.appendChild(confirmBtn);
        configDiv.appendChild(cancelBtn);

        uniformDiv.appendChild(configDiv);
        uniformDiv.appendChild(keyRecordDiv);
        
        // Insert before the placeholder button instead of appending to the end
        const placeholder = document.getElementById('uniformPlaceholder');
        if (placeholder) {
            this.uniformList.insertBefore(uniformDiv, placeholder);
        } else {
            this.uniformList.appendChild(uniformDiv);
        }

        // Focus the name input
        setTimeout(() => nameInput.focus(), 0);
    }

    /**
     * Update value display for a uniform
     * @param {string} uniformName - The uniform name
     * @param {string} type - The uniform type
     * @param {*} value - The value to display
     */
    updateValueDisplay(uniformName, type, value) {
        const element = document.getElementById(`${uniformName}Value`);
        if (!element) return;
        
        // Handle different control types
        if (element.classList.contains('editable')) {
            // For editable input controls
            switch (type) {
                case 'float':
                    element.value = value.toFixed(2);
                    break;
                case 'int':
                    element.value = value.toString();
                    break;
            }
        } else if (element.classList.contains('bool-control')) {
            // For boolean controls
            const checkbox = element.querySelector('input[type="checkbox"]');
            const label = element.querySelector('.bool-label');
            if (checkbox && label) {
                checkbox.checked = value;
                label.textContent = value ? 'true' : 'false';
            }
        } else if (element.classList.contains('vec-control')) {
            // For vector controls
            const inputs = element.querySelectorAll('.vec-input');
            
            // Check if this is a resolution uniform
            const uniformElement = element.closest('.uniform-item');
            const uniformName_check = uniformElement ? uniformElement.getAttribute('data-name') : null;
            const builtinType = uniformName_check ? this.uniformManager.builtinAssociations.get(uniformName_check) : null;
            const isResolution = builtinType === 'resolution';
            
            inputs.forEach((input, index) => {
                if (index < value.length) {
                    // Don't update if the input is currently focused (user is editing)
                    if (document.activeElement !== input) {
                        input.value = isResolution ? Math.round(value[index]) : value[index].toFixed(2);
                    }
                }
            });
        } else {
            // For read-only displays
            switch (type) {
                case 'float':
                    element.textContent = value.toFixed(2);
                    break;
                case 'int':
                    element.textContent = value.toString();
                    break;
                case 'bool':
                    element.textContent = value ? 'true' : 'false';
                    break;
                case 'vec2':
                    // Check if this is a resolution uniform to show aspect ratio
                    const uniformElement = element.closest('.uniform-item');
                    const uniformName = uniformElement ? uniformElement.getAttribute('data-name') : null;
                    const builtinType = uniformName ? this.uniformManager.builtinAssociations.get(uniformName) : null;
                    
                    if (builtinType === 'resolution') {
                        const aspectRatio = this.formatAspectRatio(Math.round(value[0]), Math.round(value[1]));
                        const aspectInfo = aspectRatio ? ` • ${aspectRatio}` : '';
                        element.textContent = `${Math.round(value[0])} × ${Math.round(value[1])}${aspectInfo}`;
                    } else {
                        element.textContent = `${value[0].toFixed(2)}, ${value[1].toFixed(2)}`;
                    }
                    break;
                case 'vec3':
                    element.textContent = `${value[0].toFixed(2)}, ${value[1].toFixed(2)}, ${value[2].toFixed(2)}`;
                    break;
                case 'vec4':
                    element.textContent = `${value[0].toFixed(2)}, ${value[1].toFixed(2)}, ${value[2].toFixed(2)}, ${value[3].toFixed(2)}`;
                    break;
                case 'texture':
                    // Check if this is a custom texture control with preview
                    if (element.classList.contains('texture-control')) {
                        this.updateTextureControlDisplay(element, value);
                    } else {
                        // Fallback for simple text display
                        if (value && value.image) {
                            const filename = value.filename || (value.file ? value.file.name : 'texture');
                            element.textContent = `${filename} (${value.image.naturalWidth}×${value.image.naturalHeight})`;
                        } else if (value && value.filename) {
                            element.textContent = value.filename;
                        } else {
                            element.textContent = value ? 'Loaded' : 'No texture';
                        }
                    }
                    break;
            }
        }
    }

    /**
     * Update texture control display with preview and filter options
     * @param {HTMLElement} element - The texture control element
     * @param {*} value - The texture value
     */
    updateTextureControlDisplay(element, value) {
        const dropZone = element.querySelector('.texture-drop-zone');
        const previewContainer = element.querySelector('.texture-preview-container');
        const preview = element.querySelector('.texture-preview');
        const resolutionInfo = element.querySelector('.texture-resolution-info');
        const filterSelects = element.querySelectorAll('.texture-filter-select');
        const filterSelect = filterSelects[0]; // First one is the filter dropdown
        const wrapSSelect = filterSelects[1]; // Second one is wrap S
        const wrapTSelect = filterSelects[2]; // Third one is wrap T
        const dataTextureCheckbox = element.querySelector('.texture-data-checkbox');
        
        if (value && value.image) {
            // Show preview and hide drop zone
            if (preview) {
                preview.src = value.image.src;
                preview.style.display = 'block';
            }
            
            // Update resolution info
            if (resolutionInfo) {
                if (value.isLastFrame) {
                    // For lastFrame textures, show canvas resolution
                    const canvas = document.getElementById('glCanvas');
                    if (canvas) {
                        const aspectRatio = this.formatAspectRatio(canvas.width, canvas.height);
                        const aspectInfo = aspectRatio ? ` • ${aspectRatio}` : '';
                        resolutionInfo.textContent = `${canvas.width} × ${canvas.height}${aspectInfo} • Previous Frame`;
                    } else {
                        resolutionInfo.textContent = 'Previous Frame';
                    }
                } else {
                    const width = value.image.naturalWidth || value.image.width || 0;
                    const height = value.image.naturalHeight || value.image.height || 0;
                    const filename = value.filename || (value.file ? value.file.name : 'texture');
                    const fileSize = value.file ? this.formatFileSize(value.file.size) : '';
                    const aspectRatio = this.formatAspectRatio(width, height);
                    const aspectInfo = aspectRatio ? ` • ${aspectRatio}` : '';
                    const sizeInfo = fileSize ? ` • ${fileSize}` : '';
                    resolutionInfo.textContent = `${width} × ${height}${aspectInfo}${sizeInfo}`;
                }
            }
            
            if (filterSelect) {
                filterSelect.value = value.filter || 'linear';
            }
            if (wrapSSelect) {
                wrapSSelect.value = value.wrapS || 'clamp';
            }
            if (wrapTSelect) {
                wrapTSelect.value = value.wrapT || 'clamp';
            }
            if (dataTextureCheckbox) {
                dataTextureCheckbox.checked = value.isDataTexture || false;
            }
            if (dropZone) {
                dropZone.style.display = 'none';
            }
            if (previewContainer) {
                previewContainer.style.display = 'block';
            }
        } else if (value && value.filename && !value.image) {
            // Texture is loading
            if (dropZone) {
                dropZone.style.display = 'none';
            }
            if (previewContainer) {
                previewContainer.style.display = 'block';
            }
            if (preview) {
                preview.style.display = 'none';
            }
            if (resolutionInfo) {
                resolutionInfo.textContent = `Loading ${value.filename}...`;
            }
        } else {
            // Show drop zone and hide preview
            if (dropZone) {
                dropZone.style.display = 'flex';
            }
            if (previewContainer) {
                previewContainer.style.display = 'none';
            }
            if (resolutionInfo) {
                resolutionInfo.textContent = 'No texture loaded';
            }
        }
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * Calculate and format aspect ratio
     * @param {number} width - Width in pixels
     * @param {number} height - Height in pixels
     * @returns {string} Formatted aspect ratio (e.g., "16:9", "1:1")
     */
    formatAspectRatio(width, height) {
        if (!width || !height || width <= 0 || height <= 0) return '';
        
        // Calculate GCD for ratio simplification
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(width, height);
        const ratioW = width / divisor;
        const ratioH = height / divisor;
        
        // For very large ratios, show decimal format
        if (ratioW > 50 || ratioH > 50) {
            const ratio = width / height;
            return ratio > 1 ? `${ratio.toFixed(2)}:1` : `1:${(1/ratio).toFixed(2)}`;
        }
        
        return `${ratioW}:${ratioH}`;
    }

    /**
     * Toggle the collapsed state of a uniform
     * @param {string} uniformName - The name of the uniform to toggle
     */
    toggleUniformCollapse(uniformName) {
        const uniformItem = document.querySelector(`[data-name="${uniformName}"]`);
        if (!uniformItem) return;

        const detailsDiv = uniformItem.querySelector('.uniform-details');
        const toggleBtn = uniformItem.querySelector('.collapse-toggle-btn');
        
        if (!detailsDiv || !toggleBtn) return;

        const isCollapsed = uniformItem.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand
            uniformItem.classList.remove('collapsed');
            detailsDiv.style.display = 'block';
            toggleBtn.textContent = '▼';
            toggleBtn.title = 'Collapse uniform details';
        } else {
            // Collapse
            uniformItem.classList.add('collapsed');
            detailsDiv.style.display = 'none';
            toggleBtn.textContent = '▶';
            toggleBtn.title = 'Expand uniform details';
        }

        // Save collapsed state to localStorage
        const collapsedUniforms = JSON.parse(localStorage.getItem('collapsedUniforms') || '[]');
        if (isCollapsed) {
            // Remove from collapsed list
            const index = collapsedUniforms.indexOf(uniformName);
            if (index > -1) {
                collapsedUniforms.splice(index, 1);
            }
        } else {
            // Add to collapsed list
            if (!collapsedUniforms.includes(uniformName)) {
                collapsedUniforms.push(uniformName);
            }
        }
        localStorage.setItem('collapsedUniforms', JSON.stringify(collapsedUniforms));
    }
} 

