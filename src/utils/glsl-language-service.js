/**
 * GLSL Language Service for ACE Editor
 * Provides autocomplete, hover documentation, and language features
 */

import { GLSL_DEFINITIONS, getAllCompletions, getFilteredCompletions, findDefinition } from './glsl-definitions.js';

export class GLSLLanguageService {
    constructor() {
        this.completions = getAllCompletions();
        this.userDefinedSymbols = new Map(); // Store user-defined uniforms, variables, etc.
        this.currentShaderType = 'fragment'; // Track current shader type for context-aware completions
    }

    /**
     * Initialize language service for an ACE editor instance
     * @param {Object} editor - ACE editor instance
     * @param {string} shaderType - 'vertex' or 'fragment'
     */
    initialize(editor, shaderType = 'fragment') {
        this.currentShaderType = shaderType;
        
        // Set up autocomplete
        this.setupAutocomplete(editor);
        
        // Set up hover documentation
        this.setupHoverDocumentation(editor);
        
        // Set up live symbol extraction
        this.setupSymbolExtraction(editor);
        
        console.log(`GLSL Language Service initialized for ${shaderType} shader`);
    }

    /**
     * Setup autocomplete functionality
     * @param {Object} editor - ACE editor instance
     */
    setupAutocomplete(editor) {
        // Enable autocomplete
        ace.require('ace/ext/language_tools');
        editor.setOptions({
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: true
        });

        // Create custom completer for GLSL
        const glslCompleter = {
            getCompletions: (editor, session, pos, prefix, callback) => {
                // Get built-in completions
                let completions = getFilteredCompletions(prefix);
                
                // Add user-defined symbols
                const userCompletions = this.getUserDefinedCompletions(prefix);
                completions = completions.concat(userCompletions);
                
                // Filter by shader type context
                completions = this.filterByShaderContext(completions);
                
                // Sort by relevance
                completions.sort((a, b) => b.score - a.score);
                
                callback(null, completions);
            },
            
            getDocTooltip: (item) => {
                if (item.docHTML) {
                    return {
                        docHTML: item.docHTML
                    };
                }
                return null;
            }
        };

        // Add the completer
        editor.completers = editor.completers || [];
        editor.completers.push(glslCompleter);
    }

    /**
     * Setup hover documentation
     * @param {Object} editor - ACE editor instance
     */
    setupHoverDocumentation(editor) {
        // Track mouse position for hover
        let hoverTimeout;
        let currentTooltip;

        const showTooltip = (e) => {
            clearTimeout(hoverTimeout);
            
            hoverTimeout = setTimeout(() => {
                const position = editor.renderer.screenToTextCoordinates(e.clientX, e.clientY);
                const session = editor.getSession();
                const token = session.getTokenAt(position.row, position.column);
                
                if (token && this.shouldShowTooltip(token)) {
                    const definition = findDefinition(token.value);
                    if (definition) {
                        this.showHoverTooltip(e, token.value, definition.definition);
                    }
                }
            }, 500); // 500ms delay
        };

        const hideTooltip = () => {
            clearTimeout(hoverTimeout);
            if (currentTooltip) {
                currentTooltip.remove();
                currentTooltip = null;
            }
        };

        // Add event listeners
        editor.on('mousemove', showTooltip);
        editor.on('mouseout', hideTooltip);
        editor.on('changeSelection', hideTooltip);
        editor.on('change', hideTooltip);

        // Store reference for cleanup
        this.hoverCleanup = () => {
            editor.off('mousemove', showTooltip);
            editor.off('mouseout', hideTooltip);
            editor.off('changeSelection', hideTooltip);
            editor.off('change', hideTooltip);
            hideTooltip();
        };
    }

    /**
     * Setup live symbol extraction from shader code
     * @param {Object} editor - ACE editor instance
     */
    setupSymbolExtraction(editor) {
        const extractSymbols = () => {
            const content = editor.getValue();
            this.extractUserDefinedSymbols(content);
        };

        // Extract symbols on content change
        editor.on('change', () => {
            clearTimeout(this.symbolExtractionTimeout);
            this.symbolExtractionTimeout = setTimeout(extractSymbols, 1000);
        });

        // Initial extraction
        extractSymbols();
    }

