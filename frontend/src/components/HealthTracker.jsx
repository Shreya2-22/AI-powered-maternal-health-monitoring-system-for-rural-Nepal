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
    <div className="page-container">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/')}>
          {t.back}
        </button>
        <h1>{t.title}</h1>
        <div style={{ width: '60px' }}></div>
      </div>

      <div className="page-content health-tracker-content">
        {/* Add Record Button */}
        <button 
          className="add-record-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? t.cancel : t.addRecord}
        </button>

        {/* Form */}
        {showForm && (
          <form className="health-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>{t.date}</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.weight}</label>
                <input
                  type="number"
                  name="weight"
                  placeholder="65.5"
                  step="0.1"
                  value={formData.weight}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t.systolic}</label>
                <input
                  type="number"
                  name="systolic"
                  placeholder="120"
                  value={formData.systolic}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.diastolic}</label>
                <input
                  type="number"
                  name="diastolic"
                  placeholder="80"
                  value={formData.diastolic}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>{t.symptoms}</label>
              <textarea
                name="symptoms"
                placeholder={language === 'ne' ? 'उदा: सिरदर्द, दर्द...' : 'E.g., headache, pain...'}
                value={formData.symptoms}
                onChange={handleInputChange}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>{t.notes}</label>
              <textarea
                name="notes"
                placeholder={language === 'ne' ? 'अतिरिक्त नोटस्...' : 'Additional notes...'}
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
              />
            </div>

            <div className="form-buttons">
              <button type="submit" className="form-submit-btn">
                {editingId ? t.update : t.save}
              </button>
              <button type="button" className="form-cancel-btn" onClick={handleCancel}>
                {t.cancel}
              </button>
            </div>
          </form>
        )}

        {/* Records List */}
        <div className="records-section">
          <h2>{t.recordsTitle}</h2>
          {records.length === 0 ? (
            <p className="no-records">{t.noRecords}</p>
          ) : (
            <div className="records-list">
              {records.map(record => (
                <div key={record.id} className="record-card">
                  <div className="record-header">
                    <div className="record-date">📅 {record.date}</div>
                    <div className="record-time">{record.timestamp.split(', ')[1]}</div>
                  </div>

                  <div className="record-details">
                    <div className="detail-item">
                      <span className="detail-label">{t.weightLabel}</span>
                      <span className="detail-value">{record.weight} kg</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">{t.bpLabel}</span>
                      <span className="detail-value">{record.systolic}/{record.diastolic} mmHg</span>
                    </div>
                  </div>

                  {record.symptoms && (
                    <div className="record-section-text">
                      <strong>{t.symptomsLabel}</strong>
                      <p>{record.symptoms}</p>
                    </div>
                  )}

                  {record.notes && (
                    <div className="record-section-text">
                      <strong>{t.notesLabel}</strong>
                      <p>{record.notes}</p>
                    </div>
                  )}

                  <div className="record-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEdit(record)}
                    >
                      {t.edit}
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(record.id)}
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