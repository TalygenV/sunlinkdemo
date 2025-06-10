const WebGLContextManager = {
    activeContexts: 0,
    maxContexts: 4, // Increased from 3 to 6 to handle all battery models
    
    requestContext: function() {
      console.log("WebGLContextManager: Requesting context. Current active:", this.activeContexts, "Max:", this.maxContexts);
      if (this.activeContexts < this.maxContexts) {
        this.activeContexts++;
        console.log("WebGLContextManager: Context granted. Now active:", this.activeContexts);
        return true;
      }
      console.log("WebGLContextManager: Context denied. Already at max:", this.activeContexts);
      return false;
    },
    
    releaseContext: function() {
      if (this.activeContexts > 0) {
        this.activeContexts--;
        console.log("WebGLContextManager: Context released. Now active:", this.activeContexts);
      }
    },
    
    // Force reset all contexts - use with caution
    resetContexts: function() {
      console.log("WebGLContextManager: Resetting all contexts");
      this.activeContexts = 0;
      return true;
    }
  };
  
  export default WebGLContextManager;