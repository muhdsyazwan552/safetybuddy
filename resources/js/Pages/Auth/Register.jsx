import { useState } from 'react';
import axios from 'axios';
import { Head, Link, router } from '@inertiajs/react';
import { FiUser, FiMail, FiLock, FiBriefcase, FiHome, FiPhone, FiMapPin, FiChevronLeft } from 'react-icons/fi';
import NetBackground from '@/Components/shared/NetBackground';

const Register = () => {
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState(null);
const [formData, setFormData] = useState({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  account_type: '',
  phone: '',          // Add phone field
  address: '',        // Add address field
  terms: false
});
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

const validateStep = (step) => {
  const newErrors = {};
  
  if (step === 1 && !formData.account_type) {
    newErrors.account_type = 'Please select an account type';
  }
  
  if (step === 2) {
    if (!formData.name) newErrors.name = 'Full name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    if (!formData.address) newErrors.address = 'Address is required';
  }
  
  if (step === 3) {
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!formData.terms) newErrors.terms = 'You must accept the terms';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleAccountTypeSelect = (type) => {
  setFormData(prev => ({ ...prev, account_type: type }));
  setStep(2); // Always move to next step after selection
};

const nextStep = () => {
  // Validate CURRENT step before proceeding
  if (validateStep(step)) { 
    setStep(prev => prev + 1);
  } else {
    console.log('Validation failed', errors);
  }
};

  const prevStep = () => {
    if (step === 2) {
      setAccountType(null);
      setFormData(prev => ({ ...prev, account_type: '' }));
    }
    setStep(prev => prev - 1);
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  
  try {
    const response = await axios.post('/api/register', {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      password_confirmation: formData.password_confirmation,
      account_type: formData.account_type,
      phone: formData.phone,
      address: formData.address,
      terms: formData.terms
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.redirect) {
      window.location.href = response.data.redirect;
    }
  } catch (error) {
    if (error.response?.status === 422) {
      setErrors(error.response.data.errors);
    } else {
      setErrors({ general: error.message });
    }
  } finally {
    setIsLoading(false);
  }
};

  return (
    
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Stepper Side */}
      <div className="hidden md:block relative md:w-1/3 overflow-hidden bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-8 lg:p-12">
        <NetBackground points={70} maxDistance={170} />
        <div className="relative z-10 h-full flex flex-col items-center">
          <img 
            src="/images/logo.png" 
            alt="Company Logo" 
            className="h-24 w-24 rounded-full mb-6 ring-4 ring-brand-500"
          />
          
          <div className="flex-1 flex flex-col justify-center w-full max-w-xs">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-8">Create your account</h2>
            
            <div className="space-y-6">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-start">
                  <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${
                    step >= stepNumber ? 'bg-brand-500 text-ink-900' : 'bg-white/10 text-white'
                  } font-bold text-sm`}>
                    {stepNumber}
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-base font-medium ${
                      step >= stepNumber ? 'text-white' : 'text-blue-200'
                    }`}>
                      {stepNumber === 1 ? 'Account Type' : 
                       stepNumber === 2 ? (accountType === 'company' ? 'Company Details' : 'Personal Info') : 
                       'Credentials'}
                    </h3>
                    <p className="text-xs text-blue-100">
                      {stepNumber === 1 ? 'Select account type' : 
                       stepNumber === 2 ? (accountType === 'company' ? 'Enter company information' : 'Enter personal details') : 
                       'Set up login details'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full md:w-2/3 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-6 md:p-8">
          <Head title="Register" />
          
          {/* Mobile stepper */}
          <div className="md:hidden mb-6">
            <div className="flex justify-between items-center mb-6">
              {step > 1 ? (
                <button onClick={prevStep} className="text-blue-600">
                  <FiChevronLeft className="h-5 w-5" />
                </button>
              ) : <div className="w-5" />}
              
              <div className="flex items-center space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full ${step >= i ? 'bg-blue-600 w-6' : 'bg-gray-200 w-2'}`}
                  />
                ))}
              </div>
              
              <div className="w-5" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
              {step === 1 ? 'Select Account Type' : 
               step === 2 ? (accountType === 'company' ? 'Company Information' : 'Personal Information') : 
               'Create Account'}
            </h2>
          </div>

          {/* Step 1: Account Type Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => handleAccountTypeSelect('company')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    accountType === 'company' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-full mr-3">
                      <FiBriefcase className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">Company Account</h4>
                      <p className="text-sm text-gray-600">For organizations and businesses</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleAccountTypeSelect('personal')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    accountType === 'personal' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-full mr-3">
                      <FiUser className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">Personal Account</h4>
                      <p className="text-sm text-gray-600">For individual users</p>
                    </div>
                  </div>
                </button>
              </div>
              {errors.account_type && (
                <p className="text-sm text-red-600 mt-2">{errors.account_type}</p>
              )}
              
              <div className="text-sm text-center mt-6 pt-4 border-t border-gray-100">
                <span className="text-gray-600">Already have an account? </span>
                <Link 
                  href="/login-view" 
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in
                </Link>
              </div>
            </div>
          )}
          
          {/* Step 2: Account Details */}
          {step === 2 && (
            <form className="space-y-4">
              {/* Back Button */}
              {/* <div className="flex justify-start">
                <button
                  type="button"
                  onClick={() => setStep(1)}  // Go back to step 1
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiChevronLeft className="h-4 w-4 mr-1" />
                  Back to Account Type
                </button>
              </div> */}

              {/* Name/Company Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.account_type === 'company' ? 'Company Name *' : 'Full Name *'}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              {/* Email/Company Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.account_type === 'company' ? 'Company Email *' : 'Email *'}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              {/* Phone/Contact Number Field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.account_type === 'company' ? 'Contact Number *' : 'Phone Number *'}
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
              </div>

              {/* Address Field */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
              </div>

              {/* Continue button */}
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}  // Alternative back button at bottom
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Continue
                </button>
              </div>
            </form>
          )}
          
          {/* Step 3: Account Credentials */}
          {step === 3 && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  />
                </div>
                {errors.password ? (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum 8 characters with at least one number and special character
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="password_confirmation"
                    name="password_confirmation"
                    type="password"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.password_confirmation ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  />
                </div>
                {errors.password_confirmation && (
                  <p className="mt-1 text-xs text-red-600">{errors.password_confirmation}</p>
                )}
              </div>
              
              <div className="flex items-start pt-2">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={formData.terms}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    I agree to the <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-500">Terms of Service</Link> and <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-500">Privacy Policy</Link>
                  </label>
                  {errors.terms && (
                    <p className="mt-1 text-xs text-red-600">{errors.terms}</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isLoading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </>
                  ) : 'Create Account'}
                </button>
              </div>
              
              <div className="text-sm text-center pt-4 border-t border-gray-100">
                <span className="text-gray-600">Already have an account? </span>
                <Link 
                  href="/login-view"  // Make sure this matches your GET route
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;