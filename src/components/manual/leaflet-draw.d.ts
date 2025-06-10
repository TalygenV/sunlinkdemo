// Type definitions for Leaflet.Draw

declare module 'leaflet' {
  namespace Draw {
    namespace Event {
      const CREATED: string;
      const EDITED: string;
      const DELETED: string;
      const DRAWSTART: string;
      const DRAWSTOP: string;
      const DRAWVERTEX: string;
      const EDITSTART: string;
      const EDITMOVE: string;
      const EDITRESIZE: string;
      const EDITVERTEX: string;
      const EDITSTOP: string;
      const DELETESTART: string;
      const DELETESTOP: string;
    }
    
    class Polygon {
      constructor(map: L.Map, options?: any);
      enable(): void;
      disable(): void;
    }
    
    class Rectangle {
      constructor(map: L.Map, options?: any);
      enable(): void;
      disable(): void;
    }
    
    class Polyline {
      constructor(map: L.Map, options?: any);
      enable(): void;
      disable(): void;
    }
    
    class Circle {
      constructor(map: L.Map, options?: any);
      enable(): void;
      disable(): void;
    }
    
    class Marker {
      constructor(map: L.Map, options?: any);
      enable(): void;
      disable(): void;
    }
  }
  
  namespace Control {
    class Draw extends L.Control {
      constructor(options?: any);
    }
  }
  
  interface Map {
    editTools?: {
      startPolygon(): void;
      startMarker(): void;
      startPolyline(): void;
    };
  }
} 