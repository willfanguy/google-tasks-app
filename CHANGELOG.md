# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-03

### Added
- Google Tasks integration with OAuth 2.0 authentication
- Kanban board view with drag-and-drop task management
- Task labels/tags for organization
- Advanced filtering and sorting capabilities
- Light and dark theme support
- Task list management (create, rename, delete)
- Task CRUD operations (create, read, update, delete)
- Persistent storage for user preferences and authentication
- React Error Boundary for graceful error handling
- Comprehensive IPC type interfaces for type safety

### Changed
- Updated to use structured IPC responses format for better error handling
- Improved notification system with proper memory management
- Enhanced development environment with proper NODE_ENV configuration
- Replaced `any` types with proper TypeScript interfaces throughout codebase
- Added explicit return types to functions for better type safety

### Fixed
- Memory leak in notification timeout handling
- IPC error handling to prevent channel crashes
- Development server hot-reload issues
- Type safety issues in preload bridge
- Removed unused components and code

### Technical Details
- Built with Electron 30, React 18, TypeScript 5
- State management with Zustand
- Drag-and-drop powered by @dnd-kit
- Styling with Tailwind CSS
- Google APIs integration via googleapis package

[1.0.0]: https://github.com/yourusername/google-tasks-app/releases/tag/v1.0.0
