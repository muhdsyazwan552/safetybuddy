import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { FiMail, FiLock, FiArrowLeft } from 'react-icons/fi';
import NetBackground from '@/Components/shared/NetBackground';

const Login = () => {
  const { flash = {} } = usePage().props;
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    remember: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    router.post('/login', {
      email: credentials.email,
      password: credentials.password,
      remember: credentials.remember ? 'on' : ''
    }, {
      onError: (errors) => {
        setErrors(errors);
        setCredentials(prev => ({...prev, password: ''}));
        setIsSubmitting(false);
      },
      onSuccess: () => {
        setIsSubmitting(false);
      }
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear errors when typing
    if (errors[name]) {
      setErrors(prev => ({...prev, [name]: undefined}));
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Banner Side with Gradient */}
      <div className="hidden lg:block relative w-1/2 overflow-hidden bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700">
        {/* animated 3D network (Vanta-style) */}
        <NetBackground />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,15,20,0.65)_0%,rgba(11,15,20,0)_60%)]" />

        <div className="relative z-10 h-full flex flex-col justify-center items-center p-12 text-white">
          <Link href="/" className="relative mb-8" aria-label="Safety Buddy home">
            <span className="absolute inset-0 rounded-full bg-brand-500/30 blur-2xl animate-pulse" />
            <img
              src="/images/sbc-logo.png"
              alt="Company Logo"
              className="relative h-28 w-28 rounded-full ring-4 ring-brand-500 shadow-2xl transition hover:scale-105"
            />
          </Link>
          <h2 className="text-3xl font-bold mb-4 text-brand-400">Welcome to Safety Buddy</h2>
          <p className="text-xl mb-3 text-center max-w-md text-gray-200">
            Your comprehensive safety management solution
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-400/80">
            Control · Performance · Report
          </p>
        </div>
      </div>

      {/* Login Form Side */}
      <div className="relative w-full lg:w-1/2 flex items-center justify-center p-8 pt-20 lg:pt-8 bg-white">
        <Link
          href="/"
          className="absolute left-4 top-4 sm:left-6 sm:top-6 inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
        >
          <FiArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="w-full max-w-md">
          <Head title="Login" />
          
          <div className="text-center lg:hidden mb-8">
            <Link href="/" aria-label="Safety Buddy home" className="inline-block">
              <img 
                src="/images/sbc-logo.png"
                alt="Company Logo" 
                className="h-20 w-20 rounded-full mx-auto"
              />
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sign in to your account</h2>

          {flash.success && <div className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{flash.success}</div>}
          
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {errors.general}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={credentials.email}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={credentials.password}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={credentials.remember}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link 
                  href="/forgot-password" 
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link 
              href="/register-view"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
