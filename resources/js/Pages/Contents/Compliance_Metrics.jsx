import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Pages/Admin/Layout';

const ComplianceMetrics = ({ title, metrics, auth }) => {
  const { flash } = usePage().props || {};
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form for creating new metrics
  const { data, setData, post, processing, errors } = useForm({
    company_id: auth?.user?.company_id || '',
    title: '',
    description: '',
    percent: 0
  });

  // Form for editing metrics
  const { data: editData, setData: setEditData, put: putUpdate, processing: updateProcessing, errors: updateErrors, reset: resetEdit } = useForm({
    id: null,
    title: '',
    description: '',
    percent: 0
  });

  const { delete: destroy, processing: deleteProcessing } = useForm();

  const handleAddNew = () => {
    setIsAdding(true);
    setData({
      company_id: auth?.user?.company_id || '',
      title: '',
      description: '',
      percent: 0
    });
  };

  const handleSaveNew = () => {
    post(route('compliance-metrics.store'), {
      onSuccess: () => {
        setIsAdding(false);
        setData({
          company_id: auth?.user?.company_id || '',
          title: '',
          description: '',
          percent: 0
        });
      },
      onError: (errors) => {
        console.error('Error saving metric:', errors);
      }
    });
  };

  const handleCancelNew = () => {
    setIsAdding(false);
    setData({
      company_id: auth?.user?.company_id || '',
      title: '',
      description: '',
      percent: 0
    });
  };

  const handleEdit = (metric) => {
    setEditingId(metric.id);
    setEditData({
      id: metric.id,
      title: metric.title || '',
      description: metric.description || '',
      percent: metric.percent || 0
    });
  };

  const handleSaveEdit = () => {
    putUpdate(route('compliance-metrics.update', editData.id), {
      onSuccess: () => {
        setEditingId(null);
        resetEdit();
      },
      onError: (errors) => {
        console.error('Error updating metric:', errors);
      }
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetEdit();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this metric?')) {
      destroy(route('compliance-metrics.destroy', id), {
        onSuccess: () => {
          console.log('Metric deleted successfully');
        },
        onError: (errors) => {
          console.error('Error deleting metric:', errors);
        }
      });
    }
  };

  const handleInputChange = (field, value) => {
    setData(field, value);
  };

  const handleEditInputChange = (field, value) => {
    setEditData(field, value);
  };

  const handlePercentChange = (value) => {
    const numValue = parseFloat(value) || 0;
    setData('percent', Math.min(Math.max(numValue, 0), 100));
  };

  const handleEditPercentChange = (value) => {
    const numValue = parseFloat(value) || 0;
    setEditData('percent', Math.min(Math.max(numValue, 0), 100));
  };

  const displayMetrics = metrics && metrics.length > 0 ? metrics : [
    {
      id: 1,
      title: "Target Compliance Rate for Safety Passport",
      description: "Assess the compliance rate of the Safety Passport through a sampling check.",
      percent: 0,
    },
    {
      id: 2,
      title: "Target for Overall Compliance Level 'GOOD'",
      description: "Evaluate the performance for Level 'GOOD' overall compliance.",
      percent: 0,
    },
    {
      id: 3,
      title: "Threshold for Overall Compliance Level 'POOR'",
      description: "Monitor the threshold for Level 'POOR' overall compliance.",
      percent: 0,
    },
    {
      id: 4,
      title: "Minimum Requirement for Best Safety Practices Ranking (BSPR) 'GOLD'",
      description: "BSPR 'GOLD' = Indicates that safety compliance practices meet the highest standards of excellence.",
      percent: 0,
    },
    {
      id: 5,
      title: "Minimum Requirement for Best Safety Practices Ranking (BSPR) 'SILVER'",
      description: "BSPR 'SILVER' = Indicates that safety compliance practices meet average standards",
      percent: 0,
    }
  ];

  return (
    <AppLayout>
      <Head title={title} />
      
      {flash && flash.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 mx-6 mt-6">
          {flash.success}
        </div>
      )}
      {flash && flash.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 mx-6 mt-6">
          {flash.error}
        </div>
      )}
      {metrics && metrics.length === 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Welcome!</strong> You're viewing example compliance metrics. Click "Add New Metric" to create your own custom metrics.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <div className="flex space-x-4">
            <button 
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-800 transition-colors shadow-sm"
              onClick={handleAddNew}
            >
              Add New Metric
            </button>
          </div>
        </div>

        {isAdding && (
          <div className="bg-white rounded-xl shadow shadow-neutral-500 border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Compliance Metric</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metric Title *
                </label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter metric title"
                />
                {errors && errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Percentage *
                </label>
                <input
                  type="number"
                  value={data.percent}
                  onChange={(e) => handlePercentChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0.00"
                />
                {errors && errors.percent && <p className="text-red-500 text-xs mt-1">{errors.percent}</p>}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={data.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter metric description"
              />
              {errors && errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleSaveNew}
                disabled={processing || !data.title || !data.description}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {processing ? 'Saving...' : 'Save Metric'}
              </button>
              <button
                onClick={handleCancelNew}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {editingId && (
          <div className="bg-white rounded-xl shadow shadow-neutral-500 border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Edit Compliance Metric</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metric Title *
                </label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => handleEditInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {updateErrors && updateErrors.title && <p className="text-red-500 text-xs mt-1">{updateErrors.title}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Percentage *
                </label>
                <input
                  type="number"
                  value={editData.percent}
                  onChange={(e) => handleEditPercentChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                  step="0.01"
                />
                {updateErrors && updateErrors.percent && <p className="text-red-500 text-xs mt-1">{updateErrors.percent}</p>}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={editData.description}
                onChange={(e) => handleEditInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              {updateErrors && updateErrors.description && <p className="text-red-500 text-xs mt-1">{updateErrors.description}</p>}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleSaveEdit}
                disabled={updateProcessing || !editData.title || !editData.description}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {updateProcessing ? 'Updating...' : 'Update Metric'}
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-xl shadow shadow-neutral-500 border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance Metrics</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance Evaluations</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percent Setting</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics && metrics.length === 0 && (
                  <tr className="bg-blue-50">
                    <td colSpan="5" className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center text-blue-800 text-sm">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>This is example data. Edit these metrics or add new ones to get started.</span>
                      </div>
                    </td>
                  </tr>
                )}
                
                {displayMetrics.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 font-medium">{item.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.description}</td>
                    <td className="px-16 py-4 whitespace-nowrap text-left">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {typeof item.percent === 'number' ? item.percent.toFixed(2) : parseFloat(item.percent || 0).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        disabled={editingId !== null || updateProcessing || deleteProcessing}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={editingId !== null || updateProcessing || deleteProcessing}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ComplianceMetrics;