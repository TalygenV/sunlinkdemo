import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { DocumentInfo } from './DocumentCard';

interface DocumentViewerProps {
  document: DocumentInfo;
  onClose: () => void;
  onDownload: (doc: DocumentInfo) => void;
}

/**
 * Document viewer modal component
 * Displays a document preview with zoom and navigation controls
 * Fully responsive for all device sizes
 */
// Portal container for document viewer
const portalRoot = typeof document !== 'undefined' ? document.body : null;

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  onClose,
  onDownload
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [documentBlobUrl, setDocumentBlobUrl] = useState<string | null>(null);
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);
  
  // Format date for document details
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };
  
  // Get appropriate icon and background color based on document type
  const getDocTypeStyles = () => {
    const fileType = document.fileType.toLowerCase();
    
    if (fileType.includes('pdf')) {
      return { bgColor: 'bg-red-500/20', textColor: 'text-red-400' };
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].some(ext => fileType.includes(ext))) {
      return { bgColor: 'bg-green-500/20', textColor: 'text-green-400' };
    } else if (['xls', 'xlsx', 'csv'].some(ext => fileType.includes(ext))) {
      return { bgColor: 'bg-emerald-500/20', textColor: 'text-emerald-400' };
    } else {
      return { bgColor: 'bg-orange-500/20', textColor: 'text-gray-400' };
    }
  };
  
  const typeStyles = getDocTypeStyles();
  
  // Handle document load events
  const handleDocumentLoad = () => {
    setIsLoading(false);
    setLoadError(false);
  };
  
  const handleDocumentError = () => {
    setIsLoading(false);
    setLoadError(true);
  };
  
  // Handle zoom controls
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };
  
  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };
  
  // Handle rotation
  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };
  
  // Check if document is an image
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].some(ext => 
    document.fileType.toLowerCase().includes(ext)
  );
  
  // Check if document is a PDF
  const isPDF = document.fileType.toLowerCase().includes('pdf');
  
  // Use effect to resolve document URL
  useEffect(() => {
    // Reset state when document changes
    setIsLoading(true);
    setLoadError(false);
    setDocumentBlobUrl(null);
    setIsResolvingUrl(true);
    
    // Check if downloadUrl is available in the document object
    if (document.downloadUrl) {
      // We have a direct download URL from Firebase Storage
      console.log('Using provided download URL');
      
      if (!isPDF) {
        // For images, we can use the download URL directly
        setDocumentBlobUrl(document.downloadUrl);
        setIsLoading(false);
        setIsResolvingUrl(false);
      } else {
        // For PDFs, we'll use the download URL directly in the iframe
        // Since iframes can bypass CORS restrictions
        setDocumentBlobUrl(document.downloadUrl);
        setIsLoading(false);
        setIsResolvingUrl(false);
      }
    } else {
      // Check if URL is absolute
      const isAbsoluteUrl = /^https?:\/\//i.test(document.url);
      
      if (isAbsoluteUrl) {
        // If it's an absolute URL, we can use it directly
        setDocumentBlobUrl(document.url);
        setIsLoading(false);
        setIsResolvingUrl(false);
      } else {
        // Need to get a download URL from Firebase Storage
        const resolveFirebaseUrl = async () => {
          try {
            console.log('Resolving firebase URL for:', document.url);
            // Import Firebase storage functions dynamically to avoid circular dependencies
            const { storage } = await import('../../../lib/firebase');
            const { ref, getDownloadURL } = await import('firebase/storage');
            
            // Create reference to the file in Firebase Storage
            const docRef = ref(storage, document.url);
            
            // Get the download URL
            const downloadUrl = await getDownloadURL(docRef);
            console.log('Resolved to download URL:', downloadUrl);
            
            // Set the download URL directly
            setDocumentBlobUrl(downloadUrl);
            setIsLoading(false);
          } catch (error) {
            console.error('Error resolving document URL:', error);
            setLoadError(true);
            setIsLoading(false);
          } finally {
            setIsResolvingUrl(false);
          }
        };
        
        resolveFirebaseUrl();
      }
    }
  }, [document.url, document.downloadUrl, isPDF]);
  
  // Function to get the correct source URL
  const getSourceUrl = () => {
    if (isResolvingUrl) return ''; // Still resolving
    
    // If we have a resolved URL, use it
    if (documentBlobUrl) return documentBlobUrl;
    
    // If we get here, URL resolution failed
    console.warn('Unable to resolve URL for document:', document);
    return '';
  };

  // Return null if portal root isn't available (SSR safe)
  if (!portalRoot) return null;
  
  // Create a portal to render the viewer outside the normal DOM hierarchy
  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(4px)',
      zIndex: 999999,
      pointerEvents: 'auto'
    }}>
      <motion.div
        className="w-full max-w-5xl h-[calc(100vh-32px)] bg-neutral-900 border border-white/10 rounded-xl overflow-hidden flex flex-col"
        style={{ position: 'relative', zIndex: 1000000 }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/30">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${typeStyles.bgColor} ${typeStyles.textColor}`}>
              <span className="text-sm font-medium">{document.fileType}</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">{document.name}</h3>
              <p className="text-sm text-white/60">Added on {formatDate(document.dateAdded)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => onDownload(document)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Download"
            >
              <Download size={20} />
            </motion.button>
            
            <motion.button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Close"
            >
              <X size={20} />
            </motion.button>
          </div>
        </div>
        
        {/* Document Viewing Area */}
        <div className="flex-1 overflow-auto relative bg-black/50">
          {/* Loading spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {/* Error message */}
          {loadError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
              <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-white text-center max-w-md">
                <p className="mb-2">Failed to load document preview.</p>
                <button
                  onClick={() => onDownload(document)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors inline-flex items-center gap-2"
                >
                  <Download size={16} />
                  <span>Download Instead</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Document preview */}
          <div className="w-full h-full flex items-center justify-center">
            {isPDF ? (
              // PDF embed for PDFs
              <div className="w-full h-full p-4 flex items-center justify-center">
                {isResolvingUrl ? (
                  <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : getSourceUrl() ? (
                  <iframe
                    src={getSourceUrl()}
                    className="w-full h-full border-0"
                    onLoad={handleDocumentLoad}
                    onError={handleDocumentError}
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                      transformOrigin: 'center center'
                    }}
                  ></iframe>
                ) : (
                  <div className="flex flex-col items-center justify-center text-white/70">
                    <p>Could not load document preview.</p>
                    <button
                      onClick={() => onDownload(document)}
                      className="mt-3 px-4 py-2 bg-orange-800/80 hover:bg-orange-700/80 rounded-lg text-white/70 transition-colors"
                    >
                      Download Instead
                    </button>
                  </div>
                )}
              </div>
            ) : isImage ? (
              // Image viewer for images
              <div className="w-full h-full p-4 flex items-center justify-center">
                {isResolvingUrl ? (
                  <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : getSourceUrl() ? (
                  <img
                    src={getSourceUrl()}
                    alt={document.name}
                    className="max-w-full max-h-full object-contain"
                    onLoad={handleDocumentLoad}
                    onError={handleDocumentError}
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                      transformOrigin: 'center center'
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-white/70">
                    <p>Could not load image preview.</p>
                    <button
                      onClick={() => onDownload(document)}
                      className="mt-3 px-4 py-2 bg-orange-800/80 hover:bg-orange-700/80 rounded-lg text-white/70 transition-colors"
                    >
                      Download Instead
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Generic file preview for other types
              <div className="w-full h-full p-4 flex flex-col items-center justify-center">
                <div className={`w-32 h-32 ${typeStyles.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                  <span className={`text-4xl font-bold ${typeStyles.textColor}`}>
                    {document.fileType.toUpperCase()}
                  </span>
                </div>
                <p className="text-white text-center mb-4">Preview not available for this file type.</p>
                <button
                  onClick={() => onDownload(document)}
                  className="px-6 py-3 bg-orange-800 hover:bg-orange-700 rounded-lg text-white transition-colors inline-flex items-center gap-2"
                >
                  <Download size={18} />
                  <span>Download File</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Controls footer */}
        {(isPDF || isImage) && (
          <div className="p-3 border-t border-white/10 bg-black/30 flex justify-center">
            <div className="flex items-center gap-2">
              <motion.button
                onClick={zoomOut}
                disabled={zoomLevel <= 0.5}
                className={`p-2 rounded-lg ${zoomLevel <= 0.5 ? 'text-white/30' : 'text-white/70 hover:text-white hover:bg-white/10'} transition-colors`}
                whileHover={zoomLevel > 0.5 ? { scale: 1.05 } : {}}
                whileTap={zoomLevel > 0.5 ? { scale: 0.95 } : {}}
                title="Zoom Out"
              >
                <ZoomOut size={20} />
              </motion.button>
              
              <span className="text-white/70 text-sm w-16 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              
              <motion.button
                onClick={zoomIn}
                disabled={zoomLevel >= 3}
                className={`p-2 rounded-lg ${zoomLevel >= 3 ? 'text-white/30' : 'text-white/70 hover:text-white hover:bg-white/10'} transition-colors`}
                whileHover={zoomLevel < 3 ? { scale: 1.05 } : {}}
                whileTap={zoomLevel < 3 ? { scale: 0.95 } : {}}
                title="Zoom In"
              >
                <ZoomIn size={20} />
              </motion.button>
              
              <div className="w-px h-6 bg-white/10 mx-2"></div>
              
              <motion.button
                onClick={rotate}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Rotate"
              >
                <RotateCw size={20} />
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </div>,
    portalRoot // Add portalRoot as the second argument to createPortal
  );
};