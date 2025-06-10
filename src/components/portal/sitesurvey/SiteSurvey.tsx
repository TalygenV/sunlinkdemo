import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Check, X, Camera, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../../../lib/firebase';
import { ref as dbRef, get, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CustomerPortalLayout } from '../layout/CustomerPortalLayout';

// Define the required image types for site survey
interface SurveyImage {
  id: string;
  name: string;
  description: string;
  image: File | null;
  url: string;
  status: 'pending' | 'uploading' | 'complete' | 'error';
}

export const SiteSurvey: React.FC = () => {
  const [images, setImages] = useState<SurveyImage[]>([
    {
      id: 'utility-bill',
      name: 'Utility Bill',
      description: 'Most recent electricity bill showing usage',
      image: null,
      url: '',
      status: 'pending'
    },
    {
      id: 'front-home',
      name: 'Front of Home',
      description: 'Clear photo of the front of your house',
      image: null,
      url: '',
      status: 'pending'
    },
    {
      id: 'meter-closeup',
      name: 'Power Meter (Close-up)',
      description: 'Detailed photo of your electrical meter',
      image: null,
      url: '',
      status: 'pending'
    },
    {
      id: 'meter-distant',
      name: 'Power Meter (Distant)',
      description: 'Photo showing the meter and surrounding area',
      image: null,
      url: '',
      status: 'pending'
    },
    {
      id: 'attic',
      name: 'Attic Photo',
      description: 'Photo of your attic showing rafters and structure',
      image: null,
      url: '',
      status: 'pending'
    },
    {
      id: 'service-panel',
      name: 'Main Service Panel',
      description: 'Photo of your electrical service panel',
      image: null,
      url: '',
      status: 'pending'
    }
  ]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Add refs for file inputs
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Fetch survey status on mount
  useEffect(() => {
    const fetchSurveyStatus = async () => {
      const user = auth.currentUser;
      if (!user) {
        setIsLoading(false);
        navigate('/auth/login'); 
        return;
      }

      const userRef = dbRef(db, `users/${user.uid}`);
      try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          if (userData.sitesurveysubmitted && userData.siteSurveyImages) {
            setIsSubmitted(true);
            setUploadComplete(true);

            setImages(prevImages =>
              prevImages.map(img => {
                const url = userData.siteSurveyImages[img.id];
                return url ? { ...img, url: url, status: 'complete', image: null } : img;
              })
            );
          }
        }
      } catch (error) {
        console.error('Error fetching site survey status:', error);
        setErrorMessage('Failed to load site survey status.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurveyStatus();
  }, [navigate]);

  // Handle file selection
  const handleFileSelect = (id: string, file: File) => {
    setImages(prevImages => 
      prevImages.map(img => 
        img.id === id 
          ? { ...img, image: file, status: 'pending' } 
          : img
      )
    );
  };

  // Handle image upload to Firebase Storage
  const handleUpload = async () => {
   
    // Validate that all required images are selected
    const missingImages = images.filter(img => !img.image);
    if (missingImages.length > 0) {
      setErrorMessage(`Please upload all required images: ${missingImages.map(img => img.name).join(', ')}.`);
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);
      
      // Get current user
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Upload each image to Firebase Storage
      let completedUploads = 0;
      const totalImages = images.length;
      const updatedImages = [...images];
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (!image.image) continue;
        
        // Update status to uploading
        updatedImages[i] = { ...image, status: 'uploading' };
        setImages(updatedImages);
        
        // Create a reference to store the image
        const imageRef = storageRef(storage, `users/${user.uid}/sitesurvey/${image.id}`);
        
        try {
          // Upload the image
          const snapshot = await uploadBytes(imageRef, image.image);
          
          // Get the download URL
          const downloadURL = await getDownloadURL(snapshot.ref);
          
          // Update status to complete
          updatedImages[i] = { 
            ...image, 
            url: downloadURL, 
            status: 'complete' 
          };
          
          // Update progress
          completedUploads++;
          setUploadProgress(Math.round((completedUploads / totalImages) * 100));
        } catch (error) {
          console.error(`Error uploading ${image.name}:`, error);
          updatedImages[i] = { ...image, status: 'error' };
        }
        
        setImages(updatedImages);
      }
      
      // Update user data in Firebase to mark site survey as submitted
      const userRef = dbRef(db, `users/${user.uid}`);
      await update(userRef, {
        sitesurveysubmitted: true,
        sitesurveyTimestamp: Date.now(),
        siteSurveyImages: updatedImages.reduce((acc, img) => {
          acc[img.id] = img.url;
          return acc;
        }, {} as Record<string, string>)
      });
      
      setUploadComplete(true);
      
      // Reset the progress after a short delay
      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error uploading site survey images:', error);
      setErrorMessage('Failed to upload site survey images. Please try again.');
      setIsUploading(false);
    }
  };

  return (
   
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-light text-white mb-2">Site Survey</h1>
          <p className="text-white/70">
            Please upload the required photos to help us prepare for your solar installation.
          </p>
        </motion.div>
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <p className="text-white/70">Loading survey status...</p> 
            {/* You can replace this with a spinner component */}
          </div>
        )}

        {!isLoading && (
          <>
            {/* Image upload grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {images.map((image, index) => (
                <motion.div
                  key={image.id}
                  className="p-5 bg-black/30 backdrop-blur-lg rounded-xl border border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`p-2 rounded-full ${getStatusColor(image.status)}`}>
                        {getStatusIcon(image.status)}
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{image.name}</h3>
                        <p className="text-xs text-white/50 mt-1">{image.description}</p>
                      </div>
                    </div>
                    
                    {/* Image container with consistent dimensions */}
                    <div className="mt-4 h-[300px] w-[400px] flex flex-col mx-auto">
                      {(image.image || (isSubmitted && image.url)) ? (
                        <div className="flex flex-col h-full">
                          <div className="flex-1 bg-black/40 rounded-lg overflow-hidden relative ">
                            <img 
                              src={isSubmitted && image.url ? image.url : URL.createObjectURL(image.image!)} 
                              alt={image.name}
                              className="w-full h-full object-fill"
                            />
                          </div>
                          {!isSubmitted && image.image && (
                            <div className="flex justify-between items-center mt-2">
                              <p className="text-xs text-white/50">
                                {image.image.name.length > 20 
                                  ? image.image.name.substring(0, 20) + '...' 
                                  : image.image.name}
                              </p>
                              <button
                                className="text-white/70 hover:text-white"
                                onClick={() => {
                                  // Clear the current image first to force a re-render with new file
                                  setImages(prevImages =>
                                    prevImages.map(img =>
                                      img.id === image.id
                                        ? { ...img, image: null, status: 'pending' }
                                        : img
                                    )
                                  );
                                  // Trigger the corresponding file input click
                                  setTimeout(() => {
                                    if (fileInputRefs.current[image.id]) {
                                      fileInputRefs.current[image.id]?.click();
                                    }
                                  }, 10);
                                }}
                                disabled={isUploading}
                              >
                                Change
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <label 
                          className={`h-full cursor-pointer flex flex-col items-center justify-center border border-dashed border-white/20 rounded-lg ${isSubmitted ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'} transition-colors`}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={el => fileInputRefs.current[image.id] = el}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileSelect(image.id, e.target.files[0]);
                              }
                            }}
                            disabled={isUploading || isSubmitted}
                          />
                          <Camera size={36} className="text-white/40 mb-3" />
                          <p className="text-white/70 text-center">{isSubmitted ? 'Image Submitted' : 'Click to upload'}</p>
                          {!isSubmitted && (
                             <p className="text-xs text-white/40 text-center mt-1">
                           JPEG, PNG or HEIC
                         </p>
                          )}
                         
                        </label>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Submit button - Hide if submitted */}
            {!isSubmitted && (
              <motion.div
                className="flex justify-center mb-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpload}
                  disabled={isUploading || uploadComplete}
                  className="btn-sheen relative z-10 h-[52px] flex items-center justify-center gap-3 px-8 text-white rounded-full shadow-xl transition-all duration-500 border border-white/10 text-sm font-medium tracking-wider group disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Upload size={18} className="group-hover:scale-110 transition-transform duration-300" />
                  <span>Submit Site Survey</span>
                </motion.button>
              </motion.div>
            )}

            {errorMessage && (
              <motion.div
                className="mb-8 p-5 bg-gradient-to-br from-red-900/20 to-red-800/20 backdrop-blur-lg rounded-xl border border-red-500/20"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-red-500/20 text-red-400">
                    <X size={20} />
                  </div>
                  <p className="text-white/90">{errorMessage}</p>
                </div>
              </motion.div>
            )}
            {/* Display persistent submitted message if applicable */}
            {isSubmitted && !isUploading && (
              <motion.div
                className="mb-8 p-6 bg-gradient-to-br from-blue-900/20 to-blue-800/20 backdrop-blur-lg rounded-xl border border-blue-500/20 shadow-xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-500/20 text-yellow-400">
                    <Check size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-medium text-white">Survey Submitted</h2>
                    <p className="text-white/70">
                      Your site survey photos have been successfully submitted.
                    </p>
                  </div>
                </div>
                 {/* Optionally keep the dashboard button or remove if redundant */}
                 <div className="mt-4 flex justify-end">
                   <motion.button
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                     onClick={() => navigate('/portal')}
                     className="btn-sheen px-6 py-2 text-white rounded-full shadow-xl transition-all duration-300 border border-white/10 text-sm font-medium tracking-wider group"
                   >
                     Return to Dashboard
                   </motion.button>
                 </div>
              </motion.div>
            )}

              {uploadComplete && !isSubmitted && ( // Show success only after initial upload, not on revisit
              <motion.div
                className="mb-8 p-6 bg-gradient-to-br from-green-900/20 to-green-800/20 backdrop-blur-lg rounded-xl border border-green-500/20 shadow-xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-500/20 text-green-400">
                    <Check size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-medium text-white">Upload Complete!</h2>
                    <p className="text-white/70">
                      Thank you for submitting your site survey photos. Our team will review them shortly.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/portal')}
                    className="btn-sheen px-6 py-2 text-white rounded-full shadow-xl transition-all duration-300 border border-white/10 text-sm font-medium tracking-wider group"
                  >
                    Return to Dashboard
                  </motion.button>
                </div>
              </motion.div>
            )}
            
            {/* Upload progress - Hide if submitted and not uploading */}
            {isUploading && (
              <motion.div
                className="mb-8 p-5 bg-black/30 backdrop-blur-lg rounded-xl border border-white/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-white mb-2">Uploading... {uploadProgress}%</p>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-600 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
      
 
  );
};

// Helper function to get icon color based on status
function getStatusColor(status: SurveyImage['status']) {
  switch (status) {
    case 'complete':
      return 'bg-green-500/20 text-green-400';
    case 'error':
      return 'bg-red-500/20 text-red-400';
    case 'uploading':
      return 'bg-orange-500/20 text-yellow-400';
    default:
      return 'bg-white/10 text-white/50';
  }
}

// Helper function to get status icon
function getStatusIcon(status: SurveyImage['status']) {
  switch (status) {
    case 'complete':
      return <Check size={18} />;
    case 'error':
      return <X size={18} />;
    case 'uploading':
      return <Upload size={18} />;
    default:
      return <ImageIcon size={18} />;
  }
} 