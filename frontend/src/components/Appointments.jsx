import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Appointments({ user, language }) {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    doctorName: '',
    clinic: '',
    reason: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const text = {
    ne: {
      title: 'नियुक्तिहरू',
      back: '⬅️ फिर्ता',
      addAppointment: '➕ नयाँ नियुक्ति',
      doctorName: 'डाक्टरको नाम',
      clinic: 'क्लिनिक/अस्पताल',
      date: 'मिति',
      time: 'समय',
      reason: 'जाँचको कारण',
      save: 'बचाउनुहोस्',
      cancel: 'रद्द गर्नुहोस्',
      update: 'अपडेट गर्नुहोस्',
      delete: 'हटाउनुहोस्',
      edit: 'सम्पादन गर्नुहोस्',
      noAppointments: 'कुनै नियुक्ति छैन। एक नियुक्ति थप्नुहोस्।',
      upcomingTitle: 'आसन्न नियुक्तिहरू',
      pastTitle: 'गएको नियुक्तिहरू',
      deleteConfirm: 'के तपाई यो नियुक्ति हटाउन चाहनुहुन्छ?',
      upcomingBadge: 'आसन्न',
      completedBadge: 'पूरा भयो',
      doctorLabel: 'डाक्टर:',
      clinicLabel: 'क्लिनिक:',
      reasonLabel: 'कारण:',
      noUpcoming: 'कुनै आसन्न नियुक्ति छैन',
      noPast: 'कुनै गएको नियुक्ति छैन'
    },
    en: {
      title: 'Appointments',
      back: '⬅️ Back',
      addAppointment: '➕ Add Appointment',
      doctorName: 'Doctor\'s Name',
      clinic: 'Clinic/Hospital',
      date: 'Date',
      time: 'Time',
      reason: 'Reason for Checkup',
      save: 'Save',
      cancel: 'Cancel',
      update: 'Update',
      delete: 'Delete',
      edit: 'Edit',
      noAppointments: 'No appointments yet. Schedule one.',
      upcomingTitle: 'Upcoming Appointments',
      pastTitle: 'Past Appointments',
      deleteConfirm: 'Are you sure you want to delete this appointment?',
      upcomingBadge: 'Upcoming',
      completedBadge: 'Completed',
      doctorLabel: 'Doctor:',
      clinicLabel: 'Clinic:',
      reasonLabel: 'Reason:',
      noUpcoming: 'No upcoming appointments',
      noPast: 'No past appointments'
    }
  };

  const t = text[language];

  // Load appointments from localStorage
  useEffect(() => {
    const savedAppointments = localStorage.getItem(`appointments_${user.name}`);
    if (savedAppointments) {
      setAppointments(JSON.parse(savedAppointments));
    }
  }, [user.name]);

  // Save appointments to localStorage
  const saveToLocalStorage = (updatedAppointments) => {
    localStorage.setItem(
      `appointments_${user.name}`,
      JSON.stringify(updatedAppointments)
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
    if (!formData.date || !formData.time || !formData.doctorName || !formData.clinic) {
      alert(language === 'ne' ? 'कृपया सबै आवश्यक क्षेत्रहरू भरनुहोस्।' : 'Please fill all required fields.');
      return;
    }

    if (editingId) {
      // Update existing appointment
      const updatedAppointments = appointments.map(a =>
        a.id === editingId
          ? { ...formData, id: editingId, createdAt: a.createdAt }
          : a
      );
      setAppointments(updatedAppointments);
      saveToLocalStorage(updatedAppointments);
      setEditingId(null);
    } else {
      // Add new appointment
      const newAppointment = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString()
      };
      const updatedAppointments = [newAppointment, ...appointments];
      setAppointments(updatedAppointments);
      saveToLocalStorage(updatedAppointments);
    }

    // Reset form
    setFormData({
      date: '',
      time: '',
      doctorName: '',
      clinic: '',
      reason: ''
    });
    setShowForm(false);
  };

  const handleEdit = (appointment) => {
    setFormData({
      date: appointment.date,
      time: appointment.time,
      doctorName: appointment.doctorName,
      clinic: appointment.clinic,
      reason: appointment.reason
    });
    setEditingId(appointment.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm(t.deleteConfirm)) {
      const updatedAppointments = appointments.filter(a => a.id !== id);
      setAppointments(updatedAppointments);
      saveToLocalStorage(updatedAppointments);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      date: '',
      time: '',
      doctorName: '',
      clinic: '',
      reason: ''
    });
  };

  // Separate upcoming and past appointments
  const now = new Date();
  const upcomingAppointments = appointments.filter(a => {
    const appointmentDateTime = new Date(`${a.date}T${a.time}`);
    return appointmentDateTime > now;
  });

  const pastAppointments = appointments.filter(a => {
    const appointmentDateTime = new Date(`${a.date}T${a.time}`);
    return appointmentDateTime <= now;
  });

  const isUpcoming = (appointment) => {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    return appointmentDateTime > now;
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

      <div className="page-content appointments-content">
        {/* Add Appointment Button */}
        <button 
          className="add-appointment-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? t.cancel : t.addAppointment}
        </button>

        {/* Form */}
        {showForm && (
          <form className="appointment-form" onSubmit={handleSubmit}>
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
                <label>{t.time}</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>{t.doctorName}</label>
              <input
                type="text"
                name="doctorName"
                placeholder={language === 'ne' ? 'डाक्टरको नाम' : 'Enter doctor\'s name'}
                value={formData.doctorName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>{t.clinic}</label>
              <input
                type="text"
                name="clinic"
                placeholder={language === 'ne' ? 'क्लिनिक/अस्पताल' : 'Enter clinic/hospital name'}
                value={formData.clinic}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>{t.reason}</label>
              <textarea
                name="reason"
                placeholder={language === 'ne' ? 'नियमित जाँच, अल्ट्रासाउन्ड, आदि' : 'E.g., regular checkup, ultrasound, etc.'}
                value={formData.reason}
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

        {/* Appointments List */}
        {appointments.length === 0 ? (
          <p className="no-appointments">{t.noAppointments}</p>
        ) : (
          <div className="appointments-sections">
            {/* Upcoming Appointments */}
            <div className="appointments-section">
              <h2>{t.upcomingTitle}</h2>
              {upcomingAppointments.length === 0 ? (
                <p className="no-section-appointments">{t.noUpcoming}</p>
              ) : (
                <div className="appointments-list">
                  {upcomingAppointments.map(appointment => (
                    <div key={appointment.id} className="appointment-card upcoming">
                      <div className="appointment-header">
                        <div className="appointment-datetime">
                          <span className="date">📅 {appointment.date}</span>
                          <span className="time">🕐 {appointment.time}</span>
                        </div>
                        <span className="badge upcoming-badge">{t.upcomingBadge}</span>
                      </div>

                      <div className="appointment-details">
                        <div className="detail-item">
                          <span className="detail-label">{t.doctorLabel}</span>
                          <span className="detail-value">{appointment.doctorName}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">{t.clinicLabel}</span>
                          <span className="detail-value">{appointment.clinic}</span>
                        </div>
                      </div>

                      {appointment.reason && (
                        <div className="appointment-reason">
                          <strong>{t.reasonLabel}</strong>
                          <p>{appointment.reason}</p>
                        </div>
                      )}

                      <div className="appointment-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => handleEdit(appointment)}
                        >
                          {t.edit}
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDelete(appointment.id)}
                        >
                          {t.delete}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Appointments */}
            {pastAppointments.length > 0 && (
              <div className="appointments-section">
                <h2>{t.pastTitle}</h2>
                <div className="appointments-list">
                  {pastAppointments.map(appointment => (
                    <div key={appointment.id} className="appointment-card past">
                      <div className="appointment-header">
                        <div className="appointment-datetime">
                          <span className="date">📅 {appointment.date}</span>
                          <span className="time">🕐 {appointment.time}</span>
                        </div>
                        <span className="badge completed-badge">{t.completedBadge}</span>
                      </div>

                      <div className="appointment-details">
                        <div className="detail-item">
                          <span className="detail-label">{t.doctorLabel}</span>
                          <span className="detail-value">{appointment.doctorName}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">{t.clinicLabel}</span>
                          <span className="detail-value">{appointment.clinic}</span>
                        </div>
                      </div>

                      {appointment.reason && (
                        <div className="appointment-reason">
                          <strong>{t.reasonLabel}</strong>
                          <p>{appointment.reason}</p>
                        </div>
                      )}

                      <div className="appointment-actions">
                        <button 
                          className="delete-btn"
                          onClick={() => handleDelete(appointment.id)}
                        >
                          {t.delete}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}