import { CodeEditor } from './CodeEditor.js';
import { WebGLRenderer } from '../preview/WebGLRenderer.js';
import { UniformManager } from '../uniforms/UniformManager.js';
import { UniformUI } from '../uniforms/UniformUI.js';
import { PanelManager } from '../ui/PanelManager.js';
import { TabManager } from '../ui/TabManager.js';
import { Controls } from '../ui/Controls.js';
import { ErrorConsole } from '../ui/ErrorConsole.js';
import { ExampleBrowser } from '../ui/ExampleBrowser.js';
import { CanvasSettings } from '../ui/CanvasSettings.js';
import { ProjectManager } from '../project/ProjectManager.js';
import { ProjectBrowser } from '../ui/ProjectBrowser.js';
import { ProjectNameDialog } from '../ui/ProjectNameDialog.js';
import { Notification } from '../ui/Notification.js';
import { UnsavedChangesDialog } from '../ui/UnsavedChangesDialog.js';
import { DEFAULT_SETTINGS } from '../../config/settings.js';

/**
 * Main shader editor class that orchestrates all components
 */
export class ShaderEditor {
    constructor() {
        this.components = {};
        this.projectManager = null;
        this.currentProjectId = null;
        
        // Autosave properties
        this.autosaveTimer = null;
        this.autosaveInterval = 2 * 60 * 1000; // 2 minutes default
        this.lastAutosaveHash = null;
        this.lastChangeTime = Date.now();
        this._hasUnsavedChanges = false;
        
        // Recent projects properties
        this.recentProjectPrefix = 'recent_';
        this.maxRecentProjects = 10;
        this.recentProjectExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        this.init();
    }

