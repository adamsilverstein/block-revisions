# Changelog

## [2.0.0] - Gutenberg Roadmap Alignment Update

### Added
- **Side-by-Side Comparison Mode**: New visual comparison mode showing old and new versions side by side
- **Enhanced Visual Indicators**: Change count badges showing added (+), removed (-), and modified (~) blocks
- **Keyboard Navigation**: 
  - `Ctrl+↑/↓`: Navigate between revisions
  - `Ctrl+V`: Toggle between inline and side-by-side view modes
- **Block Focus System**: Click on individual blocks to focus and analyze specific changes
- **Block Restoration UI**: Interface framework for restoring individual blocks (functionality placeholder)
- **Performance Optimizations**:
  - Diff calculation caching using Map-based storage
  - Lazy loading of revision comparisons
  - Optimized rendering for large documents
- **Improved UX**:
  - Scrollable revision list for better memory management
  - Keyboard shortcut hints in the interface
  - Better visual hierarchy with enhanced CSS
  - Responsive design improvements

### Enhanced
- **Revision Browser**: Now shows change statistics and better visual feedback
- **Visual Diff System**: Improved beyond basic HTML diffing with proper block-level comparison
- **CSS Architecture**: Separated and comprehensive styling system
- **Component Structure**: Better state management and performance optimization

### Technical Improvements
- Fixed webpack build configuration for proper output generation
- Added comprehensive CSS file for better maintainability  
- Implemented proper build system with legacy OpenSSL support
- Enhanced block filtering system with improved user interaction
- Added proper cleanup and event management for keyboard navigation

### Documentation
- Added comprehensive README with usage instructions
- Documented all keyboard shortcuts and features
- Added developer setup and build instructions
- Created changelog for version tracking

### Gutenberg Roadmap Alignment
This update addresses the key requirements from the Gutenberg collaboration roadmap:

1. ✅ **Visual Comparison**: Implemented side-by-side view with proper visual diffing beyond HTML markup comparison
2. ✅ **Block Integration**: Added block-level change tracking with UUID system and individual block focusing
3. ✅ **Restoration Workflows**: Built UI framework for block-level restoration capabilities
4. ✅ **Performance**: Optimized diff calculation and rendering for broader usage scenarios
5. ✅ **Visual Tools**: Enhanced comparison tools with multiple view modes and better change visualization

## [1.0.1] - Previous Version
### Initial Features
- Basic revision listing with date/author information
- Block-level UUID tracking and diffing
- Visual status indicators for blocks
- Character-level diffing for text blocks
- WordPress admin integration via plugin sidebar