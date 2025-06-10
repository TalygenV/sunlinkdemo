import * as Dialog from '@radix-ui/react-dialog';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface PreQualifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: string;
}

const PreQualifyModal: React.FC<PreQualifyModalProps> = ({ isOpen, onClose, planType }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    dateOfBirth: '',
    annualIncome: '',
    ssnLast4: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [showingDocuments, setShowingDocuments] = useState(false);
  const [formErrors, setFormErrors] = useState({
    firstName: '',
    lastName: '',
    address: '',
    dateOfBirth: '',
    annualIncome: '',
    ssnLast4: ''
  });

  const validateForm = () => {
    const errors = {
      firstName: '',
      lastName: '',
      address: '',
      dateOfBirth: '',
      annualIncome: '',
      ssnLast4: ''
    };
    let isValid = true;

    // First Name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
      isValid = false;
    } else if (!/^[a-zA-Z\s-']{2,50}$/.test(formData.firstName)) {
      errors.firstName = 'Please enter a valid first name';
      isValid = false;
    }

    // Last Name validation
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
      isValid = false;
    } else if (!/^[a-zA-Z\s-']{2,50}$/.test(formData.lastName)) {
      errors.lastName = 'Please enter a valid last name';
      isValid = false;
    }

    // Address validation
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
      isValid = false;
    } else if (formData.address.length < 5) {
      errors.address = 'Please enter a valid address';
      isValid = false;
    }

    // Date of Birth validation
    if (!formData.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
      isValid = false;
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 18) {
        errors.dateOfBirth = 'You must be at least 18 years old';
        isValid = false;
      }
    }

    // Annual Income validation
    if (!formData.annualIncome) {
      errors.annualIncome = 'Annual income is required';
      isValid = false;
    } else {
      const income = parseFloat(formData.annualIncome);
      if (isNaN(income) || income <= 0) {
        errors.annualIncome = 'Please enter a valid annual income';
        isValid = false;
      }
    }

    // SSN Last 4 validation
    if (!formData.ssnLast4) {
      errors.ssnLast4 = 'Last 4 digits of SSN is required';
      isValid = false;
    } else if (!/^\d{4}$/.test(formData.ssnLast4)) {
      errors.ssnLast4 = 'Please enter the last 4 digits of your SSN';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsLoading(false);
    setIsApproved(true);
  };

  const handleSendDocuments = () => {
    setShowingDocuments(true);
    setTimeout(() => {
      handleClose();
      navigate('/order-summary');
    }, 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleClose = () => {
    setIsLoading(false);
    setIsApproved(false);
    setShowingDocuments(false);
    setFormData({
      firstName: '',
      lastName: '',
      address: '',
      dateOfBirth: '',
      annualIncome: '',
      ssnLast4: ''
    });
    setFormErrors({
      firstName: '',
      lastName: '',
      address: '',
      dateOfBirth: '',
      annualIncome: '',
      ssnLast4: ''
    });
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-2xl bg-slate-900 rounded-xl shadow-xl border border-slate-700 max-h-[90vh] overflow-y-auto z-[10000]">
          <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-900 z-10">
            <Dialog.Title className="text-lg font-semibold text-white">
              {isApproved ? 'Congratulations!' : `Pre-qualify for ${planType}`}
            </Dialog.Title>
            <Dialog.Close className="text-slate-400 hover:text-white">
              <X size={20} />
            </Dialog.Close>
          </div>
          
          <div className="p-6">
            {isApproved ? (
              <div className="text-center py-8 space-y-6">
                <CheckCircle2 className="mx-auto text-green-500" size={64} />
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-green-400">
                    You've Been Pre-Qualified!
                  </h3>
                  <p className="text-lg text-slate-300">
                    Congratulations! You have been approved for up to $135,000 for your solar purchase.
                  </p>
                </div>
                <button
                  onClick={handleSendDocuments}
                  disabled={showingDocuments}
                  className="tesla-button"
                >
                  {showingDocuments ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Preparing Documents...
                    </>
                  ) : (
                    'Continue to Order Summary'
                  )}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`tesla-input ${formErrors.firstName ? 'border-red-500' : ''}`}
                    />
                    {formErrors.firstName && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`tesla-input ${formErrors.lastName ? 'border-red-500' : ''}`}
                    />
                    {formErrors.lastName && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`tesla-input ${formErrors.address ? 'border-red-500' : ''}`}
                  />
                  {formErrors.address && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className={`tesla-input ${formErrors.dateOfBirth ? 'border-red-500' : ''}`}
                    />
                    {formErrors.dateOfBirth && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.dateOfBirth}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Pre-tax Annual Income
                    </label>
                    <input
                      type="number"
                      name="annualIncome"
                      placeholder="$"
                      value={formData.annualIncome}
                      onChange={handleChange}
                      className={`tesla-input ${formErrors.annualIncome ? 'border-red-500' : ''}`}
                    />
                    {formErrors.annualIncome && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.annualIncome}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Last 4 Digits of SSN
                  </label>
                  <input
                    type="text"
                    name="ssnLast4"
                    maxLength={4}
                    value={formData.ssnLast4}
                    onChange={handleChange}
                    className={`tesla-input ${formErrors.ssnLast4 ? 'border-red-500' : ''}`}
                  />
                  {formErrors.ssnLast4 && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.ssnLast4}</p>
                  )}
                </div>

                <div className="tesla-card text-sm text-slate-300 space-y-2">
                  <p>
                    By submitting this form, you authorize us to perform a soft credit check. This inquiry:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Will NOT affect your credit score</li>
                    <li>Is only visible to you on your credit report</li>
                    <li>Helps determine your pre-qualification status</li>
                    <li>Does NOT guarantee final loan approval</li>
                  </ul>
                  <p className="text-xs text-slate-400 mt-2">
                    A hard credit check will only be performed if you choose to proceed with the loan application after pre-qualification.
                  </p>
                </div>

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="tesla-button"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Processing...
                      </>
                    ) : (
                      'Check Pre-qualification'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default PreQualifyModal;