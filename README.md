# Shader Editor - New Modular Structure

This document explains the new modular file structure for the Shader Editor project.

## Overview

The shader editor has been reorganized from a single large JavaScript file and monolithic CSS into a modular, component-based architecture. This improves maintainability, reusability, and development experience.

## File Structure

```
shader_editor/
├── src/                              # Source code directory
│   ├── components/                   # Component modules
│   │   ├── editor/                   # Editor-related components
│   │   │   ├── ShaderEditor.js       # Main coordinator class
│   │   │   └── CodeEditor.js         # ACE editor wrapper
│   │   ├── uniforms/                 # Uniform management
│   │   │   ├── UniformManager.js     # Uniform data management
│   │   │   └── UniformUI.js          # Uniform UI generation
│   │   ├── preview/                  # Preview and rendering
│   │   │   └── WebGLRenderer.js      # WebGL rendering engine
│   │   └── ui/                       # UI components
│   │       ├── TabManager.js         # Tab switching logic
│   │       ├── Controls.js           # Header controls
│   │       └── ErrorConsole.js       # Error display
│   ├── styles/                       # Stylesheets
│   │   ├── base/                     # Base styles
│   │   │   ├── variables.css         # CSS custom properties
│   │   │   ├── reset.css             # Reset styles
│   │   │   └── layout.css            # Layout styles
│   │   ├── components/               # Component styles
│   │   │   ├── controls.css          # Header and controls
│   │   │   ├── editor.css            # Editor and tabs
│   │   │   ├── preview.css           # Canvas preview
│   │   │   └── uniforms.css          # Uniform sidebar
│   │   └── main.css                  # Main import file
│   ├── shaders/                      # Shader files
│   │   ├── defaults/                 # Default shaders
│   │   │   ├── default.vert          # Default vertex shader
│   │   │   └── default.frag          # Default fragment shader
│   │   └── examples/                 # Example shaders (future)
│   ├── utils/                        # Utility functions
│   │   ├── debounce.js               # Debounce utilities
│   │   ├── validation.js             # Validation functions
│   │   └── webgl.js                  # WebGL utilities
│   ├── config/                       # Configuration
│   │   └── settings.js               # Default settings
│   └── main.js                       # Main entry point
├── index-new.html                    # New HTML file using modular structure
├── index.html                        # Original HTML file (kept for comparison)
├── js/shader-editor.js              # Original JavaScript file (kept for comparison)
├── css/style.css                    # Original CSS file (kept for comparison)
└── README-new-structure.md          # This file
```

## Architecture

### Component-Based Design

The new architecture follows a component-based approach where each major feature is encapsulated in its own module:

1. **ShaderEditor** - Main coordinator that initializes and manages all components
2. **CodeEditor** - Manages ACE editor instances for vertex and fragment shaders
3. **UniformManager** - Handles uniform data and logic
4. **UniformUI** - Generates and manages uniform UI elements
5. **WebGLRenderer** - Handles WebGL rendering and shader compilation
6. **TabManager** - Manages tab switching between shaders
7. **Controls** - Handles header controls and buttons
8. **ErrorConsole** - Manages error display

### Event-Driven Communication

Components communicate through custom DOM events, allowing for loose coupling:

- `shaderChanged` - Fired when shader code changes
- `uniformsChanged` - Fired when uniforms are modified
- `compileRequested` - Fired when compilation is requested
- `renderError` - Fired when rendering errors occur
- And many more...

### Modular CSS

CSS is organized into logical modules:

- **Base styles** - Variables, reset, and layout
- **Component styles** - Styles specific to each component
- **Responsive design** - Mobile-friendly responsive rules

## Benefits

### Maintainability
- **Smaller files**: Each file has a single responsibility
- **Clear dependencies**: Import/export structure makes dependencies explicit
- **Easier debugging**: Problems can be traced to specific modules

### Reusability
- **Component isolation**: Components can be reused in other projects
- **Utility functions**: Common functions are extracted into utils
- **Configurable settings**: Settings are centralized and easily modified

### Development Experience
- **Better organization**: Logical file structure makes navigation easier
- **Separation of concerns**: HTML, CSS, and JavaScript are properly separated
- **Modern JavaScript**: Uses ES6 modules and modern JavaScript features

## Usage

### Running the New Structure

Use the new `index-new.html` file to run the modular version:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="src/styles/main.css">
</head>
<body>
    <!-- HTML structure -->
    <script type="module" src="src/main.js"></script>
</body>
</html>
```

### Adding New Components

1. Create the component file in the appropriate directory
2. Export the component class/function
3. Import it in the main ShaderEditor class
4. Add component-specific styles to the styles directory
5. Import the styles in `main.css`

### Configuration

Modify `src/config/settings.js` to change default settings:

```javascript
export const DEFAULT_SETTINGS = {
    editor: {
        theme: 'ace/theme/monokai',
        fontSize: 14,
        // ... other settings
    }
};
```

## Migration Notes

### From Original Structure

The original files are preserved for reference:
- `index.html` - Original HTML file
- `js/shader-editor.js` - Original JavaScript file
- `css/style.css` - Original CSS file

### Key Changes

1. **JavaScript**: Split into 12+ focused modules
2. **CSS**: Split into 8 organized stylesheets with CSS variables
3. **HTML**: Updated to use modular structure
4. **Shaders**: Extracted into separate `.vert` and `.frag` files
5. **Configuration**: Centralized in `settings.js`

### Compatibility

The new structure maintains the same functionality as the original while providing better organization and maintainability. All features from the original single-file version are preserved.

## Future Enhancements

The modular structure makes it easier to add new features:

- **Shader examples**: Add more example shaders in `src/shaders/examples/`
- **Export/Import**: Add project save/load functionality
- **Plugin system**: Add support for shader plugins
- **Performance monitoring**: Add WebGL performance monitoring
- **Multiple canvases**: Support for multiple preview canvases

## Development

### File Watching

Since the project now uses ES6 modules, you'll need to serve it over HTTP (not file://) for module imports to work. Use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

### Adding Dependencies

External dependencies are loaded via CDN in the HTML file. For development dependencies, consider using a build system like Vite or Webpack.

## Contributing

When contributing to the modular structure:

1. Follow the established directory structure
2. Use consistent naming conventions
3. Add appropriate JSDoc comments
4. Update this README if you add new components
5. Test with both the original and new versions

## License

Same as the original project. 