    /**
     * Initialize the shader editor
     */
    async init() {
        try {
            // Initialize project manager first
            this.projectManager = new ProjectManager();
            await this.projectManager.initialize();

            // Initialize components
            this.components.renderer = new WebGLRenderer('glCanvas');
            this.components.codeEditor = new CodeEditor();
            this.components.uniformManager = new UniformManager();
            this.components.uniformUI = new UniformUI(this.components.uniformManager);
            this.components.panelManager = new PanelManager();
            this.components.tabManager = new TabManager();
            this.components.controls = new Controls();
            this.components.errorConsole = new ErrorConsole();
            this.components.exampleBrowser = new ExampleBrowser();
            
            // Initialize canvas settings (after renderer)
            this.components.canvasSettings = new CanvasSettings(this.components.renderer);
            
            // Initialize project browser (after initialization)
            this.components.projectBrowser = new ProjectBrowser(this);
            
            // Initialize UI components
            this.components.projectNameDialog = new ProjectNameDialog();
            this.components.notification = new Notification();
            this.components.unsavedChangesDialog = new UnsavedChangesDialog();

            // Setup event listeners
            this.setupEventListeners();
            
            // Start autosave
            this.startAutosave();
            
            // Compile initial shaders
            setTimeout(() => {
                this.compileShaders();
            }, 100);
            
        } catch (error) {
            console.error('Failed to initialize components:', error);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Shader compilation events
        document.addEventListener('renderError', (e) => {
            this.components.codeEditor.showErrors(e.detail.errors);
        });

        document.addEventListener('renderErrorCleared', () => {
            this.components.codeEditor.clearAllErrorAnnotations();
        });

        document.addEventListener('shaderCompiled', (e) => {
            if (e.detail.success) {
                this.components.codeEditor.clearAllErrorAnnotations();
            } else {
                this.components.codeEditor.showErrors(e.detail.errors);
            }
        });

        // Project events
        document.addEventListener('projectSaveRequested', () => {
            this.saveCurrentProject();
        });

        document.addEventListener('projectLoadRequested', () => {
            this.loadProject();
        });

        document.addEventListener('projectNewRequested', () => {
            this.createNewProject();
        });

        document.addEventListener('projectBrowseRequested', () => {
            this.components.projectBrowser.show();
        });

        // Shader compilation events
        document.addEventListener('shaderChanged', (e) => {
            this.compileShaders();
        });

        document.addEventListener('uniformsChanged', (e) => {
            this.updateRendererUniforms(e.detail);
        });

        // Code change events for autosave
        document.addEventListener('codeChanged', () => {
            this.markAsChanged();
        });

        document.addEventListener('uniformChanged', () => {
            this.markAsChanged();
        });

        document.addEventListener('canvasSettingsChanged', () => {
            this.markAsChanged();
        });

        // Autosave settings events
        document.addEventListener('autosaveToggled', (e) => {
            if (e.detail.enabled) {
                this.startAutosave();
            } else {
                this.stopAutosave();
            }
        });

        document.addEventListener('autosaveIntervalChanged', (e) => {
            this.autosaveInterval = e.detail.intervalMinutes * 60 * 1000;
            this.restartAutosave();
        });
    }

    /**
     * Compile shaders
     */
    compileShaders() {
        const vertexSource = this.components.codeEditor.getShaderCode('vertex');
        const fragmentSource = this.components.codeEditor.getShaderCode('fragment');
        
        if (vertexSource && fragmentSource) {
            this.components.renderer.compileShaders(vertexSource, fragmentSource);
        }
    }

    /**
     * Update renderer uniforms
     * @param {Object} detail - Uniform update details
     */
    updateRendererUniforms(detail) {
        this.components.renderer.setUniforms(detail.uniforms, detail.builtinAssociations);
    }

    /**
     * Mark that there are unsaved changes
     */
    markAsChanged() {
        this._hasUnsavedChanges = true;
        this.lastChangeTime = Date.now();
    }

    /**
     * Start autosave timer
     */
    startAutosave() {
        this.stopAutosave(); // Clear any existing timer
        this.autosaveTimer = setInterval(() => {
            this.performAutosave();
        }, this.autosaveInterval);
    }

    /**
     * Stop autosave timer
     */
    stopAutosave() {
        if (this.autosaveTimer) {
            clearInterval(this.autosaveTimer);
            this.autosaveTimer = null;
        }
    }

    /**
     * Restart autosave with new interval
     */
    restartAutosave() {
        this.stopAutosave();
        this.startAutosave();
    }

    /**
     * Perform autosave operation
     */
    async performAutosave() {
        try {
            // Only autosave if there are recent changes
            const timeSinceLastChange = Date.now() - this.lastChangeTime;
            if (timeSinceLastChange > this.autosaveInterval) {
                return; // No recent changes
            }

            const currentHash = await this.getCurrentStateHash();
            if (currentHash === this.lastAutosaveHash) {
                return; // No changes since last autosave
            }

            if (this.currentProjectId) {
                // Autosave to current project
                await this.autosaveToCurrentProject();
            } else {
                // Autosave to recent projects
                await this.autosaveToRecent();
            }

            this.lastAutosaveHash = currentHash;
            this._hasUnsavedChanges = false;
            
            console.log('Autosave completed');
        } catch (error) {
            console.error('Autosave failed:', error);
        }
    }

    /**
     * Autosave to current project
     */
    async autosaveToCurrentProject() {
        try {
            const projectData = await this.exportCurrentState();
            const metadata = await this.projectManager.getProjectMetadata(this.currentProjectId);
            
            await this.projectManager.saveProject(
                projectData,
                metadata?.name || 'Untitled Project',
                this.currentProjectId
            );
            
            // Show autosave notification
            this.components.notification.info('Project autosaved');
        } catch (error) {
            console.error('Failed to autosave to current project:', error);
            this.components.notification.error('Autosave failed');
        }
    }

    /**
     * Autosave to recent projects
     */
    async autosaveToRecent() {
        try {
            const projectData = await this.exportCurrentState();
            const timestamp = Date.now();
            const recentId = `${this.recentProjectPrefix}${timestamp}`;
            
            await this.projectManager.saveProject(
                projectData,
                `Recent Work (${new Date(timestamp).toLocaleString()})`,
                recentId
            );
            
            // Clean up old recent projects
            await this.cleanupRecentProjects();
            
            // Show autosave notification
            this.components.notification.info('Recent work autosaved');
        } catch (error) {
            console.error('Failed to autosave to recent:', error);
            this.components.notification.error('Autosave failed');
        }
    }

    /**
     * Clean up old recent projects
     */
    async cleanupRecentProjects() {
        try {
            const allProjects = await this.projectManager.getAllProjects();
            const recentProjects = allProjects.filter(p => 
                p.id.startsWith(this.recentProjectPrefix)
            );
            
            // Sort by creation time (oldest first)
            recentProjects.sort((a, b) => a.createdAt - b.createdAt);
            
            // Remove old projects beyond the limit
            const projectsToDelete = recentProjects.slice(0, -this.maxRecentProjects);
            const expiredProjects = recentProjects.filter(p => 
                Date.now() - p.createdAt > this.recentProjectExpiry
            );
            
            const allToDelete = [...projectsToDelete, ...expiredProjects];
            
            for (const project of allToDelete) {
                await this.projectManager.deleteProject(project.id);
            }
            
            if (allToDelete.length > 0) {
                console.log(`Cleaned up ${allToDelete.length} old recent projects`);
            }
        } catch (error) {
            console.error('Failed to cleanup recent projects:', error);
        }
    }

    /**
     * Get hash of current state for change detection
     */
    async getCurrentStateHash() {
        const state = await this.exportCurrentState();
        return this.simpleHash(JSON.stringify(state));
    }

    /**
     * Simple hash function for change detection
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    /**
     * Export current state for saving
     */
    async exportCurrentState() {
        return {
            shaders: {
                vertex: this.components.codeEditor.getShaderCode('vertex'),
                fragment: this.components.codeEditor.getShaderCode('fragment')
            },
            uniforms: await this.components.uniformManager.exportUniforms(),
            settings: this.components.canvasSettings.exportSettings(),
            canvas: this.components.renderer.exportCanvasState(),
            view: this.components.renderer.exportViewState()
        };
    }

    /**
     * Create a new project
     */
    createNewProject() {
        this.currentProjectId = null;
        this._hasUnsavedChanges = false;
        this.lastAutosaveHash = null;
        document.dispatchEvent(new CustomEvent('projectChanged', { 
            detail: { projectId: null } 
        }));
    }

    /**
     * Save current project
     * @param {string} projectName - Name for the project (optional)
     */
    async saveCurrentProject(projectName = null) {
        try {
            let finalProjectName = projectName;
            
            // If no project name provided and no current project, show dialog
            if (!finalProjectName && !this.currentProjectId) {
                try {
                    finalProjectName = await this.components.projectNameDialog.show('Untitled Project');
                } catch (error) {
                    // User cancelled the dialog
                    return null;
                }
            }
            
            // If we have a current project but no name, use existing name
            if (!finalProjectName && this.currentProjectId) {
                const metadata = await this.projectManager.getProjectMetadata(this.currentProjectId);
                finalProjectName = metadata.name;
            }
            
            const projectData = await this.exportCurrentState();
            const projectId = await this.projectManager.saveProject(projectData, finalProjectName, this.currentProjectId);
            
            this.currentProjectId = projectId;
            this._hasUnsavedChanges = false;
            this.lastAutosaveHash = await this.getCurrentStateHash();
            
            // Show success notification
            this.components.notification.success(`Project "${finalProjectName}" saved successfully!`);
            
            document.dispatchEvent(new CustomEvent('projectSaved', { 
                detail: { projectId, projectName: finalProjectName } 
            }));
            
            return projectId;
        } catch (error) {
            console.error('Failed to save project:', error);
            this.components.notification.error('Failed to save project. Please try again.');
            throw error;
        }
    }

    /**
     * Load a project
     * @param {string} projectId - Project ID to load
     */
    async loadProject(projectId) {
        try {
            const projectData = await this.projectManager.loadProject(projectId);
            await this.importProjectData(projectData);
            
            this.currentProjectId = projectId;
            this._hasUnsavedChanges = false;
            this.lastAutosaveHash = await this.getCurrentStateHash();
            
            document.dispatchEvent(new CustomEvent('projectLoaded', { 
                detail: { projectId } 
            }));
        } catch (error) {
            console.error('Failed to load project:', error);
            throw error;
        }
    }

    /**
     * Import project data
     * @param {Object} data - Project data to import
     */
    async importProjectData(data) {
        try {
            // Import shaders
            if (data.shaders) {
                if (data.shaders.vertex) {
                    this.components.codeEditor.setShaderCode('vertex', data.shaders.vertex);
                }
                if (data.shaders.fragment) {
                    this.components.codeEditor.setShaderCode('fragment', data.shaders.fragment);
                }
            }

            // Import uniforms
            if (data.uniforms) {
                this.components.uniformManager.importUniforms(data.uniforms);
            }

            // Import settings
            if (data.settings) {
                this.components.canvasSettings.importSettings(data.settings);
            }

            // Import canvas state
            if (data.canvas) {
                this.components.renderer.importCanvasState(data.canvas);
            }

            // Import view state
            if (data.view) {
                this.components.renderer.importViewState(data.view);
            }
        } catch (error) {
            console.error('Failed to import project data:', error);
            throw error;
        }
    }

    /**
     * Import project from file
     * @param {Object} data - Project data from file
     */
    async importProjectFromFile(data) {
        try {
            await this.importProjectData(data);
            const projectId = await this.saveCurrentProject('Imported Project');
            
            document.dispatchEvent(new CustomEvent('projectImported', { 
                detail: { projectId } 
            }));
            
            return projectId;
        } catch (error) {
            console.error('Failed to import project from file:', error);
            throw error;
        }
    }

    /**
     * Get current project ID
     * @returns {string|null} Current project ID
     */
    getCurrentProjectId() {
        return this.currentProjectId;
    }

    /**
     * Check if there are unsaved changes
     * @returns {boolean} True if there are unsaved changes
     */
    hasUnsavedChanges() {
        return this._hasUnsavedChanges;
    }

    /**
     * Get all projects
     * @returns {Promise<Array>} Array of project metadata
     */
    async getAllProjects() {
        return await this.projectManager.getAllProjects();
    }

    /**
     * Delete a project
     * @param {string} projectId - Project ID to delete
     * @returns {Promise<boolean>} Success status
     */
    async deleteProject(projectId) {
        try {
            const success = await this.projectManager.deleteProject(projectId);
            
            if (success && projectId === this.currentProjectId) {
                this.createNewProject();
            }
            
            return success;
        } catch (error) {
            console.error('Failed to delete project:', error);
            return false;
        }
    }

    /**
     * Update project name
     * @param {string} projectId - Project ID
     * @param {string} newName - New project name
     * @returns {Promise<boolean>} Success status
     */
    async updateProjectName(projectId, newName) {
        try {
            return await this.projectManager.updateProjectName(projectId, newName);
        } catch (error) {
            console.error('Failed to update project name:', error);
            return false;
        }
    }

    /**
     * Export project to file
     * @param {string} projectId - Project ID to export
     */
    async exportProjectToFile(projectId) {
        try {
            const projectData = await this.projectManager.loadProject(projectId);
            const metadata = await this.projectManager.getProjectMetadata(projectId);
            
            const exportData = {
                metadata,
                data: projectData
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${metadata.name || 'project'}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export project:', error);
            throw error;
        }
    }

    /**
     * Get storage info
     * @returns {Promise<Object>} Storage usage information
     */
    async getStorageInfo() {
        return await this.projectManager.getStorageInfo();
    }

    /**
     * Handle unsaved changes when loading a project
     * @returns {Promise<string>} 'save', 'dont-save', or 'cancel'
     */
    async handleUnsavedChanges() {
        if (!this.hasUnsavedChanges()) {
            return 'dont-save';
        }
        
        try {
            return await this.components.unsavedChangesDialog.show();
        } catch (error) {
            return 'cancel';
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.stopAutosave();
        
        Object.values(this.components).forEach(component => {
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            }
        });
    }
} 
