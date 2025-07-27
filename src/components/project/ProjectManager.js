/**
 * ProjectManager - Handles project storage and retrieval using IndexedDB
 */
export class ProjectManager {
    constructor() {
        this.dbName = 'ShaderEditorProjects';
        this.dbVersion = 1;
        this.storeName = 'projects';
        this.db = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the IndexedDB database
     * @returns {Promise<boolean>} True if initialization was successful
     */
    async initialize() {
        if (this.isInitialized && this.db) {
            return true;
        }

        try {
            this.db = await this.openDatabase();
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize ProjectManager:', error);
            return false;
        }
    }

    /**
     * Open the IndexedDB database
     * @returns {Promise<IDBDatabase>} The database instance
     */
    openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject(new Error('Failed to open database'));
            };

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create the projects object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { 
                        keyPath: 'id',
                        autoIncrement: false 
                    });
                    
                    // Create indexes for better querying
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                    store.createIndex('modifiedAt', 'modifiedAt', { unique: false });
                }
            };
        });
    }

    /**
     * Generate a unique project ID
     * @returns {string} Unique ID
     */
    generateProjectId() {
        return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Save a project to IndexedDB
     * @param {Object} projectData - The project data to save
     * @param {string} projectName - Optional name for the project
     * @param {string} projectId - Optional ID for updating existing project
     * @returns {Promise<string>} The project ID
     */
    async saveProject(projectData, projectName = null, projectId = null) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const id = projectId || this.generateProjectId();
        const now = new Date().toISOString();
        
        const project = {
            id: id,
            name: projectName || `Project ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
            createdAt: projectId ? undefined : now, // Don't update createdAt for existing projects
            modifiedAt: now,
            version: "1.0",
            data: projectData
        };

        // Remove undefined properties
        if (project.createdAt === undefined) {
            delete project.createdAt;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            // If updating existing project, preserve createdAt
            if (projectId) {
                const getRequest = store.get(projectId);
                getRequest.onsuccess = () => {
                    const existingProject = getRequest.result;
                    if (existingProject) {
                        project.createdAt = existingProject.createdAt;
                    }
                    
                    const putRequest = store.put(project);
                    putRequest.onsuccess = () => resolve(id);
                    putRequest.onerror = () => reject(new Error('Failed to save project'));
                };
                getRequest.onerror = () => reject(new Error('Failed to retrieve existing project'));
            } else {
                const putRequest = store.put(project);
                putRequest.onsuccess = () => resolve(id);
                putRequest.onerror = () => reject(new Error('Failed to save project'));
            }
        });
    }

    /**
     * Load a project from IndexedDB
     * @param {string} projectId - The project ID to load
     * @returns {Promise<Object|null>} The project data or null if not found
     */
    async loadProject(projectId) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(projectId);

            request.onsuccess = () => {
                const project = request.result;
                resolve(project ? project.data : null);
            };

            request.onerror = () => {
                reject(new Error('Failed to load project'));
            };
        });
    }

    /**
     * Get all projects (metadata only)
     * @returns {Promise<Array>} Array of project metadata
     */
    async getAllProjects() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                const projects = request.result.map(project => ({
                    id: project.id,
                    name: project.name,
                    createdAt: project.createdAt,
                    modifiedAt: project.modifiedAt,
                    version: project.version
                }));
                
                // Sort by modification date (newest first)
                projects.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
                resolve(projects);
            };

            request.onerror = () => {
                reject(new Error('Failed to retrieve projects'));
            };
        });
    }

    /**
     * Delete a project from IndexedDB
     * @param {string} projectId - The project ID to delete
     * @returns {Promise<boolean>} True if deletion was successful
     */
    async deleteProject(projectId) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(projectId);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(new Error('Failed to delete project'));
        });
    }

    /**
     * Check if a project exists
     * @param {string} projectId - The project ID to check
     * @returns {Promise<boolean>} True if project exists
     */
    async projectExists(projectId) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.count(projectId);

            request.onsuccess = () => resolve(request.result > 0);
            request.onerror = () => reject(new Error('Failed to check project existence'));
        });
    }

    /**
     * Get project metadata by ID
     * @param {string} projectId - The project ID
     * @returns {Promise<Object|null>} Project metadata or null if not found
     */
    async getProjectMetadata(projectId) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(projectId);

            request.onsuccess = () => {
                const project = request.result;
                if (project) {
                    resolve({
                        id: project.id,
                        name: project.name,
                        createdAt: project.createdAt,
                        modifiedAt: project.modifiedAt,
                        version: project.version
                    });
                } else {
                    resolve(null);
                }
            };

            request.onerror = () => {
                reject(new Error('Failed to get project metadata'));
            };
        });
    }

    /**
     * Update project name
     * @param {string} projectId - The project ID
     * @param {string} newName - The new name
     * @returns {Promise<boolean>} True if update was successful
     */
    async updateProjectName(projectId, newName) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const getRequest = store.get(projectId);
            getRequest.onsuccess = () => {
                const project = getRequest.result;
                if (project) {
                    project.name = newName;
                    project.modifiedAt = new Date().toISOString();
                    
                    const putRequest = store.put(project);
                    putRequest.onsuccess = () => resolve(true);
                    putRequest.onerror = () => reject(new Error('Failed to update project name'));
                } else {
                    reject(new Error('Project not found'));
                }
            };
            getRequest.onerror = () => reject(new Error('Failed to retrieve project'));
        });
    }

    /**
     * Get storage usage information
     * @returns {Promise<Object>} Storage usage stats
     */
    async getStorageInfo() {
        try {
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                return {
                    quota: estimate.quota,
                    usage: estimate.usage,
                    available: estimate.quota - estimate.usage,
                    usageDetails: estimate.usageDetails
                };
            }
            return null;
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return null;
        }
    }

    /**
     * Clear all projects (for debugging/reset purposes)
     * @returns {Promise<boolean>} True if clearing was successful
     */
    async clearAllProjects() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(new Error('Failed to clear projects'));
        });
    }

    /**
     * Export a project as JSON (for backup/sharing)
     * @param {string} projectId - The project ID to export
     * @returns {Promise<Object|null>} The project data for export
     */
    async exportProject(projectId) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(projectId);

            request.onsuccess = () => {
                const project = request.result;
                resolve(project || null);
            };

            request.onerror = () => {
                reject(new Error('Failed to export project'));
            };
        });
    }

    /**
     * Import a project from JSON data
     * @param {Object} projectData - The project data to import
     * @param {string} projectName - Optional name for the imported project
     * @returns {Promise<string>} The new project ID
     */
    async importProject(projectData, projectName = null) {
        // If the imported data has a complete project structure, use the data field
        const actualData = projectData.data || projectData;
        const name = projectName || projectData.name || `Imported Project ${new Date().toLocaleDateString()}`;
        
        return await this.saveProject(actualData, name);
    }
} 