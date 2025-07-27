/**
 * ProjectBrowser - UI component for managing projects
 */
export class ProjectBrowser {
    constructor(shaderEditor) {
        this.shaderEditor = shaderEditor;
        this.projects = [];
        this.isVisible = false;
        this.browserElement = null;
        this.init();
    }

    /**
     * Initialize the project browser
     */
    init() {
        this.createBrowserElement();
        this.setupEventListeners();
    }

    /**
     * Create the project browser UI element
     */
    createBrowserElement() {
        this.browserElement = document.createElement('div');
        this.browserElement.className = 'project-browser';
        this.browserElement.innerHTML = `
            <div class="project-browser-content">
                <div class="project-browser-header">
                    <h3>Projects</h3>
                    <button class="close-btn" id="closeBrowser">×</button>
                </div>
                            <div class="project-browser-controls">
                <button class="btn-primary" id="newProjectBtn">
                    <span class="btn-icon">📄</span>
                    New Project
                </button>
                <button class="btn-secondary" id="saveProjectBtn">
                    <span class="btn-icon">💾</span>
                    Save Current
                </button>
                <button class="btn-secondary" id="importProjectBtn">
                    <span class="btn-icon">📥</span>
                    Import Project
                </button>
                <div class="search-container">
                    <input type="text" id="projectSearch" placeholder="Search projects..." />
                </div>
            </div>
                <div class="project-list-container">
                    <div class="project-list" id="projectList">
                        <!-- Projects will be dynamically populated here -->
                    </div>
                </div>
                <div class="project-browser-footer">
                    <div class="storage-info" id="storageInfo">
                        <span>Loading storage info...</span>
                    </div>
                </div>
            </div>
        `;

        // Initially hidden
        this.browserElement.style.display = 'none';
        document.body.appendChild(this.browserElement);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close browser
        const closeBtn = this.browserElement.querySelector('#closeBrowser');
        closeBtn.addEventListener('click', () => this.hide());

        // New project
        const newProjectBtn = this.browserElement.querySelector('#newProjectBtn');
        newProjectBtn.addEventListener('click', () => this.createNewProject());

        // Save current project
        const saveProjectBtn = this.browserElement.querySelector('#saveProjectBtn');
        saveProjectBtn.addEventListener('click', () => this.saveCurrentProject());

        // Import project
        const importProjectBtn = this.browserElement.querySelector('#importProjectBtn');
        importProjectBtn.addEventListener('click', () => this.importProject());

        // Search projects
        const searchInput = this.browserElement.querySelector('#projectSearch');
        searchInput.addEventListener('input', (e) => this.filterProjects(e.target.value));

        // Close when clicking outside
        this.browserElement.addEventListener('click', (e) => {
            if (e.target === this.browserElement) {
                this.hide();
            }
        });

        // Listen for project events
        document.addEventListener('projectSaved', () => this.refreshProjects());
        document.addEventListener('projectLoaded', () => this.refreshProjects());
        document.addEventListener('projectImported', () => this.refreshProjects());
    }

    /**
     * Show the project browser
     */
    async show() {
        if (this.isVisible) return;

        this.isVisible = true;
        this.browserElement.style.display = 'flex';
        
        await this.refreshProjects();
        this.updateStorageInfo();
        
        // Add animation class
        this.browserElement.classList.add('show');
        
        // Focus search input
        const searchInput = this.browserElement.querySelector('#projectSearch');
        setTimeout(() => searchInput.focus(), 100);
    }

    /**
     * Hide the project browser
     */
    hide() {
        if (!this.isVisible) return;

        this.isVisible = false;
        this.browserElement.classList.remove('show');
        
        setTimeout(() => {
            this.browserElement.style.display = 'none';
        }, 300);
    }

    /**
     * Toggle project browser visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Refresh the projects list
     */
    async refreshProjects() {
        try {
            this.projects = await this.shaderEditor.getAllProjects();
            this.renderProjects();
        } catch (error) {
            console.error('Failed to refresh projects:', error);
        }
    }

