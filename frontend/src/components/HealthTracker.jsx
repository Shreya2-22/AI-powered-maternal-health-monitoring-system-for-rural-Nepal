import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HealthTracker({ user, language }) {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
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

  const text = {
    ne: {
      title: 'स्वास्थ्य ट्र्याकर',
      back: '⬅️ फिर्ता',
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
      back: '⬅️ Back',
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

  // Load records from localStorage
  useEffect(() => {
    const savedRecords = localStorage.getItem(`health_records_${user.name}`);
    if (savedRecords) {
      setRecords(JSON.parse(savedRecords));
    }
  }, [user.name]);

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

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.date || !formData.weight || !formData.systolic || !formData.diastolic) {
      alert(language === 'ne' ? 'कृपया सबै आवश्यक क्षेत्रहरू भरनुहोस्।' : 'Please fill all required fields.');
      return;
    }

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
    setShowForm(false);
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
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-linear-to-r from-blue-500 to-cyan-500 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => navigate('/')}
            className="bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 font-semibold transition-all"
          >
            {t.back}
          </button>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <div style={{ width: '60px' }}></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full p-6">
        <button 
          onClick={() => setShowForm(!showForm)}
          className="mb-6 px-6 py-3 bg-linear-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
        >
          {showForm ? t.cancel : t.addRecord}
        </button>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.date}</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.weight}</label>
                <input
                  type="number"
                  name="weight"
                  placeholder="65.5"
                  step="0.1"
                  value={formData.weight}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.systolic}</label>
                <input
                  type="number"
                  name="systolic"
                  placeholder="120"
                  value={formData.systolic}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.diastolic}</label>
                <input
                  type="number"
                  name="diastolic"
                  placeholder="80"
                  value={formData.diastolic}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                />
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
              <button type="submit" className="flex-1 py-2 bg-linear-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all">
                {editingId ? t.update : t.save}
              </button>
              <button type="button" onClick={handleCancel} className="flex-1 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-all">
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