import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  ArrowDown, 
  X, 
  Download, 
  FileText, 
  Upload, 
  ArrowLeft,
  AlertCircle,
  Check
} from 'lucide-react';
import { auth, db, storage } from '../../../lib/firebase';
import { ref as dbRef, get, push, set } from 'firebase/database';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { DocumentCard, DocumentInfo } from '../documents/DocumentCard';
import { DocumentViewer } from '../documents/DocumentViewer';
import { LoadingState } from '../../ui/loaders';
import { InstallerPortalLayout } from '../layout/InstallerPortalLayout';

interface InstallerDocumentsPageProps {
  isAdmin?: boolean;
}

export const InstallerDocumentsPage: React.FC<InstallerDocumentsPageProps> = ({ isAdmin = false }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentInfo[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Document metadata
  const [documentName, setDocumentName] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [documentCategory, setDocumentCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Categories derived from documents
  const [categories, setCategories] = useState<string[]>([]);
  
  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!projectId) {
        setError('No project ID provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Get current user
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Check if the current user is an admin (admins have access to all projects)
        const adminRef = dbRef(db, `admins/${user.uid}`);
        const adminSnapshot = await get(adminRef);
        const isAdmin = adminSnapshot.exists();
        
        let customerNameTemp = 'Customer';
        
        if (!isAdmin) {
          // Verify the installer has access to this project
          const installerProjectRef = dbRef(db, `installers/${user.uid}/assignedProjects/${projectId}`);
          const installerProjectSnapshot = await get(installerProjectRef);
          
          if (!installerProjectSnapshot.exists()) {
            setError('You do not have access to this project');
            setLoading(false);
            return;
          }
          
          // Get customer name from installer record
          const installerProjectData = installerProjectSnapshot.val();
          customerNameTemp = installerProjectData.customerName || 'Customer';
        } else {
          // For admins, attempt to fetch the customer name directly from the user record
          const userRef = dbRef(db, `users/${projectId}`);
          const userSnapshot = await get(userRef);
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            customerNameTemp = userData.name || userData.customerName || 'Customer';
          }
        }
        
        // Set customer name
        setCustomerName(customerNameTemp);
        
        // Fetch documents from Firebase
        const docsRef = dbRef(db, `users/${projectId}/documents`);
        const snapshot = await get(docsRef);
        
        if (snapshot.exists()) {
          const docsData = snapshot.val();
          
          // Convert to array and add IDs
          const docsArray: DocumentInfo[] = Object.keys(docsData).map(key => ({
            id: key,
            ...docsData[key],
            previewAvailable: ['pdf', 'jpg', 'jpeg', 'png', 'gif'].some(
              ext => docsData[key].fileType.toLowerCase().includes(ext)
            )
          }));
          
          setDocuments(docsArray);
          setFilteredDocuments(docsArray);
          
          // Extract unique categories
          const uniqueCategories = Array.from(
            new Set(docsArray.map(doc => doc.category).filter(Boolean))
          ) as string[];
          
          setCategories(uniqueCategories);
        } else {
          // No documents found
          setDocuments([]);
          setFilteredDocuments([]);
          setCategories([]);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
        setError('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, [projectId]);
  
  // Filter and sort documents when filters change
  useEffect(() => {
    let filtered = [...documents];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(query) || 
        (doc.description && doc.description.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(doc => doc.category === categoryFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = a.fileType.localeCompare(b.fileType);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredDocuments(filtered);
  }, [documents, searchQuery, categoryFilter, sortBy, sortDirection]);
  
  // Handle document selection for viewing
  const handleSelectDocument = (document: DocumentInfo) => {
    setSelectedDocument(document);
  };
  
  // Handle document download
  const handleDownloadDocument = async (document: DocumentInfo) => {
    try {
      // If the document URL is already a download URL, use it directly
      if (document.url.startsWith('http')) {
        window.open(document.url, '_blank');
        return;
      }
      
      // Otherwise, get download URL from Firebase Storage
      const docRef = storageRef(storage, document.url);
      const downloadUrl = await getDownloadURL(docRef);
      
      // Open download in new tab
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Failed to download the document. Please try again.');
    }
  };
  
  // Close document viewer
  const handleCloseViewer = () => {
    setSelectedDocument(null);
  };
  
  // Toggle category dropdown
  const toggleCategoryDropdown = () => {
    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
  };
  
  // Handle category selection
  const handleCategorySelect = (category: string | null) => {
    setCategoryFilter(category);
    setIsCategoryDropdownOpen(false);
  };
  
  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter(null);
    setSortBy('date');
    setSortDirection('desc');
  };
  
  // Check if filters are active
  const isFilterActive = searchQuery || categoryFilter || sortBy !== 'date' || sortDirection !== 'desc';
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  // Get file type from file name
  const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop() || '';
    return extension.toUpperCase();
  };
  
  // Handle file upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !documentName || !projectId) {
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Create a file reference in storage
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const filePath = `projects/${projectId}/documents/${fileName}`;
      const fileRef = storageRef(storage, filePath);
      
      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(fileRef, selectedFile);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track upload progress
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          setError('Failed to upload file. Please try again.');
          setUploading(false);
        },
        async () => {
          // Upload completed successfully
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Create document entry in database
            const docsRef = dbRef(db, `users/${projectId}/documents`);
            const newDocRef = push(docsRef);
            
            const docData = {
              name: documentName,
              description: documentDescription,
              fileType: getFileType(selectedFile.name),
              dateAdded: new Date().toISOString(),
              url: filePath, // Store the storage path, not the URL
              size: `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`,
              category: documentCategory || 'General',
              uploadedBy: 'installer',
              downloadUrl: downloadURL
            };
            
            await set(newDocRef, docData);
            
            // Add new document to state
            const newDoc: DocumentInfo = {
              id: newDocRef.key || '',
              ...docData,
              previewAvailable: ['pdf', 'jpg', 'jpeg', 'png', 'gif'].some(
                ext => docData.fileType.toLowerCase().includes(ext)
              )
            };
            
            setDocuments(prev => [newDoc, ...prev]);
            
            // Update categories if needed
            if (docData.category && !categories.includes(docData.category)) {
              setCategories(prev => [...prev, docData.category]);
            }
            
            // Reset form
            setDocumentName('');
            setDocumentDescription('');
            setDocumentCategory('');
            setSelectedFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            
            // Show success message and hide form after delay
            setUploadSuccess(true);
            setTimeout(() => {
              setUploadSuccess(false);
              setShowUploadForm(false);
            }, 3000);
          } catch (error) {
            console.error('Error saving document data:', error);
            setError('Failed to save document information. Please try again.');
          } finally {
            setUploading(false);
          }
        }
      );
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload file. Please try again.');
      setUploading(false);
    }
  };
  
  // Return to project details
  const handleBackClick = () => {
    navigate(`/installer/project/${projectId}`);
  };
  
  // Handle error state
  if (error) {
    return (
      <InstallerPortalLayout isAdmin={isAdmin}>
        <div className="p-6 bg-black/20 backdrop-blur-sm rounded-xl border border-red-500/20">
          <h3 className="text-xl font-medium text-white mb-2">Document Repository Error</h3>
          <p className="text-white/70">{error}</p>
          <div className="mt-6">
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
            >
              <ArrowLeft size={18} />
              <span>Back to Project</span>
            </button>
          </div>
        </div>
      </InstallerPortalLayout>
    );
  }
  
  // Handle loading state
  if (loading) {
    return (
      <InstallerPortalLayout isAdmin={isAdmin}>
        <LoadingState />
      </InstallerPortalLayout>
    );
  }
  
  return (
    <InstallerPortalLayout isAdmin={isAdmin}>
      <div className="w-full space-y-6">
        {/* Back button */}
        <button
          onClick={handleBackClick}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back to Project</span>
        </button>
        
        {/* Upload button and form */}
        <div className="bg-black/20 backdrop-blur-lg rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-medium text-white">Project Documents</h2>
              <p className="text-white/60">
                Customer: {customerName}
              </p>
            </div>
            
            {!showUploadForm && (
              <button
                onClick={() => setShowUploadForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-yellow-400 rounded-lg transition-colors"
              >
                <Upload size={18} />
                <span>Upload Document</span>
              </button>
            )}
          </div>
          
          {/* Upload form */}
          {showUploadForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <form onSubmit={handleUpload} className="p-4 bg-black/30 rounded-lg border border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-medium">Upload New Document</h3>
                  <button
                    type="button"
                    onClick={() => setShowUploadForm(false)}
                    className="text-white/50 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                {uploadSuccess ? (
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 mb-4">
                    <Check size={18} />
                    <span>Document uploaded successfully!</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/70 text-sm mb-1">Document Name*</label>
                      <input
                        type="text"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                        className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white/70 text-sm mb-1">Description</label>
                      <textarea
                        value={documentDescription}
                        onChange={(e) => setDocumentDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 min-h-[80px]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white/70 text-sm mb-1">Category</label>
                      <input
                        type="text"
                        value={documentCategory}
                        onChange={(e) => setDocumentCategory(e.target.value)}
                        placeholder="e.g., Contracts, Permits, Photos"
                        className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white/70 text-sm mb-1">File*</label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-500/20 file:text-yellow-400 hover:file:bg-orange-500/30"
                        required
                      />
                      {selectedFile && (
                        <p className="mt-1 text-white/50 text-sm">
                          Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                    
                    {uploading ? (
                      <div className="space-y-2">
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500 rounded-full" 
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-white/70 text-sm text-center">
                          Uploading: {uploadProgress}%
                        </p>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setShowUploadForm(false)}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!selectedFile || !documentName}
                          className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-yellow-400 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Upload Document
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </motion.div>
          )}
        </div>
        
        {/* Document repository */}
        <div className="bg-black/20 backdrop-blur-lg rounded-xl border border-white/10 p-6 pb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <h2 className="text-xl font-medium text-white">Document Repository</h2>
            
            {/* Search input */}
            <div className="relative w-full sm:w-auto">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-80 pl-10 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
          
          {/* Filters and sorting */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Category filter */}
            <div className="relative">
              <button 
                onClick={toggleCategoryDropdown}
                className="flex items-center gap-2 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white/70 hover:text-white"
              >
                <Filter size={16} />
                <span>{categoryFilter || 'Filter by category'}</span>
              </button>
              
              {/* Category dropdown */}
              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 z-10 bg-orange-900 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                  <div className="p-2">
                    <button
                      onClick={() => handleCategorySelect(null)}
                      className={`w-full text-left px-3 py-2 rounded-md ${!categoryFilter ? 'bg-orange-500/20 text-yellow-400' : 'text-white/70 hover:bg-white/5'}`}
                    >
                      All categories
                    </button>
                    
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => handleCategorySelect(category)}
                        className={`w-full text-left px-3 py-2 rounded-md ${categoryFilter === category ? 'bg-orange-500/20 text-yellow-400' : 'text-white/70 hover:bg-white/5'}`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Sort by */}
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-sm">Sort by:</span>
              
              <button
                onClick={() => setSortBy('date')}
                className={`px-3 py-1.5 rounded-md text-sm ${sortBy === 'date' ? 'bg-orange-500/20 text-yellow-400' : 'text-white/70 hover:bg-white/5'}`}
              >
                Date
              </button>
              
              <button
                onClick={() => setSortBy('name')}
                className={`px-3 py-1.5 rounded-md text-sm ${sortBy === 'name' ? 'bg-orange-500/20 text-yellow-400' : 'text-white/70 hover:bg-white/5'}`}
              >
                Name
              </button>
              
              <button
                onClick={() => setSortBy('type')}
                className={`px-3 py-1.5 rounded-md text-sm ${sortBy === 'type' ? 'bg-orange-500/20 text-yellow-400' : 'text-white/70 hover:bg-white/5'}`}
              >
                Type
              </button>
              
              <button
                onClick={toggleSortDirection}
                className="p-1.5 rounded-md text-white/70 hover:bg-white/5 hover:text-white"
                title={sortDirection === 'asc' ? 'Sort ascending' : 'Sort descending'}
              >
                <ArrowDown 
                  size={16} 
                  className={sortDirection === 'asc' ? 'transform rotate-180' : ''} 
                />
              </button>
            </div>
            
            {/* Reset filters button */}
            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-md text-white/70 hover:text-white hover:bg-white/10 text-sm"
              >
                <X size={14} />
                <span>Reset filters</span>
              </button>
            )}
          </div>
          
          {/* Results count */}
          <div className="mb-6">
            <p className="text-white/60 text-sm">
              Showing {filteredDocuments.length} of {documents.length} documents
            </p>
          </div>
          
          {/* Document grid */}
          {filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map(document => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  onSelect={handleSelectDocument}
                  onDownload={handleDownloadDocument}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-black/20 rounded-xl border border-white/5">
              <div className="p-4 bg-orange-500/10 rounded-full mb-4">
                <FileText size={32} className="text-yellow-400" />
              </div>
              <h3 className="text-white font-medium mb-2">No documents found</h3>
              <p className="text-white/60 text-center max-w-md">
                {documents.length === 0 
                  ? "There are no documents for this project yet. Use the 'Upload Document' button to add some."
                  : "No documents match your search criteria. Try adjusting your filters or search query."}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Document viewer modal */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={handleCloseViewer}
          onDownload={handleDownloadDocument}
        />
      )}
    </InstallerPortalLayout>
  );
};