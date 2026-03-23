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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-4 shadow-lg">
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
          className="mb-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
        >
          {showForm ? t.cancel : t.addAppointment}
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
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.time}</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.doctorName}</label>
              <input
                type="text"
                name="doctorName"
                placeholder={language === 'ne' ? 'डाक्टरको नाम' : 'Enter doctor\'s name'}
                value={formData.doctorName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.clinic}</label>
              <input
                type="text"
                name="clinic"
                placeholder={language === 'ne' ? 'क्लिनिक/अस्पताल' : 'Enter clinic/hospital name'}
                value={formData.clinic}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.reason}</label>
              <textarea
                name="reason"
                placeholder={language === 'ne' ? 'नियमित जाँच, अल्ट्रासाउन्ड, आदि' : 'E.g., regular checkup, ultrasound, etc.'}
                value={formData.reason}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
              />
            </div>

            <div className="flex gap-4">
              <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all">
                {editingId ? t.update : t.save}
              </button>
              <button type="button" onClick={handleCancel} className="flex-1 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-all">
                {t.cancel}
              </button>
            </div>
          </form>
        )}

        {/* Appointments List */}
        {appointments.length === 0 ? (
          <p className="text-gray-500 text-center py-12">{t.noAppointments}</p>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Appointments */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{t.upcomingTitle}</h2>
              {upcomingAppointments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t.noUpcoming}</p>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map(appointment => (
                    <div key={appointment.id} className="bg-white rounded-lg shadow-md border-l-4 border-blue-500 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-sm font-semibold text-blue-600">📅 {appointment.date}</span>
                          <span className="ml-4 text-sm font-semibold text-blue-600">🕐 {appointment.time}</span>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{t.upcomingBadge}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3 py-2 border-y border-gray-200">
                        <div>
                          <span className="text-xs font-semibold text-gray-600">{t.doctorLabel}</span>
                          <p className="text-gray-800">{appointment.doctorName}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-600">{t.clinicLabel}</span>
                          <p className="text-gray-800">{appointment.clinic}</p>
                        </div>
                      </div>

                      {appointment.reason && (
                        <div className="mb-3">
                          <strong className="text-xs text-gray-600">{t.reasonLabel}</strong>
                          <p className="text-sm text-gray-700">{appointment.reason}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(appointment)}
                          className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all"
                        >
                          {t.edit}
                        </button>
                        <button 
                          onClick={() => handleDelete(appointment.id)}
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

            {/* Past Appointments */}
            {pastAppointments.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{t.pastTitle}</h2>
                <div className="space-y-4">
                  {pastAppointments.map(appointment => (
                    <div key={appointment.id} className="bg-gray-100 rounded-lg shadow-md border-l-4 border-gray-400 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-sm font-semibold text-gray-600">📅 {appointment.date}</span>
                          <span className="ml-4 text-sm font-semibold text-gray-600">🕐 {appointment.time}</span>
                        </div>
                        <span className="px-3 py-1 bg-gray-300 text-gray-700 text-xs font-bold rounded-full">{t.completedBadge}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3 py-2 border-y border-gray-300">
                        <div>
                          <span className="text-xs font-semibold text-gray-600">{t.doctorLabel}</span>
                          <p className="text-gray-700">{appointment.doctorName}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-600">{t.clinicLabel}</span>
                          <p className="text-gray-700">{appointment.clinic}</p>
                        </div>
                      </div>

                      {appointment.reason && (
                        <div className="mb-3">
                          <strong className="text-xs text-gray-600">{t.reasonLabel}</strong>
                          <p className="text-sm text-gray-700">{appointment.reason}</p>
                        </div>
                      )}

                      <button 
                        onClick={() => handleDelete(appointment.id)}
                        className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all"
                      >
                        {t.delete}
                      </button>
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