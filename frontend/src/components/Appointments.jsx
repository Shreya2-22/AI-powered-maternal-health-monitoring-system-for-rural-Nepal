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
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

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
      noPast: 'कुनै गएको नियुक्ति छैन',
      errors: {
        dateRequired: 'मिति आवश्यक छ',
        dateFuture: 'मिति भविष्यमा हुनु पर्छ',
        dateMax: 'मिति ६ महिना भित्र हुनु पर्छ',
        timeRequired: 'समय आवश्यक छ',
        timeValid: 'समय सकाल ७ बजे र साँझ ७ बजे बीच हुनु पर्छ',
        doctorRequired: 'डाक्टरको नाम आवश्यक छ',
        doctorLength: 'डाक्टरको नाम कम्तिमा २ वर्ण हुनु पर्छ',
        clinicRequired: 'क्लिनिक/अस्पताल आवश्यक छ',
        clinicLength: 'क्लिनिक नाम कम्तिमा २ वर्ण हुनु पर्छ'
      },
      success: {
        created: 'नियुक्ति सफलतापूर्वक बनाइयो',
        updated: 'नियुक्ति सफलतापूर्वक अपडेट गरियो',
        deleted: 'नियुक्ति सफलतापूर्वक हटाइयो'
      },
      error: {
        failed: 'नियुक्ति प्रक्रिया विफल भयो। कृपया पुनः प्रयास गर्नुहोस्'
      }
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
      noPast: 'No past appointments',
      errors: {
        dateRequired: 'Date is required',
        dateFuture: 'Date must be in the future',
        dateMax: 'Date must be within 6 months',
        timeRequired: 'Time is required',
        timeValid: 'Time must be between 7 AM and 7 PM',
        doctorRequired: 'Doctor\'s name is required',
        doctorLength: 'Doctor\'s name must be at least 2 characters',
        clinicRequired: 'Clinic/Hospital is required',
        clinicLength: 'Clinic name must be at least 2 characters'
      },
      success: {
        created: 'Appointment created successfully',
        updated: 'Appointment updated successfully',
        deleted: 'Appointment deleted successfully'
      },
      error: {
        failed: 'Appointment process failed. Please try again'
      }
    }
  };

  const t = text[language];

  // Validation functions
  const validateDate = (date) => {
    if (!date) return t.errors.dateRequired;
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate <= today) return t.errors.dateFuture;
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);
    if (selectedDate > maxDate) return t.errors.dateMax;
    return '';
  };

  const validateTime = (time) => {
    if (!time) return t.errors.timeRequired;
    const [hours] = time.split(':').map(Number);
    if (hours < 7 || hours >= 19) return t.errors.timeValid;
    return '';
  };

  const validateDoctorName = (name) => {
    if (!name.trim()) return t.errors.doctorRequired;
    if (name.trim().length < 2) return t.errors.doctorLength;
    return '';
  };

  const validateClinic = (clinic) => {
    if (!clinic.trim()) return t.errors.clinicRequired;
    if (clinic.trim().length < 2) return t.errors.clinicLength;
    return '';
  };

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // localStorage Functions (Works offline without backend)
  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const saved = localStorage.getItem(`appointments_${user.name}`);
      if (saved) {
        setAppointments(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToLocalStorage = (appointmentsList) => {
    localStorage.setItem(`appointments_${user.name}`, JSON.stringify(appointmentsList));
  };

  const saveAppointment = async (appointmentData) => {
    try {
      const saved = localStorage.getItem(`appointments_${user.name}`);
      let appointmentsList = saved ? JSON.parse(saved) : [];
      
      if (editingId) {
        // Update existing
        const index = appointmentsList.findIndex(a => a.id === editingId);
        if (index >= 0) {
          appointmentsList[index] = {
            ...appointmentsList[index],
            ...appointmentData,
            updated_at: new Date().toISOString()
          };
        }
      } else {
        // Create new
        const newAppointment = {
          id: `apt_${Date.now()}`,
          ...appointmentData,
          user_name: user.name,
          created_at: new Date().toISOString()
        };
        appointmentsList.push(newAppointment);
      }
      
      saveToLocalStorage(appointmentsList);
      showToast(
        editingId ? t.success.updated : t.success.created,
        'success'
      );
      await fetchAppointments();
      return true;
    } catch (error) {
      console.error('Error saving appointment:', error);
      showToast(t.error.failed, 'error');
      return false;
    }
  };

  const deleteAppointment = async (appointmentId) => {
    if (!window.confirm(t.deleteConfirm)) return;
    
    setDeleteLoading(appointmentId);
    try {
      const saved = localStorage.getItem(`appointments_${user.name}`);
      if (saved) {
        let appointmentsList = JSON.parse(saved);
        appointmentsList = appointmentsList.filter(a => a.id !== appointmentId);
        saveToLocalStorage(appointmentsList);
      }
      
      showToast(t.success.deleted, 'success');
      await fetchAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      showToast(t.error.failed, 'error');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Load appointments on component mount
  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.name]);

  // Handle input change with validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user changes the field
    if (touched[name]) {
      let error = '';
      if (name === 'date') error = validateDate(value);
      else if (name === 'time') error = validateTime(value);
      else if (name === 'doctorName') error = validateDoctorName(value);
      else if (name === 'clinic') error = validateClinic(value);
      
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Handle field blur for validation
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    let error = '';
    if (name === 'date') error = validateDate(formData.date);
    else if (name === 'time') error = validateTime(formData.time);
    else if (name === 'doctorName') error = validateDoctorName(formData.doctorName);
    else if (name === 'clinic') error = validateClinic(formData.clinic);
    
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {
      date: validateDate(formData.date),
      time: validateTime(formData.time),
      doctorName: validateDoctorName(formData.doctorName),
      clinic: validateClinic(formData.clinic)
    };

    setErrors(newErrors);
    setTouched({ date: true, time: true, doctorName: true, clinic: true });

    // Check if there are any errors
    if (Object.values(newErrors).some(error => error)) return;

    setIsSubmitting(true);
    const success = await saveAppointment({
      date: formData.date,
      time: formData.time,
      doctor_name: formData.doctorName,
      clinic: formData.clinic,
      reason: formData.reason
    });

    if (success) {
      setFormData({ date: '', time: '', doctorName: '', clinic: '', reason: '' });
      setErrors({});
      setTouched({});
      setEditingId(null);
      setShowForm(false);
    }
    setIsSubmitting(false);
  };

  // Handle edit
  const handleEdit = (appointment) => {
    setFormData({
      date: appointment.date,
      time: appointment.time,
      doctorName: appointment.doctor_name || appointment.doctorName,
      clinic: appointment.clinic,
      reason: appointment.reason || ''
    });
    setEditingId(appointment.id);
    setShowForm(true);
    setErrors({});
    setTouched({});
  };

  // Reset form
  const resetForm = () => {
    setFormData({ date: '', time: '', doctorName: '', clinic: '', reason: '' });
    setErrors({});
    setTouched({});
    setEditingId(null);
    setShowForm(false);
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
      {/* Header */}
      <div className="bg-linear-to-r from-purple-600 to-pink-500 text-white p-4 shadow-lg">
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

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-semibold shadow-lg animate-slide-in ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-4xl mx-auto w-full p-6">
        {/* Add Appointment Button */}
        <button 
          onClick={() => setShowForm(!showForm)}
          disabled={isLoading}
          className="mb-6 px-6 py-3 bg-linear-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
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
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 outline-none transition ${
                    touched.date && errors.date
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'
                  }`}
                />
                {touched.date && errors.date && (
                  <p className="text-red-500 text-sm mt-1">{errors.date}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.time}</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 outline-none transition ${
                    touched.time && errors.time
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'
                  }`}
                />
                {touched.time && errors.time && (
                  <p className="text-red-500 text-sm mt-1">{errors.time}</p>
                )}
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
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 outline-none transition ${
                  touched.doctorName && errors.doctorName
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'
                }`}
              />
              {touched.doctorName && errors.doctorName && (
                <p className="text-red-500 text-sm mt-1">{errors.doctorName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.clinic}</label>
              <input
                type="text"
                name="clinic"
                placeholder={language === 'ne' ? 'क्लिनिक/अस्पताल' : 'Enter clinic/hospital name'}
                value={formData.clinic}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 outline-none transition ${
                  touched.clinic && errors.clinic
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'
                }`}
              />
              {touched.clinic && errors.clinic && (
                <p className="text-red-500 text-sm mt-1">{errors.clinic}</p>
              )}
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
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 py-2 bg-linear-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {editingId ? t.update : t.save}
              </button>
              <button 
                type="button" 
                onClick={resetForm}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                {t.cancel}
              </button>
            </div>
          </form>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Appointments List */}
        {!isLoading && appointments.length === 0 ? (
          <p className="text-gray-500 text-center py-12">{t.noAppointments}</p>
        ) : !isLoading && (
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
                          <p className="text-gray-800">{appointment.doctor_name}</p>
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
                          onClick={() => deleteAppointment(appointment.id)}
                          disabled={deleteLoading === appointment.id}
                          className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {deleteLoading === appointment.id && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
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
                          <p className="text-gray-700">{appointment.doctor_name}</p>
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
                        onClick={() => deleteAppointment(appointment.id)}
                        disabled={deleteLoading === appointment.id}
                        className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {deleteLoading === appointment.id && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
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