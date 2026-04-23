import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HealthTracker({ user, language }) {
  const navigate = useNavigate();
  const [records, setRecords] = useState(() => {
    if (user?.name) {
      const saved = localStorage.getItem(`health_records_${user.name}`);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    systolic: '',
    diastolic: '',
    symptoms: '',
    notes: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const text = {
    ne: {
      title: 'स्वास्थ्य ट्र्याकर',
      back: 'फिर्ता',
      addRecord: '➕ नयाँ रेकर्ड',
      weight: 'वजन (किलो)',
      systolic: 'सिस्टोलिक BP (mmHg)',
      diastolic: 'डायस्टोलिक BP (mmHg)',
      symptoms: 'लक्षणहरू',
      notes: 'नोटस्',
      date: 'मिति',
      save: 'बचाउनुहोस्',
      cancel: 'रद्द गर्नुहोस्',
      update: 'अपडेट गर्नुहोस्',
      delete: 'हटाउनुहोस्',
      edit: 'सम्पादन गर्नुहोस्',
      noRecords: 'कुनै रेकर्ड छैन। एक रेकर्ड थप्नुहोस्।',
      recordsTitle: 'तपाईंको स्वास्थ्य रेकर्डहरू',
      deleteConfirm: 'के तपाई यो रेकर्ड हटाउन चाहनुहुन्छ?',
      bpLabel: 'रक्तचाप:',
      weightLabel: 'वजन:',
      symptomsLabel: 'लक्षणहरू:',
      notesLabel: 'नोटस्:'
    },
    en: {
      title: 'Health Tracker',
      back: 'Back',
      addRecord: '➕ Add Record',
      weight: 'Weight (kg)',
      systolic: 'Systolic BP (mmHg)',
      diastolic: 'Diastolic BP (mmHg)',
      symptoms: 'Symptoms',
      notes: 'Notes',
      date: 'Date',
      save: 'Save',
      cancel: 'Cancel',
      update: 'Update',
      delete: 'Delete',
      edit: 'Edit',
      noRecords: 'No records yet. Add one to get started.',
      recordsTitle: 'Your Health Records',
      deleteConfirm: 'Are you sure you want to delete this record?',
      bpLabel: 'Blood Pressure:',
      weightLabel: 'Weight:',
      symptomsLabel: 'Symptoms:',
      notesLabel: 'Notes:'
    }
  };

  const t = text[language];

  // Toast notification handler
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Validation functions
  const validateDate = (date) => {
    if (!date) return language === 'ne' ? 'मिति आवश्यक छ' : 'Date is required';
    const selectedDate = new Date(date);
    const today = new Date();
    if (selectedDate > today) return language === 'ne' ? 'मिति आज भन्दा अगाडि हुनुपर्छ' : 'Date cannot be in the future';
    return '';
  };

  const validateWeight = (weight) => {
    if (!weight) return language === 'ne' ? 'वजन आवश्यक छ' : 'Weight is required';
    const w = parseFloat(weight);
    if (w < 30 || w > 200) return language === 'ne' ? 'वजन ३०-२०० किलो बीच हुनुपर्छ' : 'Weight should be between 30-200 kg';
    return '';
  };

  const validateSystolic = (systolic) => {
    if (!systolic) return language === 'ne' ? 'सिस्टोलिक आवश्यक छ' : 'Systolic is required';
    const s = parseInt(systolic);
    if (s < 70 || s > 180) return language === 'ne' ? 'सिस्टोलिक ७०-१८० बीच हुनुपर्छ' : 'Systolic should be between 70-180';
    return '';
  };

  const validateDiastolic = (diastolic, systolic) => {
    if (!diastolic) return language === 'ne' ? 'डायस्टोलिक आवश्यक छ' : 'Diastolic is required';
    const d = parseInt(diastolic);
    const s = parseInt(systolic);
    if (d < 40 || d > 110) return language === 'ne' ? 'डायस्टोलिक ४०-११० बीच हुनुपर्छ' : 'Diastolic should be between 40-110';
    if (d >= s) return language === 'ne' ? 'डायस्टोलिक सिस्टोलिक भन्दा कम हुनुपर्छ' : 'Diastolic must be less than Systolic';
    return '';
  };

  const validateForm = () => {
    const newErrors = {};
    newErrors.date = validateDate(formData.date);
    newErrors.weight = validateWeight(formData.weight);
    newErrors.systolic = validateSystolic(formData.systolic);
    newErrors.diastolic = validateDiastolic(formData.diastolic, formData.systolic);
    return newErrors;
  };

  const handleBlur = (field) => {
    setTouched({...touched, [field]: true});
    const fieldValidator = {
      date: () => validateDate(formData.date),
      weight: () => validateWeight(formData.weight),
      systolic: () => validateSystolic(formData.systolic),
      diastolic: () => validateDiastolic(formData.diastolic, formData.systolic)
    };
    const fieldError = fieldValidator[field]?.();
    if (fieldError) {
      setErrors({...errors, [field]: fieldError});
    } else {
      setErrors({...errors, [field]: ''});
    }
  };

  // Save records to localStorage
  const saveToLocalStorage = (updatedRecords) => {
    localStorage.setItem(
      `health_records_${user.name}`,
      JSON.stringify(updatedRecords)
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    setErrors(newErrors);
    setTouched({date: true, weight: true, systolic: true, diastolic: true});
    
    // Check if any errors exist
    if (Object.values(newErrors).some(err => err)) return;
    
    setIsSubmitting(true);

    try {
      if (editingId) {
        // Update existing record
        const updatedRecords = records.map(r =>
          r.id === editingId
            ? { ...formData, id: editingId, timestamp: r.timestamp }
            : r
        );
        setRecords(updatedRecords);
        saveToLocalStorage(updatedRecords);
        setEditingId(null);
        showToast(language === 'ne' ? '✅ रेकर्ड अपडेट भयो!' : '✅ Record updated!', 'success');
      } else {
        // Add new record
        const newRecord = {
          id: Date.now(),
          ...formData,
          timestamp: new Date().toLocaleString(language === 'ne' ? 'ne-NP' : 'en-US')
        };
        const updatedRecords = [newRecord, ...records];
        setRecords(updatedRecords);
        saveToLocalStorage(updatedRecords);
        showToast(language === 'ne' ? '✅ नयाँ रेकर्ड सेभ भयो!' : '✅ Record saved!', 'success');
      }

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        weight: '',
        systolic: '',
        diastolic: '',
        symptoms: '',
        notes: ''
      });
      setTouched({});
      setErrors({});
      setShowForm(false);
    } catch (error) {
      showToast(language === 'ne' ? '❌ त्रुटि भयो' : '❌ An error occurred', 'error');
    }
    setIsSubmitting(false);
  };

  const handleEdit = (record) => {
    setFormData({
      date: record.date,
      weight: record.weight,
      systolic: record.systolic,
      diastolic: record.diastolic,
      symptoms: record.symptoms,
      notes: record.notes
    });
    setEditingId(record.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm(t.deleteConfirm)) {
      const updatedRecords = records.filter(r => r.id !== id);
      setRecords(updatedRecords);
      saveToLocalStorage(updatedRecords);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      weight: '',
      systolic: '',
      diastolic: '',
      symptoms: '',
      notes: ''
    });
    setTouched({});
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-semibold animate-slide-in ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="text-slate-600 hover:text-slate-900 font-medium text-sm transition"
          >
            Back
          </button>
          <h1 className="text-xl font-semibold text-slate-900">{t.title}</h1>
          <div style={{ width: '40px' }}></div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto w-full px-6 py-8">
        <button 
          onClick={() => setShowForm(!showForm)}
          className="mb-8 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition shadow-sm hover:shadow-md"
        >
          {showForm ? t.cancel : t.addRecord}
        </button>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.date} <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('date')}
                  className={`w-full px-4 py-2 border-2 rounded-lg outline-none transition ${
                    touched.date && errors.date ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  }`}
                />
                {touched.date && errors.date && <p className="text-red-500 text-xs mt-1">❌ {errors.date}</p>}
                {touched.date && !errors.date && <p className="text-green-500 text-xs mt-1">✅ {language === 'ne' ? 'ठीक छ' : 'Valid'}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">⚖️ {t.weight} <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="weight"
                  placeholder="65.5"
                  step="0.1"
                  value={formData.weight}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('weight')}
                  className={`w-full px-4 py-2 border-2 rounded-lg outline-none transition ${
                    touched.weight && errors.weight ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  }`}
                />
                {touched.weight && errors.weight && <p className="text-red-500 text-xs mt-1">❌ {errors.weight}</p>}
                {touched.weight && !errors.weight && <p className="text-green-500 text-xs mt-1">✅ {language === 'ne' ? 'ठीक छ' : 'Valid'}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">💓 {t.systolic} <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="systolic"
                  placeholder="120"
                  value={formData.systolic}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('systolic')}
                  className={`w-full px-4 py-2 border-2 rounded-lg outline-none transition ${
                    touched.systolic && errors.systolic ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  }`}
                />
                {touched.systolic && errors.systolic && <p className="text-red-500 text-xs mt-1">❌ {errors.systolic}</p>}
                {touched.systolic && !errors.systolic && <p className="text-green-500 text-xs mt-1">✅ {language === 'ne' ? 'ठीक छ' : 'Valid'}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">💓 {t.diastolic} <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="diastolic"
                  placeholder="80"
                  value={formData.diastolic}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('diastolic')}
                  className={`w-full px-4 py-2 border-2 rounded-lg outline-none transition ${
                    touched.diastolic && errors.diastolic ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  }`}
                />
                {touched.diastolic && errors.diastolic && <p className="text-red-500 text-xs mt-1">❌ {errors.diastolic}</p>}
                {touched.diastolic && !errors.diastolic && <p className="text-green-500 text-xs mt-1">✅ {language === 'ne' ? 'ठीक छ' : 'Valid'}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.symptoms}</label>
              <textarea
                name="symptoms"
                placeholder={language === 'ne' ? 'उदा: सिरदर्द, दर्द...' : 'E.g., headache, pain...'}
                value={formData.symptoms}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.notes}</label>
              <textarea
                name="notes"
                placeholder={language === 'ne' ? 'अतिरिक्त नोटस्...' : 'Additional notes...'}
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
              />
            </div>

            <div className="flex gap-4">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 py-2 bg-linear-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {language === 'ne' ? 'प्रक्रियामा...' : 'Processing...'}
                  </>
                ) : (
                  <>{editingId ? t.update : t.save} ✅</>
                )}
              </button>
              <button 
                type="button" 
                onClick={handleCancel} 
                disabled={isSubmitting}
                className="flex-1 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.cancel}
              </button>
            </div>
          </form>
        )}

        {/* Records List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t.recordsTitle}</h2>
          {records.length === 0 ? (
            <p className="text-gray-500 text-center py-12">{t.noRecords}</p>
          ) : (
            <div className="space-y-4">
              {records.map(record => (
                <div key={record.id} className="bg-white rounded-lg shadow-md border-l-4 border-blue-500 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-sm font-semibold text-blue-600">📅 {record.date}</span>
                      <span className="ml-4 text-sm font-semibold text-blue-600">🕐 {record.timestamp.split(', ')[1]}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3 py-2 border-y border-gray-200">
                    <div>
                      <span className="text-xs font-semibold text-gray-600">{t.weightLabel}</span>
                      <p className="text-lg font-bold text-gray-800">{record.weight} kg</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-600">{t.bpLabel}</span>
                      <p className="text-lg font-bold text-gray-800">{record.systolic}/{record.diastolic} mmHg</p>
                    </div>
                  </div>

                  {record.symptoms && (
                    <div className="mb-2">
                      <strong className="text-xs text-gray-600">{t.symptomsLabel}</strong>
                      <p className="text-sm text-gray-700">{record.symptoms}</p>
                    </div>
                  )}

                  {record.notes && (
                    <div className="mb-3">
                      <strong className="text-xs text-gray-600">{t.notesLabel}</strong>
                      <p className="text-sm text-gray-700">{record.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(record)}
                      className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all"
                    >
                      {t.edit}
                    </button>
                    <button 
                      onClick={() => handleDelete(record.id)}
                      className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all"
                    >
                      {t.delete}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}