import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ArrowDown, X, Download, FileText } from 'lucide-react';
import { auth, db, storage } from '../../../lib/firebase';
import { ref as dbRef, get } from 'firebase/database';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';
import { DocumentCard, DocumentInfo } from './DocumentCard';
import { DocumentViewer } from './DocumentViewer';
import { LoadingState } from '../../ui/loaders';

interface DocumentRepositoryProps {
  className?: string;
}

/**
 * Document Repository component
 * Displays a searchable, filterable grid of customer documents
 * with ability to view and download files
 */
export const DocumentRepository: React.FC<DocumentRepositoryProps> = ({
  className = ''
}) => {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentInfo[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Categories derived from documents
  const [categories, setCategories] = useState<string[]>([]);
  
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
  
  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isCategoryDropdownOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.category-filter-container')) {
          setIsCategoryDropdownOpen(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryDropdownOpen]);
  
  // Fetch documents from Firebase
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Fetch documents from Firebase
        const docsRef = dbRef(db, `users/${user.uid}/documents`);
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
          // No documents found, use sample data
          // const sampleDocuments: DocumentInfo[] = [
          //   {
          //     id: '1',
          //     name: 'Installation Agreement',
          //     description: 'Solar system installation contract',
          //     fileType: 'PDF',
          //     dateAdded: '2025-04-10',
          //     url: 'https://example.com/installation_agreement.pdf',
          //     size: '2.3 MB',
          //     category: 'Contracts',
          //     previewAvailable: true
          //   },
          //   {
          //     id: '2',
          //     name: 'System Design Report',
          //     description: 'Technical specifications of your solar installation',
          //     fileType: 'PDF',
          //     dateAdded: '2025-04-12',
          //     url: 'https://example.com/design_report.pdf',
          //     size: '4.7 MB',
          //     category: 'Technical',
          //     previewAvailable: true
          //   },
          //   {
          //     id: '3',
          //     name: 'Warranty Information',
          //     description: 'Panel and system warranty details',
          //     fileType: 'PDF',
          //     dateAdded: '2025-04-15',
          //     url: 'https://example.com/warranty.pdf',
          //     size: '1.2 MB',
          //     category: 'Warranty',
          //     previewAvailable: true
          //   },
          //   {
          //     id: '4',
          //     name: 'Permit Application',
          //     description: 'Local building department permit application',
          //     fileType: 'PDF',
          //     dateAdded: '2025-04-16',
          //     url: 'https://example.com/permit.pdf',
          //     size: '3.5 MB',
          //     category: 'Permits',
          //     previewAvailable: true
          //   },
          //   {
          //     id: '5',
          //     name: 'Site Survey Photos',
          //     description: 'Photos taken during the site survey',
          //     fileType: 'JPG',
          //     dateAdded: '2025-04-18',
          //     url: 'https://example.com/survey_photos.jpg',
          //     size: '8.1 MB',
          //     category: 'Photos',
          //     previewAvailable: true
          //   },
          //   {
          //     id: '6',
          //     name: 'Energy Production Estimate',
          //     description: 'Projected energy production for your system',
          //     fileType: 'XLSX',
          //     dateAdded: '2025-04-20',
          //     url: 'https://example.com/production.xlsx',
          //     size: '1.8 MB',
          //     category: 'Reports',
          //     previewAvailable: false
          //   }
          // ];
          
          // setDocuments(sampleDocuments);
          // setFilteredDocuments(sampleDocuments);
          
          // // Extract unique categories
          // const uniqueCategories = Array.from(
          //   new Set(sampleDocuments.map(doc => doc.category).filter(Boolean))
          // ) as string[];
          
          // setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
        setError('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, []);
  
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
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter(null);
    setSortBy('date');
    setSortDirection('desc');
  };
  
  // Check if filters are active
  const isFilterActive = searchQuery || categoryFilter || sortBy !== 'date' || sortDirection !== 'desc';
  
  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };
  
  // Handle error state
  if (error) {
    return (
      <div className={`p-6 bg-black/20 backdrop-blur-sm rounded-xl border border-red-500/20 ${className}`}>
        <h3 className="text-xl font-medium text-white mb-2">Document Repository Error</h3>
        <p className="text-white/70">{error}</p>
        <p className="mt-4 text-white/50 text-sm">
          Please try refreshing the page or contact support if this issue persists.
        </p>
      </div>
    );
  }
  
  // Handle loading state
  if (loading) {
    return <LoadingState />;
  }
  
  return (
    <div className={`${className}`}>
      <div className="bg-black/20 backdrop-blur-lg rounded-xl border border-white/10 p-6 pb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <h2 className="text-2xl font-medium text-white">Document Repository</h2>
          
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
          <div className="relative category-filter-container">
            <button 
              onClick={toggleCategoryDropdown}
              className="flex items-center gap-2 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white/70 hover:text-white"
            >
              <Filter size={16} />
              <span>{categoryFilter || 'Filter by category'}</span>
            </button>
            
            {/* Category dropdown - only shown when open */}
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
              We couldn't find any documents matching your search criteria. Try adjusting your filters or search query.
            </p>
          </div>
        )}
      </div>
      
      {/* Document viewer modal */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={handleCloseViewer}
          onDownload={handleDownloadDocument}
        />
      )}
    </div>
  );
};