# Block Revisions Plugin

A WordPress plugin that provides enhanced block-based revision management aligned with the Gutenberg roadmap.

## Features

### Visual Comparison Modes
- **Inline Mode**: Shows changes directly in the editor with visual indicators
- **Side-by-Side Mode**: Compare revisions side-by-side for better visual diff
- Toggle between modes with the view switcher or `Ctrl+V`

### Enhanced Revision Browser  
- Revision list with timestamps and author information
- Change count indicators showing:
  - `+N` blocks added (green)
  - `-N` blocks removed (red)  
  - `~N` blocks modified (blue)
- Scrollable revision list for better performance with many revisions

### Block-Level Operations
- Individual block focusing and selection
- UUID-based block tracking across revisions
- Block restoration interface (UI ready)
- Visual indicators for added, removed, and changed blocks

### Keyboard Navigation
- `Ctrl+↑/↓`: Navigate between revisions
- `Ctrl+V`: Toggle between inline and side-by-side view modes

### Performance Optimizations
- Diff calculation caching for improved performance
- Lazy loading of revision diffs
- Optimized rendering for large documents

## Installation

1. Upload the plugin files to `/wp-content/plugins/block-revisions/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Edit a post with blocks to see the "Version History" sidebar panel

## Usage

1. Open the block editor for any post/page
2. Click the "Version History" item in the sidebar more menu (three dots)
3. The revision sidebar will show available revisions
4. Click any revision to view changes
5. Use the view toggle to switch between inline and side-by-side modes
6. Use keyboard shortcuts for faster navigation

## Technical Details

- Built with React and WordPress Gutenberg APIs
- Uses UUID-based block tracking for precise diff calculation
- Character-level diffing for text blocks
- Visual diff rendering with proper change indicators
- CSS-based styling integrated with WordPress admin theme

## Alignment with Gutenberg Roadmap

This plugin addresses several key points from the Gutenberg collaboration roadmap:

1. ✅ **Visual Comparison**: Beyond HTML diffing with proper visual indicators
2. ✅ **Block Integration**: Block-level change tracking and focusing
3. ✅ **Restoration Workflows**: UI for block-level restoration
4. ✅ **Improved Visual Tools**: Side-by-side and overlay comparison modes
5. ✅ **Performance**: Optimized for broader usage with caching and lazy loading

## Development

### Building
```bash
npm install
npm run build
```

### File Structure
- `src/` - JavaScript source files
- `includes/` - PHP backend and CSS files
- `dist/` - Built JavaScript bundle