# System Patterns

This file documents recurring patterns and standards used in the project.
It is optional, but recommended to be updated as the project evolves.
2025-04-24 18:36:50 - Log of updates made.

*

## Coding Patterns

* React functional components with TypeScript
* Component organization with main components in src/components and testing variants in src/components/testing
* Utility functions organized by domain (mapHelpers, panelHelpers, polygonHelpers)
* Implementation plans documented in markdown files
* Mixed use of .tsx (TypeScript JSX) and .jsx files

## Architectural Patterns

* Component-based architecture
* Firebase for backend services
* Leaflet for map visualization
* 3D model integration for component visualization
* Separation of concerns between UI components and utility functions

## Testing Patterns

* Testing components in dedicated directory (src/components/testing)
* Demo components for showcasing functionality (ProgressBarDemo, etc.)
* Diagnostic utilities for debugging (PolygonDiagnostic)