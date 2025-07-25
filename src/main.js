/**
 * Main entry point for the Shader Editor
 * This file initializes the modular shader editor components
 */

import { ShaderEditor } from './components/editor/ShaderEditor.js';

// Initialize the shader editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Create the main shader editor instance
        const shaderEditor = new ShaderEditor();
        
        // Make it globally accessible for debugging
        window.shaderEditor = shaderEditor;
    } catch (error) {
        console.error('Failed to initialize Shader Editor:', error);
        
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #dc3545;
            color: white;
            padding: 1rem 2rem;
            border-radius: 4px;
            font-family: Arial, sans-serif;
            z-index: 9999;
            max-width: 500px;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            <h3>Shader Editor Failed to Load</h3>
            <p>${error.message}</p>
            <p style="font-size: 0.9rem; margin-top: 0.5rem;">Check the browser console for more details.</p>
        `;
        document.body.appendChild(errorDiv);
    }
}); 
