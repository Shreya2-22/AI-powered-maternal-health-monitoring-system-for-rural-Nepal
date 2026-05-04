import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
 
import { API } from '../constants';
 
const isMongoId = (value) => /^[a-f0-9]{24}$/i.test(String(value || ''));
 
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
  const formRef = useRef(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
 
  const text = {
    ne: {
      title: 'नियुक्तिहरू',
      back: 'फिर्ता',
      addAppointment: 'नयाँ नियुक्ति',
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
      back: 'Back',
      addAppointment: 'Add Appointment',
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

  const normalizeAppointment = (appointment) => ({
    ...appointment,
    id: appointment.id || appointment._id,
    doctor_name: appointment.doctor_name || appointment.doctorName,
  });
 
  const getLocalAppointments = () => {
    if (!user?.name) return [];
    const saved = localStorage.getItem(`appointments_${user.name}`);
    return saved ? JSON.parse(saved) : [];
  };
 
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
      const localAppointments = getLocalAppointments();
      let remoteAppointments = [];
 
      if (user?.id) {
        try {
          const response = await fetch(`${API}/appointments/${user.id}`);
          if (response.ok) {
            remoteAppointments = await response.json();
          }
        } catch {
          remoteAppointments = [];
        }
      }
 
      const merged = new Map();
      [...remoteAppointments, ...localAppointments].forEach((appointment) => {
        const normalized = normalizeAppointment(appointment);
        merged.set(String(normalized.id), normalized);
      });
 
      const mergedAppointments = Array.from(merged.values());
      setAppointments(mergedAppointments);
 
      if (mergedAppointments.length > 0) {
        localStorage.setItem(`appointments_${user.name}`, JSON.stringify(mergedAppointments));
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
      const appointmentsList = getLocalAppointments();
      let updatedAppointments = appointmentsList;
      const payload = {
        user_id: user?.id || user?.name,
        date: appointmentData.date,
        time: appointmentData.time,
        doctor_name: appointmentData.doctor_name,
        clinic: appointmentData.clinic,
        reason: appointmentData.reason,
      };
      
      if (editingId) {
        const normalizedId = String(editingId);
 
        if (isMongoId(normalizedId)) {
          try {
            const response = await fetch(`${API}/appointments/${normalizedId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
 
            if (!response.ok) {
              throw new Error('Failed to update remote appointment');
            }
 
            const updatedRemote = normalizeAppointment(await response.json());
            updatedAppointments = appointmentsList.map((appointment) =>
              String(appointment.id) === normalizedId ? updatedRemote : appointment
            );
          } catch {
            updatedAppointments = appointmentsList.map((appointment) =>
              String(appointment.id) === normalizedId
                ? {
                    ...appointment,
                    ...appointmentData,
                    doctor_name: appointmentData.doctor_name,
                    updated_at: new Date().toISOString(),
                  }
                : appointment
            );
          }
        } else {
          updatedAppointments = appointmentsList.map((appointment) =>
            String(appointment.id) === normalizedId
              ? {
                  ...appointment,
                  ...appointmentData,
                  doctor_name: appointmentData.doctor_name,
                  updated_at: new Date().toISOString(),
                }
              : appointment
          );
        }
      } else {
        try {
          const response = await fetch(`${API}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
 
          if (!response.ok) {
            throw new Error('Failed to save remote appointment');
          }
 
          const createdAppointment = normalizeAppointment(await response.json());
          updatedAppointments = [...appointmentsList, createdAppointment];
        } catch {
          const newAppointment = {
            id: `apt_${Date.now()}`,
            ...appointmentData,
            user_name: user.name,
            created_at: new Date().toISOString()
          };
          updatedAppointments = [...appointmentsList, newAppointment];
        }
      }
      
      saveToLocalStorage(updatedAppointments);
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
      let appointmentsList = getLocalAppointments();
 
      if (isMongoId(appointmentId)) {
        try {
          const response = await fetch(`${API}/appointments/${appointmentId}`, {
            method: 'DELETE',
          });
 
          if (!response.ok) {
            throw new Error('Failed to delete remote appointment');
          }
        } catch (error) {
          console.error('Error deleting appointment:', error);
        }
      }
 
      appointmentsList = appointmentsList.filter((appointment) => String(appointment.id) !== String(appointmentId));
      saveToLocalStorage(appointmentsList);
      
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-linear-to-r from-purple-600 to-pink-500 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-pink-500 hover:bg-opacity-50 rounded-lg transition text-white"
              title="Go back"
            >
              <span className="text-xl">←</span>
            </button>
            <h1 className="text-3xl font-bold text-white">{t.title}</h1>
          </div>
        </div>
      </header>
 
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-semibold shadow-lg animate-slide-in ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}
 
      <div className="max-w-7xl mx-auto w-full px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Appointments</h2>
            <p className="text-gray-600 text-sm mt-1">Schedule and track your checkup appointments</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            disabled={isLoading}
            className="px-6 py-2.5 bg-linear-to-r from-purple-600 to-pink-500 text-white font-semibold text-sm rounded-lg hover:shadow-lg transition disabled:opacity-50 leading-normal"
          >
            {showForm ? '✕ Cancel' : '+ New Appointment'}
          </button>
        </div>
 
        {/* Form */}
        {showForm && (
          <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md border border-gray-200 p-8 mb-10">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Schedule New Appointment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.date}</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 outline-none transition text-sm ${
                    touched.date && errors.date
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'
                  }`}
                />
                {touched.date && errors.date && (
                  <p className="text-red-500 text-xs mt-1">{errors.date}</p>
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
                  className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 outline-none transition text-sm ${
                    touched.time && errors.time
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'
                  }`}
                />
                {touched.time && errors.time && (
                  <p className="text-red-500 text-xs mt-1">{errors.time}</p>
                )}
              </div>
            </div>
 
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.doctorName}</label>
              <input
                type="text"
                name="doctorName"
                placeholder={language === 'ne' ? 'डाक्टरको नाम' : 'Enter doctor\'s name'}
                value={formData.doctorName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 outline-none transition text-sm ${
                  touched.doctorName && errors.doctorName
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'
                }`}
              />
              {touched.doctorName && errors.doctorName && (
                <p className="text-red-500 text-xs mt-1">{errors.doctorName}</p>
              )}
            </div>
 
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.clinic}</label>
              <input
                type="text"
                name="clinic"
                placeholder={language === 'ne' ? 'क्लिनिक/अस्पताल' : 'Enter clinic/hospital name'}
                value={formData.clinic}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 outline-none transition text-sm ${
                  touched.clinic && errors.clinic
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'
                }`}
              />
              {touched.clinic && errors.clinic && (
                <p className="text-red-500 text-xs mt-1">{errors.clinic}</p>
              )}
            </div>
 
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.reason}</label>
              <textarea
                name="reason"
                placeholder={language === 'ne' ? 'नियमित जाँच, अल्ट्रासाउन्ड, आदि' : 'E.g., regular checkup, ultrasound, etc.'}
                value={formData.reason}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition text-sm"
              />
            </div>
 
            <div className="flex gap-3 mt-8 justify-end">
              <button 
                type="button" 
                onClick={resetForm}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold text-sm rounded-lg transition disabled:opacity-50 leading-normal"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-linear-to-r from-purple-600 to-pink-500 text-white font-semibold text-sm rounded-lg hover:shadow-lg transition disabled:opacity-50 leading-normal"
              >
                {editingId ? t.update : t.save}
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
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">{t.noAppointments}</p>
          </div>
        ) : !isLoading && (
          <div className="space-y-10">
            {/* Upcoming Appointments */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.upcomingTitle}</h2>
              {upcomingAppointments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t.noUpcoming}</p>
              ) : (
                <div className="space-y-5">
                  {upcomingAppointments.map(appointment => (
                    <div key={appointment.id} className="bg-white rounded-xl shadow-md border-l-4 border-purple-500 p-6 hover:shadow-lg transition">
                      <div className="flex justify-between items-start mb-5">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{appointment.doctor_name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{appointment.clinic}</p>
                        </div>
                        <span className="px-4 py-1.5 bg-linear-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-bold rounded-full">{t.upcomingBadge}</span>
                      </div>
 
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-5 border-y border-gray-200">
                        <div className="bg-linear-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                          <p className="text-xs font-semibold text-gray-600 mb-1">📅 Date</p>
                          <p className="text-base font-bold text-gray-900">{appointment.date}</p>
                        </div>
                        <div className="bg-linear-to-br from-pink-50 to-pink-100 rounded-lg p-4">
                          <p className="text-xs font-semibold text-gray-600 mb-1">🕐 Time</p>
                          <p className="text-base font-bold text-gray-900">{appointment.time}</p>
                        </div>
                        <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                          <p className="text-xs font-semibold text-gray-600 mb-1">Status</p>
                          <p className="text-base font-bold text-blue-700">Scheduled</p>
                        </div>
                      </div>
 
                      {appointment.reason && (
                        <div className="mt-5">
                          <p className="text-xs font-semibold text-gray-600 mb-2">{t.reasonLabel}</p>
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{appointment.reason}</p>
                        </div>
                      )}
 
                      <div className="flex gap-3 mt-6 justify-end">
                        <button 
                          onClick={() => handleEdit(appointment)}
                          className="px-4 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-sm rounded-lg transition"
                        >
                          {t.edit}
                        </button>
                        <button 
                          onClick={() => deleteAppointment(appointment.id)}
                          disabled={deleteLoading === appointment.id}
                          className="px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-sm rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                        >
                          {deleteLoading === appointment.id && <div className="w-3 h-3 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />}
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
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.pastTitle}</h2>
                <div className="space-y-5">
                  {pastAppointments.map(appointment => (
                    <div key={appointment.id} className="bg-gray-50 rounded-xl shadow-md border-l-4 border-gray-400 p-6 hover:shadow-lg transition">
                      <div className="flex justify-between items-start mb-5">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{appointment.doctor_name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{appointment.clinic}</p>
                        </div>
                        <span className="px-4 py-1.5 bg-gray-200 text-gray-700 text-xs font-bold rounded-full">{t.completedBadge}</span>
                      </div>
 
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-5 border-y border-gray-300">
                        <div className="bg-linear-to-br from-gray-100 to-gray-200 rounded-lg p-4">
                          <p className="text-xs font-semibold text-gray-600 mb-1">📅 Date</p>
                          <p className="text-base font-bold text-gray-800">{appointment.date}</p>
                        </div>
                        <div className="bg-linear-to-br from-gray-100 to-gray-200 rounded-lg p-4">
                          <p className="text-xs font-semibold text-gray-600 mb-1">🕐 Time</p>
                          <p className="text-base font-bold text-gray-800">{appointment.time}</p>
                        </div>
                        <div className="bg-linear-to-br from-gray-100 to-gray-200 rounded-lg p-4">
                          <p className="text-xs font-semibold text-gray-600 mb-1">Status</p>
                          <p className="text-base font-bold text-gray-600">Completed</p>
                        </div>
                      </div>
 
                      {appointment.reason && (
                        <div className="mt-5">
                          <p className="text-xs font-semibold text-gray-600 mb-2">{t.reasonLabel}</p>
                          <p className="text-sm text-gray-600 bg-white rounded-lg p-3">{appointment.reason}</p>
                        </div>
                      )}
 
                      <div className="flex gap-3 mt-6 justify-end">
                        <button 
                          onClick={() => deleteAppointment(appointment.id)}
                          disabled={deleteLoading === appointment.id}
                          className="px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-sm rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                        >
                          {deleteLoading === appointment.id && <div className="w-3 h-3 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />}
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