    /**
     * Extract user-defined symbols from shader content
     * @param {string} content - Shader source code
     */
    extractUserDefinedSymbols(content) {
        this.userDefinedSymbols.clear();

        // Extract uniform declarations
        const uniformRegex = /uniform\s+(\w+)\s+(\w+)(?:\[(\d+)\])?(?:\s*=\s*[^;]+)?;/g;
        let match;
        while ((match = uniformRegex.exec(content)) !== null) {
            const [, type, name, arraySize] = match;
            this.userDefinedSymbols.set(name, {
                type: 'uniform',
                dataType: type,
                arraySize: arraySize ? parseInt(arraySize) : null,
                doc: `User-defined uniform of type ${type}${arraySize ? `[${arraySize}]` : ''}`
            });
        }

        // Extract varying/in/out declarations
        const varyingRegex = /(varying|in|out)\s+(\w+)\s+(\w+)(?:\[(\d+)\])?;/g;
        while ((match = varyingRegex.exec(content)) !== null) {
            const [, qualifier, type, name, arraySize] = match;
            this.userDefinedSymbols.set(name, {
                type: 'variable',
                dataType: type,
                qualifier: qualifier,
                arraySize: arraySize ? parseInt(arraySize) : null,
                doc: `${qualifier} variable of type ${type}${arraySize ? `[${arraySize}]` : ''}`
            });
        }

        // Extract function declarations
        const functionRegex = /(\w+)\s+(\w+)\s*\([^)]*\)\s*{/g;
        while ((match = functionRegex.exec(content)) !== null) {
            const [, returnType, name] = match;
            if (name !== 'main') { // Skip main function
                this.userDefinedSymbols.set(name, {
                    type: 'function',
                    returnType: returnType,
                    doc: `User-defined function returning ${returnType}`
                });
            }
        }

        // Extract struct definitions
        const structRegex = /struct\s+(\w+)\s*{[^}]+}/g;
        while ((match = structRegex.exec(content)) !== null) {
            const [, name] = match;
            this.userDefinedSymbols.set(name, {
                type: 'struct',
                doc: `User-defined structure type`
            });
        }

