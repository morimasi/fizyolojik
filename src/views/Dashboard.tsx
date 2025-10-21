/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { Admin, Appointment, Category, ClinicalNote, EditableItem, Exercise, Message, Notification, Patient, TherapyProgram, Therapist, User, UserRole, WeeklyAvailability } from '../types';
import AdminDashboard from '../panels/AdminDashboard';
import TherapistDashboard from '../panels/TherapistDashboard';
import PatientDashboard from '../panels/PatientDashboard';
import NotificationPanel from '../components/NotificationPanel';
import Modal from '../components/Modal';
import VideoModal from '../components/VideoModal';


type StateTuple<T> = [T, React.Dispatch<React.SetStateAction<T>>];

interface DashboardProps {
    currentUser: User;
    selectedRole: UserRole;
    onLogout: () => void;
    onResetData: () => void;
    patientsState: StateTuple<Patient[]>;
    therapistsState: StateTuple<Therapist[]>;
    programsState: StateTuple<TherapyProgram[]>;
    categoriesState: StateTuple<Category[]>;
    messagesState: StateTuple<Message[]>;
    exercisesState: StateTuple<Exercise[]>;
    notesState: StateTuple<ClinicalNote[]>;
    notificationsState: StateTuple<Notification[]>;
    appointmentsState: StateTuple<Appointment[]>;
}