    /**
     * Render the projects list
     * @param {Array} projects - Projects to render (defaults to all projects)
     */
    renderProjects(projects = null) {
        const projectList = this.browserElement.querySelector('#projectList');
        const projectsToRender = projects || this.projects;

        if (projectsToRender.length === 0) {
            projectList.innerHTML = `
                <div class="empty-projects">
                    <div class="empty-icon">📁</div>
                    <p>No projects found</p>
                    <p class="empty-subtitle">Create your first project to get started</p>
                </div>
            `;
            return;
        }

        projectList.innerHTML = projectsToRender.map(project => this.createProjectHTML(project)).join('');
        
        // Add event listeners to project items
        projectList.querySelectorAll('.project-item').forEach(item => {
            const projectId = item.dataset.projectId;
            
            // Load project on click
            item.addEventListener('click', () => this.loadProject(projectId));
            
            // Delete project
            const deleteBtn = item.querySelector('.delete-project');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteProject(projectId);
            });
            
            // Rename project
            const renameBtn = item.querySelector('.rename-project');
            renameBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.renameProject(projectId);
            });
            
            // Export project
            const exportBtn = item.querySelector('.export-project');
            exportBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.exportProject(projectId);
            });
        });
    }

    /**
     * Create HTML for a project item
     * @param {Object} project - Project metadata
     * @returns {string} HTML string
     */
    createProjectHTML(project) {
        const isCurrentProject = project.id === this.shaderEditor.getCurrentProjectId();
        const createdDate = new Date(project.createdAt).toLocaleDateString();
        const modifiedDate = new Date(project.modifiedAt).toLocaleDateString();
        const modifiedTime = new Date(project.modifiedAt).toLocaleTimeString();

        return `
            <div class="project-item ${isCurrentProject ? 'current' : ''}" data-project-id="${project.id}">
                <div class="project-main">
                    <div class="project-info">
                        <div class="project-name">${this.escapeHtml(project.name)}</div>
                        <div class="project-dates">
                            <span class="created">Created: ${createdDate}</span>
                            <span class="modified">Modified: ${modifiedDate} ${modifiedTime}</span>
                        </div>
                    </div>
                    ${isCurrentProject ? '<div class="current-indicator">Current</div>' : ''}
                </div>
                <div class="project-actions">
                    <button class="action-btn rename-project" title="Rename">
                        <span>✏️</span>
                    </button>
                    <button class="action-btn export-project" title="Export">
                        <span>📤</span>
                    </button>
                    <button class="action-btn delete-project" title="Delete">
                        <span>🗑️</span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Filter projects based on search term
     * @param {string} searchTerm - Search term
     */
    filterProjects(searchTerm) {
        if (!searchTerm.trim()) {
            this.renderProjects();
            return;
        }

        const filtered = this.projects.filter(project =>
            project.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderProjects(filtered);
    }

    /**
     * Create a new project
     */
    async createNewProject() {
        try {
            const hasUnsaved = this.shaderEditor.hasUnsavedChanges();
            if (hasUnsaved) {
                const save = confirm('You have unsaved changes. Would you like to save the current project first?');
                if (save) {
                    await this.saveCurrentProject();
                }
            }

            this.shaderEditor.createNewProject();
            this.hide();
        } catch (error) {
            console.error('Failed to create new project:', error);
            alert('Failed to create new project: ' + error.message);
        }
    }

    /**
     * Save the current project
     */
    async saveCurrentProject() {
        try {
            const currentId = this.shaderEditor.getCurrentProjectId();
            let projectName;

            if (currentId) {
                // Updating existing project - keep current name
                const metadata = await this.shaderEditor.projectManager.getProjectMetadata(currentId);
                projectName = metadata?.name;
            } else {
                // New project - ask for name
                projectName = prompt('Enter a name for this project:', 'My Shader Project');
                if (!projectName) return; // User cancelled
            }

            await this.shaderEditor.saveCurrentProject(projectName);
            await this.refreshProjects();
        } catch (error) {
            console.error('Failed to save project:', error);
            alert('Failed to save project: ' + error.message);
        }
    }

    /**
     * Load a project
     * @param {string} projectId - Project ID to load
     */
    async loadProject(projectId) {
        try {
            const hasUnsaved = this.shaderEditor.hasUnsavedChanges();
            if (hasUnsaved && projectId !== this.shaderEditor.getCurrentProjectId()) {
                const save = confirm('You have unsaved changes. Would you like to save the current project first?');
                if (save) {
                    await this.saveCurrentProject();
                }
            }

            await this.shaderEditor.loadProject(projectId);
            this.hide();
        } catch (error) {
            console.error('Failed to load project:', error);
            alert('Failed to load project: ' + error.message);
        }
    }

    /**
     * Delete a project
     * @param {string} projectId - Project ID to delete
     */
    async deleteProject(projectId) {
        try {
            const project = this.projects.find(p => p.id === projectId);
            const confirmDelete = confirm(`Are you sure you want to delete "${project?.name || 'this project'}"?\n\nThis action cannot be undone.`);
            
            if (!confirmDelete) return;

            const success = await this.shaderEditor.deleteProject(projectId);
            if (success) {
                await this.refreshProjects();
            }
        } catch (error) {
            console.error('Failed to delete project:', error);
            alert('Failed to delete project: ' + error.message);
        }
    }

    /**
     * Rename a project
     * @param {string} projectId - Project ID to rename
     */
    async renameProject(projectId) {
        try {
            const project = this.projects.find(p => p.id === projectId);
            const newName = prompt('Enter new project name:', project?.name || '');
            
            if (!newName || newName === project?.name) return;

            const success = await this.shaderEditor.updateProjectName(projectId, newName);
            if (success) {
                await this.refreshProjects();
            }
        } catch (error) {
            console.error('Failed to rename project:', error);
            alert('Failed to rename project: ' + error.message);
        }
    }

    /**
     * Export a project to file
     * @param {string} projectId - Project ID to export
     */
    async exportProject(projectId) {
        try {
            await this.shaderEditor.exportProjectToFile(projectId);
        } catch (error) {
            console.error('Failed to export project:', error);
            alert('Failed to export project: ' + error.message);
        }
    }

    /**
     * Import a project from file
     */
    async importProject() {
        try {
            // Create a file input element
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            fileInput.style.display = 'none';
            
            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        try {
                            const data = JSON.parse(e.target.result);
                            await this.shaderEditor.importProjectFromFile(data);
                            await this.refreshProjects();
                        } catch (error) {
                            console.error('Failed to import project:', error);
                            alert('Failed to import project: ' + error.message);
                        }
                    };
                    reader.readAsText(file);
                }
                // Clean up
                document.body.removeChild(fileInput);
            });
            
            document.body.appendChild(fileInput);
            fileInput.click();
        } catch (error) {
            console.error('Failed to import project:', error);
            alert('Failed to import project: ' + error.message);
        }
    }

    /**
     * Update storage information
     */
    async updateStorageInfo() {
        try {
            const storageInfo = await this.shaderEditor.getStorageInfo();
            const storageElement = this.browserElement.querySelector('#storageInfo');
            
            if (storageInfo) {
                const usedMB = (storageInfo.usage / 1024 / 1024).toFixed(1);
                const totalMB = (storageInfo.quota / 1024 / 1024).toFixed(1);
                const percentage = ((storageInfo.usage / storageInfo.quota) * 100).toFixed(1);
                
                storageElement.innerHTML = `
                    <span>Storage: ${usedMB}MB / ${totalMB}MB (${percentage}%)</span>
                `;
            } else {
                storageElement.innerHTML = '<span>Storage info unavailable</span>';
            }
        } catch (error) {
            console.error('Failed to get storage info:', error);
            const storageElement = this.browserElement.querySelector('#storageInfo');
            storageElement.innerHTML = '<span>Storage info unavailable</span>';
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.browserElement && this.browserElement.parentNode) {
            this.browserElement.parentNode.removeChild(this.browserElement);
        }
        this.browserElement = null;
        this.shaderEditor = null;
    }
} 