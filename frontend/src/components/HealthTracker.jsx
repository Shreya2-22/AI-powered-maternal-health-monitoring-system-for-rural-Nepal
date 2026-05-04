import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
 
import { API } from '../constants';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
 
const isMongoId = (value) => /^[a-f0-9]{24}$/i.test(String(value || ''));
 
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
    blood_sugar: '',
    haemoglobin: '',
    prev_complications: false,
    symptoms: '',
    notes: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
 
  const text = {
    ne: {
      title: 'स्वास्थ्य ट्र्याकर',
      back: 'फिर्ता',
      addRecord: 'नयाँ रेकर्ड',
      weight: 'वजन (किलो)',
      systolic: 'सिस्टोलिक BP (mmHg)',
      diastolic: 'डायस्टोलिक BP (mmHg)',
      blood_sugar: 'रक्त शर्करा (mmol/L)',
      haemoglobin: 'हेमोग्लोबिन (g/dL)',
      prev_complications: 'पहिले गर्भावस्था जटिलताहरू',
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
      addRecord: 'Add Record',
      weight: 'Weight (kg)',
      systolic: 'Systolic BP (mmHg)',
      diastolic: 'Diastolic BP (mmHg)',
      blood_sugar: 'Blood Sugar (mmol/L)',
      haemoglobin: 'Haemoglobin (g/dL)',
      prev_complications: 'Previous Pregnancy Complications',
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

  const normalizeRecord = (record) => ({
    ...record,
    id: record.id || record._id,
    weight: Number(record.weight),
    systolic: Number(record.systolic),
    diastolic: Number(record.diastolic),
    blood_sugar: record.blood_sugar ? Number(record.blood_sugar) : undefined,
    haemoglobin: record.haemoglobin ? Number(record.haemoglobin) : undefined,
    prev_complications: Boolean(record.prev_complications),
    // Ensure timestamp exists for display — DB records use created_at
    timestamp: record.timestamp || (record.created_at
      ? new Date(record.created_at).toLocaleString(language === 'ne' ? 'ne-NP' : 'en-US')
      : new Date().toLocaleString()),
  });
 
  const getLocalRecords = () => {
    if (!user?.name) return [];
    const saved = localStorage.getItem(`health_records_${user.name}`);
    return saved ? JSON.parse(saved) : [];
  };
 
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
 
  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const localRecords = getLocalRecords();
      let remoteRecords = [];
 
      if (user?.id) {
        try {
          const response = await fetch(`${API}/health-records/${user.id}`);
          if (response.ok) {
            remoteRecords = await response.json();
          }
        } catch {
          remoteRecords = [];
        }
      }
 
      const merged = new Map();
      [...remoteRecords, ...localRecords].forEach((record) => {
        const normalized = normalizeRecord(record);
        merged.set(String(normalized.id), normalized);
      });
 
      const mergedRecords = Array.from(merged.values());
      setRecords(mergedRecords);
      if (mergedRecords.length > 0) {
        saveToLocalStorage(mergedRecords);
      }
    } catch (error) {
      console.error('Error fetching health records:', error);
    } finally {
      setIsLoading(false);
    }
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
      const payload = {
        user_id: user?.id || user?.name,
        date: formData.date,
        weight: parseFloat(formData.weight),
        systolic: parseInt(formData.systolic, 10),
        diastolic: parseInt(formData.diastolic, 10),
        symptoms: formData.symptoms,
        notes: formData.notes,
      };
 
      let updatedRecords = records;
 
      if (editingId) {
        const normalizedId = String(editingId);
 
        if (isMongoId(normalizedId)) {
          try {
            const response = await fetch(`${API}/health-records/${normalizedId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
 
            if (!response.ok) {
              throw new Error('Failed to update remote health record');
            }
 
            const updatedRemoteRecord = normalizeRecord(await response.json());
            updatedRecords = records.map((record) =>
              String(record.id) === normalizedId ? updatedRemoteRecord : record
            );
          } catch {
            updatedRecords = records.map((record) =>
              String(record.id) === normalizedId
                ? { ...record, ...formData, id: editingId, timestamp: record.timestamp }
                : record
            );
          }
        } else {
          updatedRecords = records.map((record) =>
            String(record.id) === normalizedId
              ? { ...record, ...formData, id: editingId, timestamp: record.timestamp }
              : record
          );
        }
 
        setEditingId(null);
        showToast(language === 'ne' ? '✅ रेकर्ड अपडेट भयो!' : '✅ Record updated!', 'success');
      } else {
        try {
          const response = await fetch(`${API}/health-records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
 
          if (!response.ok) {
            throw new Error('Failed to save remote health record');
          }
 
          const createdRecord = normalizeRecord(await response.json());
          updatedRecords = [createdRecord, ...records];
        } catch {
          const newRecord = {
            id: `local_${Date.now()}`,
            ...formData,
            timestamp: new Date().toLocaleString(language === 'ne' ? 'ne-NP' : 'en-US')
          };
          updatedRecords = [newRecord, ...records];
        }
 
        showToast(language === 'ne' ? '✅ नयाँ रेकर्ड सेभ भयो!' : '✅ Record saved!', 'success');
      }
 
      setRecords(updatedRecords);
      saveToLocalStorage(updatedRecords);
 
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        weight: '',
        systolic: '',
        diastolic: '',
        blood_sugar: '',
        haemoglobin: '',
        prev_complications: false,
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
      blood_sugar: record.blood_sugar || '',
      haemoglobin: record.haemoglobin || '',
      prev_complications: Boolean(record.prev_complications),
      symptoms: record.symptoms,
      notes: record.notes
    });
    setEditingId(record.id);
    setShowForm(true);
  };

  // Scroll to the form whenever edit mode is activated and the form is mounted.
  // Using useEffect (instead of setTimeout) guarantees the form's DOM node
  // already exists — avoiding races when `showForm` flips from false to true.
  useEffect(() => {
    if (editingId && showForm && formRef.current) {
      requestAnimationFrame(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [editingId, showForm]);
 
  const handleDelete = async (id) => {
    if (window.confirm(t.deleteConfirm)) {
      const updatedRecords = records.filter((record) => String(record.id) !== String(id));
 
      if (isMongoId(id)) {
        try {
          const response = await fetch(`${API}/health-records/${id}`, {
            method: 'DELETE',
          });
 
          if (!response.ok) {
            throw new Error('Failed to delete remote health record');
          }
        } catch (error) {
          console.error('Error deleting health record:', error);
        }
      }
 
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
      blood_sugar: '',
      haemoglobin: '',
      prev_complications: false,
      symptoms: '',
      notes: ''
    });
    setTouched({});
    setErrors({});
  };
 
  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.name]);
 
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
      <header className="bg-linear-to-r from-teal-600 to-teal-700 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-teal-500 rounded-lg transition text-white"
              title="Go back"
            >
              <span className="text-xl">←</span>
            </button>
            <h1 className="text-3xl font-bold text-white">{t.title}</h1>
          </div>
        </div>
      </header>
 
      <div className="max-w-7xl mx-auto w-full px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Track Your Health</h2>
            <p className="text-gray-600 text-sm mt-1">Monitor weight and blood pressure regularly</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-lg transition shadow-sm hover:shadow-md leading-normal"
          >
            {showForm ? '✕ Cancel' : '+ Add Record'}
          </button>
        </div>
 
        {/* Form */}
        {showForm && (
          <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md border border-gray-200 p-8 mb-10">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Record New Health Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.date} <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('date')}
                  className={`w-full px-4 py-2.5 border-2 rounded-lg outline-none transition text-sm ${
                    touched.date && errors.date ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200'
                  }`}
                />
                {touched.date && errors.date && <p className="text-red-500 text-xs mt-1">❌ {errors.date}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.weight} <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="weight"
                  placeholder="65.5"
                  step="0.1"
                  value={formData.weight}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('weight')}
                  className={`w-full px-4 py-2.5 border-2 rounded-lg outline-none transition text-sm ${
                    touched.weight && errors.weight ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200'
                  }`}
                />
                {touched.weight && errors.weight && <p className="text-red-500 text-xs mt-1">Error: {errors.weight}</p>}
              </div>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.systolic} <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="systolic"
                  placeholder="120"
                  value={formData.systolic}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('systolic')}
                  className={`w-full px-4 py-2.5 border-2 rounded-lg outline-none transition text-sm ${
                    touched.systolic && errors.systolic ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200'
                  }`}
                />
                {touched.systolic && errors.systolic && <p className="text-red-500 text-xs mt-1">Error: {errors.systolic}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.diastolic} <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="diastolic"
                  placeholder="80"
                  value={formData.diastolic}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('diastolic')}
                  className={`w-full px-4 py-2.5 border-2 rounded-lg outline-none transition text-sm ${
                    touched.diastolic && errors.diastolic ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200'
                  }`}
                />
                {touched.diastolic && errors.diastolic && <p className="text-red-500 text-xs mt-1">Error: {errors.diastolic}</p>}
              </div>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.blood_sugar}</label>
                <input
                  type="number"
                  name="blood_sugar"
                  placeholder="4.9"
                  step="0.1"
                  min="0"
                  value={formData.blood_sugar}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">{language === 'ne' ? 'सामान्य: ≤५.५' : 'Normal: ≤5.5'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.haemoglobin}</label>
                <input
                  type="number"
                  name="haemoglobin"
                  placeholder="11.2"
                  step="0.1"
                  min="0"
                  value={formData.haemoglobin}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">{language === 'ne' ? 'सामान्य: ≥११' : 'Normal: ≥11'}</p>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="prev_complications"
                    checked={formData.prev_complications}
                    onChange={(e) => setFormData({...formData, prev_complications: e.target.checked})}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-2 focus:ring-teal-200"
                  />
                  <span className="text-sm font-semibold text-gray-700">{t.prev_complications}</span>
                </label>
              </div>
            </div>
 
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.symptoms}</label>
              <textarea
                name="symptoms"
                placeholder={language === 'ne' ? 'उदा: सिरदर्द, दर्द...' : 'E.g., headache, pain...'}
                value={formData.symptoms}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition text-sm"
              />
            </div>
 
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.notes}</label>
              <textarea
                name="notes"
                placeholder={language === 'ne' ? 'अतिरिक्त नोटस्...' : 'Additional notes...'}
                value={formData.notes}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition text-sm"
              />
            </div>
 
            <div className="flex gap-3 mt-8 justify-end">
              <button 
                type="button" 
                onClick={handleCancel} 
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold text-sm rounded-lg transition disabled:opacity-50 leading-normal"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-lg transition disabled:opacity-50 leading-normal"
              >
                {isSubmitting ? (
                  <>{language === 'ne' ? 'प्रक्रियामा...' : 'Processing...'}</>
                ) : (
                  <>{editingId ? t.update : t.save}</>
                )}
              </button>
            </div>
          </form>
        )}
 
 
        {/* ── Trend Charts ──────────────────────────────────────────── */}
        {records.length >= 2 && (
          <div className="mb-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {language === 'ne' ? 'स्वास्थ्य प्रवृत्ति' : 'Health Trends'}
            </h2>
 
            {/* Weight chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <p className="text-sm font-semibold text-slate-700 mb-4">
                {language === 'ne' ? '⚖️ वजन प्रवृत्ति (किलो)' : '⚖️ Weight Trend (kg)'}
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={[...records].reverse().map(r => ({
                  date: r.date ? r.date.slice(5) : '—',
                  weight: Number(r.weight),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false}/>
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={['auto','auto']}/>
                  <Tooltip contentStyle={{ borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'12px' }}/>
                  <Line type="monotone" dataKey="weight" stroke="#0F766E" strokeWidth={2.5} dot={{ r:4, fill:'#0F766E' }} activeDot={{ r:6 }}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
 
            {/* Blood pressure chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <p className="text-sm font-semibold text-slate-700 mb-4">
                {language === 'ne' ? '🩺 रक्तचाप प्रवृत्ति (mmHg)' : '🩺 Blood Pressure Trend (mmHg)'}
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={[...records].reverse().map(r => ({
                  date: r.date ? r.date.slice(5) : '—',
                  systolic:  Number(r.systolic),
                  diastolic: Number(r.diastolic),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="date" tick={{ fontSize:11, fill:'#94a3b8' }} tickLine={false}/>
                  <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} tickLine={false} axisLine={false} domain={['auto','auto']}/>
                  <Tooltip contentStyle={{ borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'12px' }}/>
                  <Line type="monotone" dataKey="systolic"  stroke="#ef4444" strokeWidth={2.5} dot={{ r:4, fill:'#ef4444' }} name="Systolic"/>
                  <Line type="monotone" dataKey="diastolic" stroke="#f97316" strokeWidth={2} strokeDasharray="4 2" dot={{ r:3, fill:'#f97316' }} name="Diastolic"/>
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="inline-block w-4 h-0.5 bg-red-500 rounded"/>{language === 'ne' ? 'सिस्टोलिक' : 'Systolic'}</span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="inline-block w-4 h-0.5 bg-orange-400 rounded"/>{language === 'ne' ? 'डायस्टोलिक' : 'Diastolic'}</span>
              </div>
            </div>
          </div>
        )}
 
        {/* Records List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.recordsTitle}</h2>
          {isLoading ? (
            /* Loading Skeleton */
            <div className="space-y-4" aria-busy="true" aria-label="Loading health records">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-5 bg-slate-200 rounded w-32" />
                    <div className="flex gap-2">
                      <div className="h-8 bg-slate-200 rounded w-16" />
                      <div className="h-8 bg-slate-200 rounded w-16" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="h-12 bg-slate-200 rounded" />
                    <div className="h-12 bg-slate-200 rounded" />
                    <div className="h-12 bg-slate-200 rounded" />
                    <div className="h-12 bg-slate-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">{t.noRecords}</p>
              <p className="text-gray-400 text-sm mt-2">Start by adding your first health record</p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map(record => (
                <div key={record.id} className="bg-white rounded-lg shadow-md border-l-4 border-teal-500 p-6 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-sm font-semibold text-teal-600">📅 {record.date}</span>
                      {record.timestamp && <span className="ml-4 text-sm text-gray-500">{record.timestamp.split(', ')[1]}</span>}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(record)}
                        className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-xs rounded-lg transition"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(record.id)}
                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-xs rounded-lg transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
 
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-200">
                    <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                      <p className="text-xs font-semibold text-gray-600 mb-1">{t.weightLabel}</p>
                      <p className="text-2xl font-bold text-gray-900">{record.weight}<span className="text-sm ml-1">kg</span></p>
                    </div>
                    <div className="bg-linear-to-br from-red-50 to-red-100 rounded-lg p-4">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Systolic</p>
                      <p className="text-2xl font-bold text-gray-900">{record.systolic}<span className="text-sm ml-1">mmHg</span></p>
                    </div>
                    <div className="bg-linear-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Diastolic</p>
                      <p className="text-2xl font-bold text-gray-900">{record.diastolic}<span className="text-sm ml-1">mmHg</span></p>
                    </div>
                    <div className="bg-linear-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                      <p className="text-xs font-semibold text-gray-600 mb-1">{t.bpLabel}</p>
                      <p className="text-xl font-bold text-gray-900">{record.systolic}/{record.diastolic}</p>
                    </div>
                  </div>
 
                  {(record.symptoms || record.notes) && (
                    <div className="mt-4 space-y-2">
                      {record.symptoms && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600">{t.symptomsLabel}</p>
                          <p className="text-sm text-gray-700">{record.symptoms}</p>
                        </div>
                      )}
                      {record.notes && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600">{t.notesLabel}</p>
                          <p className="text-sm text-gray-700">{record.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}