const Dashboard: React.FC<DashboardProps> = ({
    currentUser, selectedRole, onLogout, onResetData,
    patientsState, therapistsState, programsState, categoriesState,
    messagesState, exercisesState, notesState, notificationsState, appointmentsState
}) => {
    const [patients, setPatients] = patientsState;
    const [therapists, setTherapists] = therapistsState;
    const [programs, setPrograms] = programsState;
    const [categories, setCategories] = categoriesState;
    const [messages, setMessages] = messagesState;
    const [exercises, setExercises] = exercisesState;
    const [notes, setNotes] = notesState;
    const [notifications, setNotifications] = notificationsState;
    const [appointments, setAppointments] = appointmentsState;

    const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
    const [modalType, setModalType] = useState<'category' | 'service' | 'patient' | 'exercise' | null>(null);
    const [editingItem, setEditingItem] = useState<EditableItem | null>(null);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [videoModalData, setVideoModalData] = useState<{url: string; title: string} | null>(null);
    
    // A bit of a hack to expose modal to child components without context
    // In a real app, a context provider would be better.
    (window as any).openVideoModal = (url: string, title: string) => {
        setVideoModalData({ url, title });
        setIsVideoModalOpen(true);
    };

    const roleNames: Record<UserRole, string> = { admin: 'Yönetici', therapist: 'Terapist', patient: 'Danışan' };

    const generateNotification = (userId: string, text: string, link?: Notification['link']) => {
        const newNotification: Notification = {
            id: `n${Date.now()}`,
            userId,
            text,
            timestamp: Date.now(),
            read: false,
            link
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    // --- CRUD & Action Handlers ---
    const handleNotificationClick = (notification: Notification) => {
        setNotifications(notifications.map(n => n.id === notification.id ? { ...n, read: true } : n));
        setIsNotificationPanelOpen(false);

        // This is a simplified navigation handler. A proper routing library would be better.
        if (notification.link) {
            // For now, we can't directly switch views in child components from here without complex prop drilling.
            // This requires child components to handle these notifications, or a global state/context.
            // For this refactor, clicking just marks as read. Deeper navigation is a future step.
            alert(`Bildirime tıklandı: ${notification.text}\nNormalde ilgili sayfaya yönlendirilirsiniz.`);
        }
    };
    
    const handleSendMessage = (text: string, file: File | null = null) => {
        const sender = currentUser as Patient | Therapist;
        
        // FIX: Removed unused and buggy code that was causing a type error.
        // The logic below correctly determines the active chat partner.
        let activeChatPartnerId = '';
        if (selectedRole === 'patient') {
            activeChatPartnerId = (currentUser as Patient).therapistId;
        } else if (selectedRole === 'therapist') {
            const activePatient = patients.find(p => (document.querySelector('.patient-detail-container h2') as HTMLElement)?.innerText.includes(p.name));
            if (activePatient) {
                activeChatPartnerId = activePatient.id;
            }
        }
    
        if (!activeChatPartnerId) return;

        let newMessage: Message = {
          id: `m${Date.now()}`,
          from: sender.id,
          to: activeChatPartnerId,
          timestamp: Date.now(),
        };

        const recipient = [...patients, ...therapists].find(u => u.id === activeChatPartnerId);

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                newMessage.file = {
                    name: file.name,
                    mimeType: file.type,
                    url: e.target?.result as string,
                };
                if(text.trim()) newMessage.text = text;
                
                setMessages(prev => [...prev, newMessage]);
                generateNotification(recipient!.id, `${sender.name}'den yeni bir mesajınız var.`);
            };
            reader.readAsDataURL(file);
        } else {
            newMessage.text = text;
            setMessages(prev => [...prev, newMessage]);
            generateNotification(recipient!.id, `${sender.name}'den yeni bir mesajınız var.`);
        }
    };

    const handleToggleExerciseComplete = (exerciseId: string, programId: string) => {
        const patient = currentUser as Patient;
        const oldStatus = patient.progress[exerciseId];
        const newStatus: 'completed' | 'todo' = oldStatus === 'completed' ? 'todo' : 'completed';

        const updatedPatients = patients.map(p => {
            if (p.id === patient.id) {
                return { ...p, progress: { ...p.progress, [exerciseId]: newStatus } };
            }
            return p;
        });
        setPatients(updatedPatients);

        if (newStatus === 'completed') {
            const program = programs.find(p => p.id === programId);
            if (!program) return;

            const updatedPatient = updatedPatients.find(p => p.id === patient.id);
            if (!updatedPatient) return;

            const allExercisesCompleted = program.exerciseIds.every(exId => updatedPatient.progress[exId] === 'completed');

            if (allExercisesCompleted) {
                generateNotification(
                    patient.therapistId,
                    `${patient.name}, '${program.name}' programını tamamladı.`,
                    { view: 'patient-progress', contextId: patient.id }
                );
            }
        }
    };

    const handleAddClinicalNote = (patientId: string, text: string) => {
        const therapist = currentUser as Therapist;
        const newNote: ClinicalNote = {
          id: `cn${Date.now()}`,
          patientId: patientId,
          therapistId: therapist.id,
          text: text,
          timestamp: Date.now(),
        };
        setNotes(prev => [newNote, ...prev]);
    };
    
    const handleEnrollInProgram = (programId: string) => {
        const patient = currentUser as Patient;
        const updatedPatients = patients.map(p => 
            p.id === patient.id ? {...p, serviceIds: [...p.serviceIds, programId]} : p
        );
        setPatients(updatedPatients);
    };

    const handleBookAppointment = (therapistId: string, start: number) => {
        const patient = currentUser as Patient;
        const newAppointment: Appointment = {
          id: `app${Date.now()}`,
          patientId: patient.id,
          therapistId,
          start,
          end: start + 30 * 60 * 1000,
          status: 'scheduled',
        };
        setAppointments([...appointments, newAppointment]);
        generateNotification(therapistId, `${patient.name} yeni bir randevu aldı.`, { view: 'calendar' });
    };

    const handleCancelAppointment = (app: Appointment) => {
        const isPatient = selectedRole === 'patient';
        const user = currentUser as Patient | Therapist;
        if (confirm("Bu randevuyu iptal etmek istediğinizden emin misiniz?")) {
            setAppointments(appointments.map(a => a.id === app.id ? { ...a, status: 'cancelled' } : a));
            const otherPartyId = isPatient ? app.therapistId : app.patientId;
            const notificationLink = isPatient ? { view: 'calendar' } : { view: 'appointments' };
            generateNotification(otherPartyId, `${user.name} tarafından ${new Date(app.start).toLocaleString()} tarihli randevu iptal edildi.`, notificationLink);
        }
    };
    
     const handleAdminCancelAppointment = (app: Appointment) => {
        if (confirm("Yönetici olarak bu randevuyu iptal etmek istediğinizden emin misiniz? İlgili taraflara bildirim gönderilecektir.")) {
            setAppointments(appointments.map(a => a.id === app.id ? { ...a, status: 'cancelled' } : a));
            generateNotification(app.patientId, `Yönetim tarafından ${new Date(app.start).toLocaleString()} tarihli randevunuz iptal edildi.`, { view: 'appointments' });
            generateNotification(app.therapistId, `Yönetim tarafından ${new Date(app.start).toLocaleString()} tarihli randevunuz iptal edildi.`, { view: 'calendar' });
        }
    };
    
    const handleAvailabilitySave = (availability: WeeklyAvailability) => {
        setTherapists(therapists.map(t => t.id === (currentUser as Therapist).id ? { ...t, availability } : t));
    };

    // --- Modal & Admin CRUD Handlers ---
    const openModal = (type: 'category' | 'service' | 'patient' | 'exercise', mode: 'add' | 'edit', item: EditableItem | null = null) => {
        setModalType(type);
        setModalMode(mode);
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => {
            setModalType(null);
            setModalMode(null);
            setEditingItem(null);
        }, 300);
    };
    
    const handleModalFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const generatedData = JSON.parse(formData.get('generatedData') as string || '{}');

        if (modalType === 'category') {
            const name = formData.get('name') as string;
            if (modalMode === 'add') {
                const newCategory: Category = { id: `cat${Date.now()}`, name };
                setCategories([...categories, newCategory]);
            } else if (modalMode === 'edit' && editingItem?.id) {
                setCategories(categories.map(c => c.id === editingItem.id ? { ...c, name } : c));
            }
        } else if (modalType === 'service') {
            const name = formData.get('name') as string;
            const description = formData.get('description') as string;
            const categoryId = formData.get('categoryId') as string;
            const exerciseIds = Array.from(formData.keys()).filter(key => key.startsWith('exercise-')).map(key => key.split('-')[1]);
            if (modalMode === 'add') {
                const newProgram: TherapyProgram = { id: `s${Date.now()}`, name, description, categoryId, exerciseIds };
                setPrograms([...programs, newProgram]);
            } else if (modalMode === 'edit' && editingItem?.id) {
                setPrograms(programs.map(s => s.id === editingItem.id ? { ...s, name, description, categoryId, exerciseIds } : s));
            }
        } else if (modalType === 'patient') {
            const name = formData.get('name') as string;
            const email = formData.get('email') as string;
            const password = formData.get('password') as string;
            const therapistId = formData.get('therapistId') as string;
            const serviceIds = Array.from(formData.keys()).filter(key => key.startsWith('service-')).map(key => key.split('-')[1]);

            if (modalMode === 'add') {
                const newPatient: Patient = { id: `p${Date.now()}`, name, email, password, therapistId, serviceIds, progress: {} };
                setPatients([...patients, newPatient]);
                setTherapists(therapists.map(t => t.id === therapistId ? { ...t, patientIds: [...t.patientIds, newPatient.id] } : t));
            } else if (modalMode === 'edit' && editingItem?.id) {
                const originalPatient = patients.find(p => p.id === editingItem.id);
                if (!originalPatient) return;

                const updatedPatient: Patient = { ...originalPatient, name, email, therapistId, serviceIds, password: originalPatient.password };
                if (password) updatedPatient.password = password;
                setPatients(patients.map(p => p.id === editingItem.id ? updatedPatient : p));

                if (originalPatient.therapistId !== therapistId) {
                    setTherapists(therapists.map(t => {
                        if (t.id === originalPatient.therapistId) return { ...t, patientIds: t.patientIds.filter(pid => pid !== editingItem.id) };
                        if (t.id === therapistId) return { ...t, patientIds: [...t.patientIds, editingItem.id!] };
                        return t;
                    }));
                }
            }
        } else if (modalType === 'exercise') {
            const name = formData.get('name') as string;
            const description = formData.get('description') as string;
            const sets = parseInt(formData.get('sets') as string, 10);
            const reps = parseInt(formData.get('reps') as string, 10);
            
            const finalExerciseData = {
                name, description, sets, reps,
                videoUrl: generatedData?.videoUrl || editingItem?.videoUrl || '',
                imageUrl: generatedData?.imageUrl || editingItem?.imageUrl || '',
                audioUrl: generatedData?.audioUrl || editingItem?.audioUrl || '',
            };

            if (modalMode === 'add') {
                const newExercise: Exercise = { ...finalExerciseData, id: `ex${Date.now()}` };
                setExercises([...exercises, newExercise]);
            } else if (modalMode === 'edit' && editingItem?.id) {
                setExercises(exercises.map(ex => ex.id === editingItem.id ? { ...ex, ...finalExerciseData } : ex));
            }
        }
    };
    
    const handleCategoryDelete = (idToDelete: string) => {
        if (confirm("Bu kategoriyi silmek istediğinizden emin misiniz? Bu kategoriye ait tüm hizmetler de silinecektir.")) {
            const servicesToDelete = programs.filter(s => s.categoryId === idToDelete).map(s => s.id);
            const updatedPatients = patients.map(p => ({
                ...p,
                serviceIds: p.serviceIds.filter(sid => !servicesToDelete.includes(sid))
            }));
            setPatients(updatedPatients);
            setPrograms(programs.filter(s => s.categoryId !== idToDelete));
            setCategories(categories.filter(c => c.id !== idToDelete));
        }
    };

    const handleServiceDelete = (idToDelete: string) => {
        if (confirm("Bu hizmeti silmek istediğinizden emin misiniz?")) {
            const updatedPatients = patients.map(p => ({
                ...p,
                serviceIds: p.serviceIds.filter(sid => sid !== idToDelete)
            }));
            setPatients(updatedPatients);
            setPrograms(programs.filter(s => s.id !== idToDelete));
        }
    };

    const handlePatientDelete = (patientToDelete: Patient) => {
        if (confirm(`${patientToDelete.name} adlı danışanı silmek istediğinizden emin misiniz?`)) {
            setPatients(patients.filter(p => p.id !== patientToDelete.id));
            setTherapists(therapists.map(t =>
                t.id === patientToDelete.therapistId
                ? { ...t, patientIds: t.patientIds.filter(pid => pid !== patientToDelete.id) }
                : t
            ));
            setMessages(messages.filter(m => m.from !== patientToDelete.id && m.to !== patientToDelete.id));
            setNotes(notes.filter(n => n.patientId !== patientToDelete.id));
        }
    };

    const handleExerciseDelete = (idToDelete: string) => {
        if (confirm("Bu egzersizi silmek istediğinizden emin misiniz? Bu egzersiz tüm programlardan kaldırılacaktır.")) {
            setExercises(exercises.filter(ex => ex.id !== idToDelete));
            setPrograms(programs.map(p => ({
                ...p,
                exerciseIds: p.exerciseIds.filter(exId => exId !== idToDelete)
            })));
        }
    };

    let content;
    switch (selectedRole) {
        case 'admin': 
            content = <AdminDashboard 
                categories={categories}
                programs={programs}
                patients={patients}
                exercises={exercises}
                appointments={appointments}
                therapists={therapists}
                onCategoryDelete={handleCategoryDelete}
                onServiceDelete={handleServiceDelete}
                onPatientDelete={handlePatientDelete}
                onExerciseDelete={handleExerciseDelete}
                onAdminCancelAppointment={handleAdminCancelAppointment}
                onResetData={onResetData}
                openModal={openModal}
            />; 
            break;
        case 'therapist': 
            content = <TherapistDashboard 
                currentUser={currentUser as Therapist}
                patients={patients}
                programs={programs}
                exercises={exercises}
                notes={notes}
                appointments={appointments}
                messages={messages}
                onAddClinicalNote={handleAddClinicalNote}
                onSendMessage={handleSendMessage}
                onAvailabilitySave={handleAvailabilitySave}
            />; 
            break;
        case 'patient': 
            content = <PatientDashboard 
                currentUser={currentUser as Patient}
                therapists={therapists}
                programs={programs}
                exercises={exercises}
                appointments={appointments}
                categories={categories}
                patients={patients}
                messages={messages}
                onToggleExerciseComplete={handleToggleExerciseComplete}
                onBookAppointment={handleBookAppointment}
                onCancelAppointment={handleCancelAppointment}
                onEnrollInProgram={handleEnrollInProgram}
                onSendMessage={handleSendMessage}
            />; 
            break;
        default: content = <div>Bilinmeyen Rol</div>;
    }
    
    const currentUserId = 'id' in currentUser ? currentUser.id : 'admin';
    const userNotifications = notifications.filter(n => n.userId === currentUserId);
    const unreadCount = userNotifications.filter(n => !n.read).length;

    return (
        <div className="dashboard-container view-enter">
            {isModalOpen && <Modal
                isOpen={isModalOpen}
                mode={modalMode}
                type={modalType}
                editingItem={editingItem}
                onClose={closeModal}
                onSubmit={handleModalFormSubmit}
                categories={categories}
                exercises={exercises}
                therapists={therapists}
                programs={programs}
             />}
            {isVideoModalOpen && videoModalData && <VideoModal 
                url={videoModalData.url}
                title={videoModalData.title}
                onClose={() => setIsVideoModalOpen(false)}
            />}

            <header className="dashboard-header">
                <div className="logo">Fizyoterapi Asistanı</div>
                <div className="header-center">
                    <h2>{roleNames[selectedRole]} Paneli</h2>
                </div>
                <div className="user-info">
                    {selectedRole !== 'admin' && (
                        <div className="notification-bell" onClick={() => setIsNotificationPanelOpen(prev => !prev)}>
                            <span>🔔</span>
                            {unreadCount > 0 && <div className="notification-badge">{unreadCount}</div>}
                            {isNotificationPanelOpen && <NotificationPanel notifications={userNotifications} onNotificationClick={handleNotificationClick}/>}
                        </div>
                    )}
                    <span>Hoş geldiniz, <strong>{currentUser.name}</strong></span>
                    <button onClick={onLogout} className="btn btn-secondary">Çıkış Yap</button>
                </div>
            </header>
            <main className="dashboard-content">{content}</main>
        </div>
    );
};

export default Dashboard;