        // Extract #define macros
        const defineRegex = /#define\s+(\w+)(?:\s+(.+))?$/gm;
        while ((match = defineRegex.exec(content)) !== null) {
            const [, name, value] = match;
            this.userDefinedSymbols.set(name, {
                type: 'macro',
                value: value ? value.trim() : '',
                doc: `Preprocessor macro${value ? `: ${value}` : ''}`
            });
        }
    }

    /**
     * Get user-defined completions
     * @param {string} prefix - Completion prefix
     * @returns {Array} Array of completion items
     */
    getUserDefinedCompletions(prefix) {
        const completions = [];
        
        for (const [name, symbol] of this.userDefinedSymbols) {
            if (!prefix || name.toLowerCase().startsWith(prefix.toLowerCase())) {
                completions.push({
                    caption: name,
                    value: name,
                    score: this.getScoreForUserSymbol(symbol.type),
                    meta: `user-${symbol.type}`,
                    docHTML: this.formatUserSymbolDoc(name, symbol)
                });
            }
        }
        
        return completions;
    }

    /**
     * Filter completions by shader context
     * @param {Array} completions - Array of completion items
     * @returns {Array} Filtered completions
     */
    filterByShaderContext(completions) {
        return completions.filter(completion => {
            // Check if the completion has shader-specific restrictions
            const definition = findDefinition(completion.caption);
            if (definition && definition.definition.scope) {
                return definition.definition.scope === this.currentShaderType;
            }
            return true; // Include if no restrictions
        });
    }

    /**
     * Get score for user-defined symbol types
     * @param {string} type - Symbol type
     * @returns {number} Score for ordering
     */
    getScoreForUserSymbol(type) {
        const scores = {
            'function': 1100,
            'uniform': 1050,
            'variable': 1000,
            'struct': 950,
            'macro': 900
        };
        return scores[type] || 500;
    }

    /**
     * Format documentation for user-defined symbols
     * @param {string} name - Symbol name
     * @param {Object} symbol - Symbol definition
     * @returns {string} HTML documentation
     */
    formatUserSymbolDoc(name, symbol) {
        let html = `<div class="ace-tooltip user-defined">`;
        html += `<div class="name"><strong>${name}</strong> <em>(user-defined)</em></div>`;
        html += `<div class="type">Type: ${symbol.type}</div>`;
        
        if (symbol.dataType) {
            html += `<div class="data-type">Data Type: ${symbol.dataType}</div>`;
        }
        
        if (symbol.qualifier) {
            html += `<div class="qualifier">Qualifier: ${symbol.qualifier}</div>`;
        }
        
        if (symbol.returnType) {
            html += `<div class="return-type">Returns: ${symbol.returnType}</div>`;
        }
        
        if (symbol.arraySize) {
            html += `<div class="array-size">Array Size: ${symbol.arraySize}</div>`;
        }
        
        if (symbol.value) {
            html += `<div class="value">Value: <code>${symbol.value}</code></div>`;
        }
        
        html += `<div class="description">${symbol.doc}</div>`;
        html += `</div>`;
        
        return html;
    }

    /**
     * Check if tooltip should be shown for token
     * @param {Object} token - ACE editor token
     * @returns {boolean} True if tooltip should be shown
     */
    shouldShowTooltip(token) {
        // Show tooltip for identifiers and keywords
        return token.type === 'identifier' || 
               token.type === 'keyword' || 
               token.type === 'support.function' ||
               token.type === 'support.type';
    }

    /**
     * Show hover tooltip
     * @param {Event} e - Mouse event
     * @param {string} name - Symbol name
     * @param {Object} definition - Symbol definition
     */
    showHoverTooltip(e, name, definition) {
        // Remove existing tooltip
        if (this.currentTooltip) {
            this.currentTooltip.remove();
        }

        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'glsl-hover-tooltip';
        tooltip.innerHTML = this.formatHoverDoc(name, definition);
        
        // Position tooltip
        tooltip.style.position = 'absolute';
        tooltip.style.left = (e.pageX + 10) + 'px';
        tooltip.style.top = (e.pageY - 10) + 'px';
        tooltip.style.zIndex = '10000';
        
        document.body.appendChild(tooltip);
        this.currentTooltip = tooltip;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (this.currentTooltip === tooltip) {
                tooltip.remove();
                this.currentTooltip = null;
            }
        }, 5000);
    }

    /**
     * Format hover documentation
     * @param {string} name - Symbol name
     * @param {Object} definition - Symbol definition
     * @returns {string} HTML documentation
     */
    formatHoverDoc(name, definition) {
        let html = `<div class="glsl-hover-content">`;
        
        if (definition.type === 'function') {
            html += `<div class="signature"><code>${definition.signature}</code></div>`;
            html += `<div class="description">${definition.doc}</div>`;
        } else {
            html += `<div class="name"><code>${name}</code></div>`;
            html += `<div class="description">${definition.doc}</div>`;
        }
        
        html += `</div>`;
        return html;
    }

    /**
     * Add uniform completion
     * @param {string} name - Uniform name
     * @param {string} type - Uniform type
     * @param {Object} options - Additional options
     */
    addUniform(name, type, options = {}) {
        this.userDefinedSymbols.set(name, {
            type: 'uniform',
            dataType: type,
            doc: options.doc || `Uniform of type ${type}`,
            ...options
        });
    }

    /**
     * Remove uniform completion
     * @param {string} name - Uniform name
     */
    removeUniform(name) {
        this.userDefinedSymbols.delete(name);
    }

    /**
     * Set current shader type for context-aware completions
     * @param {string} shaderType - 'vertex' or 'fragment'
     */
    setShaderType(shaderType) {
        this.currentShaderType = shaderType;
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.hoverCleanup) {
            this.hoverCleanup();
        }
        
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
        
        clearTimeout(this.symbolExtractionTimeout);
        this.userDefinedSymbols.clear();
    }
} 