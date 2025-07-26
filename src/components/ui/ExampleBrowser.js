import { SHADER_PATHS } from '../../config/settings.js';

/**
 * ExampleBrowser component for browsing and loading shader examples
 */
export class ExampleBrowser {
    constructor() {
        this.modal = null;
        this.examplesList = null;
        this.examples = [
            {
                name: 'Simple Colors',
                description: 'Basic animated color gradient using sine waves',
                filename: 'simple_colors.frag',
                category: 'Basic'
            },
            {
                name: 'Animated Circle',
                description: 'Pulsating circle with smooth edges and animated colors',
                filename: 'animated_circle.frag',
                category: 'Basic'
            },
            {
                name: 'Mouse Interaction',
                description: 'Interactive ripples that follow mouse movement',
                filename: 'mouse_interaction.frag',
                category: 'Interactive'
            },
            {
                name: 'Fractal Pattern',
                description: 'Simple mandelbrot-like fractal with animated parameters',
                filename: 'fractal_pattern.frag',
                category: 'Advanced'
            },
            {
                name: 'Last Frame Feedback',
                description: 'Demonstrates temporal effects using the last frame texture',
                filename: 'lastframe_example.frag',
                category: 'Advanced',
                requiresUniforms: [
                    { name: 'u_lastFrame', type: 'texture', builtin: 'lastFrame' }
                ]
            },
            {
                name: 'Key State Interaction',
                description: 'Interactive visual effects controlled by keyboard and mouse input',
                filename: 'key_state_example.frag',
                category: 'Interactive',
                requiresUniforms: [
                    { name: 'u_spacePressed', type: 'bool', builtin: 'keyState', keyCode: 'Space' },
                    { name: 'u_leftMouse', type: 'bool', builtin: 'keyState', keyCode: 'Mouse0' },
                    { name: 'u_rightMouse', type: 'bool', builtin: 'keyState', keyCode: 'Mouse2' }
                ]
            }
        ];
        this.init();
    }

    /**
     * Initialize the example browser
     */
    init() {
        this.createModal();
        this.setupEventListeners();
    }

    /**
     * Create the modal structure
     */
    createModal() {
        // Create modal overlay
        this.modal = document.createElement('div');
        this.modal.className = 'example-browser-modal';
        this.modal.style.display = 'none';

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'example-browser-content';

        // Create header
        const header = document.createElement('div');
        header.className = 'example-browser-header';
        
        const title = document.createElement('h2');
        title.textContent = 'Shader Examples';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'example-browser-close';
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => this.hide());
        
        header.appendChild(title);
        header.appendChild(closeBtn);

        // Create examples list
        this.examplesList = document.createElement('div');
        this.examplesList.className = 'examples-list';

        // Create footer
        const footer = document.createElement('div');
        footer.className = 'example-browser-footer';
        
        const footerText = document.createElement('p');
        footerText.textContent = 'Select an example to load it into the editor. Some examples may require specific uniforms.';
        footer.appendChild(footerText);

        modalContent.appendChild(header);
        modalContent.appendChild(this.examplesList);
        modalContent.appendChild(footer);
        this.modal.appendChild(modalContent);

        // Add to document
        document.body.appendChild(this.modal);

        this.populateExamples();
    }

    /**
     * Populate the examples list
     */
    populateExamples() {
        // Group examples by category
        const categories = {};
        this.examples.forEach(example => {
            if (!categories[example.category]) {
                categories[example.category] = [];
            }
            categories[example.category].push(example);
        });

        // Create category sections
        Object.keys(categories).forEach(categoryName => {
            const categorySection = document.createElement('div');
            categorySection.className = 'example-category';

            const categoryHeader = document.createElement('h3');
            categoryHeader.className = 'example-category-header';
            categoryHeader.textContent = categoryName;
            categorySection.appendChild(categoryHeader);

            categories[categoryName].forEach(example => {
                const exampleItem = this.createExampleItem(example);
                categorySection.appendChild(exampleItem);
            });

            this.examplesList.appendChild(categorySection);
        });
    }

    /**
     * Create an example item element
     * @param {Object} example - Example data
     * @returns {HTMLElement} Example item element
     */
    createExampleItem(example) {
        const item = document.createElement('div');
        item.className = 'example-item';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'example-name';
        nameDiv.textContent = example.name;

        const descDiv = document.createElement('div');
        descDiv.className = 'example-description';
        descDiv.textContent = example.description;

        const metaDiv = document.createElement('div');
        metaDiv.className = 'example-meta';

        // Add requirements if any
        if (example.requiresUniforms && example.requiresUniforms.length > 0) {
            const reqSpan = document.createElement('span');
            reqSpan.className = 'example-requirements';
            reqSpan.textContent = 'Requires: ' + example.requiresUniforms.map(u => u.name).join(', ');
            metaDiv.appendChild(reqSpan);
        }

        const loadBtn = document.createElement('button');
        loadBtn.className = 'example-load-btn';
        loadBtn.textContent = 'Load';
        loadBtn.addEventListener('click', () => this.loadExample(example));

        item.appendChild(nameDiv);
        item.appendChild(descDiv);
        item.appendChild(metaDiv);
        item.appendChild(loadBtn);

        return item;
    }

    /**
     * Load an example shader
     * @param {Object} example - Example to load
     */
    async loadExample(example) {
        try {
            // Load the shader file
            const shaderPath = SHADER_PATHS.examplesDir + example.filename;
            const response = await fetch(shaderPath);
            
            if (!response.ok) {
                throw new Error(`Failed to load example: ${example.filename}`);
            }
            
            const shaderContent = await response.text();

            // Create required uniforms if specified
            if (example.requiresUniforms && example.requiresUniforms.length > 0) {
                for (const uniformSpec of example.requiresUniforms) {
                    // Dispatch event to create the uniform
                    const createUniformEvent = new CustomEvent('createExampleUniform', {
                        detail: uniformSpec
                    });
                    document.dispatchEvent(createUniformEvent);
                }
            }

            // Load the shader into the editor
            const loadShaderEvent = new CustomEvent('loadExampleShader', {
                detail: {
                    type: 'fragment',
                    content: shaderContent,
                    name: example.name
                }
            });
            document.dispatchEvent(loadShaderEvent);

            // Hide the modal
            this.hide();
        } catch (error) {
            console.error('Failed to load example:', error);
            alert(`Failed to load example: ${error.message}`);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close on overlay click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.hide();
            }
        });
    }

    /**
     * Show the example browser
     */
    show() {
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    /**
     * Hide the example browser
     */
    hide() {
        this.modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scroll
    }

    /**
     * Check if browser is currently visible
     * @returns {boolean} True if visible
     */
    isVisible() {
        return this.modal.style.display === 'block';
    }
} 
