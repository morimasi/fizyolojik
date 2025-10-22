/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { usePersistentState } from './hooks/usePersistentState';
import { apiService, AppData } from './services/apiService';
import { Appointment, Category, ClinicalNote, EditableItem, Exercise, Message, Notification, Patient, PainJournalEntry, TherapyProgram, Therapist, User, UserRole, Admin, Testimonial, Theme, FAQItem } from './types';

import LandingPage from './views/LandingPage';
import RoleSelection from './views/RoleSelection';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import Modal from './components/Modal';
import FullScreenLoader from './components/FullScreenLoader';
import ErrorDisplay from './components/ErrorDisplay';
import { fileToDataURL } from './utils';

type View = 'landing' | 'roleSelection' | 'login' | 'dashboard';

const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const [view, setView] = useState<View>('landing');
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [loginError, setLoginError] = useState('');
    
    // Persistent state for session/UI
    const [currentUser, setCurrentUser] = usePersistentState<User | Therapist | Patient | Admin | null>('currentUser', null);
    const [theme, setTheme] = usePersistentState<Theme>('theme', 'light');

    // Data state
    const [categories, setCategories] = useState<Category[]>([]);
    const [programs, setPrograms] = useState<TherapyProgram[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [faqs, setFaqs] = useState<FAQItem[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
    // FIX: Added 'appointment' to the state's type definition to match the 'openModal' function parameter.
    const [modalType, setModalType] = useState<'category' | 'service' | 'patient' | 'exercise' | 'therapist' | 'clinicalNote' | 'appointment' | null>(null);
    const [editingItem, setEditingItem] = useState<EditableItem | null>(null);
    const [activeChatPartner, setActiveChatPartner] = useState<Patient | Therapist | null>(null);
    
    const setAllData = (data: AppData) => {
        setCategories(data.categories);
        setPrograms(data.programs);
        setPatients(data.patients);
        setExercises(data.exercises);
        setAppointments(data.appointments);
        setTherapists(data.therapists);
        setMessages(data.messages);
        setNotifications(data.notifications);
        setTestimonials(data.testimonials);
        setFaqs(data.faqs);
    };

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiService.getInitialData();
            setAllData(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Bilinmeyen bir hata oluştu.'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);


    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);


    const openModal = (type: 'category' | 'service' | 'patient' | 'exercise' | 'therapist' | 'clinicalNote' | 'appointment', mode: 'add' | 'edit', item?: EditableItem | null) => {
        setModalType(type);
        setModalMode(mode);
        setEditingItem(item || null);
        setIsModalOpen(true);
    };
    const closeModal = () => setIsModalOpen(false);

    const handleRoleSelect = (role: UserRole) => {
        setSelectedRole(role);
        setView('login');
    };

    const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoginError('');
        const formData = new FormData(event.currentTarget);
        const email = (formData.get('email') as string)?.toLowerCase();
        const password = formData.get('password') as string;

        if (selectedRole === 'admin') {
            if (password === 'admin2024') {
                setCurrentUser({ id: 'admin', name: 'Admin' });
                setView('dashboard');
            } else { setLoginError('Geçersiz parola.'); }
            return;
        }

        const userList = selectedRole === 'therapist' ? therapists : patients;
        const foundUser = userList.find(u => u.email.toLowerCase() === email);

        if (foundUser && password === '1234') {
            setCurrentUser(foundUser);
            setView('dashboard');
        } else { setLoginError('Geçersiz e-posta veya parola.'); }
    };
    
    const handleLogout = () => {
        setCurrentUser(null);
        setSelectedRole(null);
        setView('landing');
    };

    const handleResetData = async () => {
        if (window.confirm('Emin misiniz? Tüm değişiklikler kaybolacak ve uygulama başlangıç durumuna dönecektir.')) {
            setIsLoading(true);
            const data = await apiService.resetData();
            setAllData(data);
            setCurrentUser(null);
            setSelectedRole(null);
            setView('landing');
            setIsLoading(false);
        }
    };
    
    const handleSendMessage = async (text: string, file?: File | null) => {
        if (!currentUser || ('patientIds' in currentUser && !activeChatPartner) || !('email' in currentUser)) return;
        const currentUserId = 'id' in currentUser ? currentUser.id : 'admin';
        const partnerId = activeChatPartner?.id ?? '';
        let fileData;
        if (file) {
            const dataUrl = await fileToDataURL(file);
            fileData = { name: file.name, mimeType: file.type, url: dataUrl };
        }
        const newMessage: Message = { id: crypto.randomUUID(), from: currentUserId, to: partnerId, text, timestamp: Date.now(), file: fileData, };
        const newMessages = [...messages, newMessage];
        setMessages(newMessages);

        const recipient = therapists.find(t => t.id === partnerId) || patients.find(p => p.id === partnerId);
        if (recipient) {
            const newNotification: Notification = { id: crypto.randomUUID(), userId: recipient.id, text: `${currentUser.name} tarafından yeni bir mesajınız var.`, timestamp: Date.now(), read: false, };
            const newNotifications = [...notifications, newNotification];
            setNotifications(newNotifications);
            await apiService.updateData({ messages: newMessages, notifications: newNotifications });
            return;
        }
        await apiService.updateData({ messages: newMessages });
    };
    
    const handleCompleteExercise = async (patientId: string, exerciseId: string) => {
        const today = new Date().toISOString().split('T')[0];
        const newPatients = patients.map(p => {
            if (p.id !== patientId) return p;
            const newLog = { ...p.exerciseLog };
            const todayLog = newLog[today] || [];
            if (!todayLog.includes(exerciseId)) {
                newLog[today] = [...todayLog, exerciseId];
            }
            return { ...p, exerciseLog: newLog };
        });
        setPatients(newPatients);
        await apiService.updateData({ patients: newPatients });
    };
    
    const handleAddClinicalNote = async (patientId: string, noteData: Omit<ClinicalNote, 'id' | 'date' | 'therapistId'>) => {
        if (!currentUser || !('patientIds' in currentUser)) return; // Therapist check
        const newNote: ClinicalNote = { ...noteData, id: crypto.randomUUID(), date: Date.now(), therapistId: currentUser.id };
        const newPatients = patients.map(p => p.id === patientId ? { ...p, clinicalNotes: [...p.clinicalNotes, newNote].sort((a,b)=> b.date - a.date) } : p );
        setPatients(newPatients);
        await apiService.updateData({ patients: newPatients });
    };

    const handleAddJournalEntry = async (patientId: string, entryData: Omit<PainJournalEntry, 'date'>) => {
        const newEntry: PainJournalEntry = { ...entryData, date: Date.now() };
        const newPatients = patients.map(p => 
            p.id === patientId 
                ? { ...p, painJournal: [...p.painJournal, newEntry].sort((a,b) => a.date - b.date) } 
                : p
        );
        setPatients(newPatients);
        await apiService.updateData({ patients: newPatients });
    };

    const handleUpsertAppointment = async (app: Partial<Appointment> & { id?: string }) => {
        let newAppointments: Appointment[] = [];
        let notificationText = '';
        const therapist = therapists.find(t => t.id === app.therapistId);

        if (app.id) { // Update existing
            newAppointments = appointments.map(a => a.id === app.id ? { ...a, ...app } as Appointment : a);
            if (app.status === 'canceled') {
                notificationText = `Terapistiniz ${therapist?.name}, ${new Date(app.start!).toLocaleString('tr-TR')} tarihli randevunuzu iptal etti.`;
            }
        } else { // Create new
            const newApp: Appointment = {
                id: crypto.randomUUID(),
                patientId: app.patientId!,
                therapistId: app.therapistId!,
                start: app.start!,
                end: app.start! + 30 * 60 * 1000, // 30 min default
                status: 'scheduled',
                notes: app.notes,
            };
            newAppointments = [...appointments, newApp];
            notificationText = `Terapistiniz ${therapist?.name} sizin için yeni bir randevu oluşturdu: ${new Date(newApp.start).toLocaleString('tr-TR')}.`;
        }
        
        setAppointments(newAppointments);
        
        if (notificationText && app.patientId) {
            const newNotification: Notification = {
                id: crypto.randomUUID(),
                userId: app.patientId,
                text: notificationText,
                timestamp: Date.now(),
                read: false,
            };
            const newNotifications = [...notifications, newNotification];
            setNotifications(newNotifications);
            await apiService.updateData({ appointments: newAppointments, notifications: newNotifications });
        } else {
            await apiService.updateData({ appointments: newAppointments });
        }
        
        closeModal();
    };


    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const id = (editingItem && 'id' in editingItem) ? editingItem.id : crypto.randomUUID();
        const name = formData.get('name') as string;

        if (modalType === 'category') {
            const newCategory = { id, name };
            const newCategories = modalMode === 'add' ? [...categories, newCategory] : categories.map(c => c.id === id ? newCategory : c);
            setCategories(newCategories);
            await apiService.updateData({ categories: newCategories });
        }
        if (modalType === 'exercise') {
            const generatedData = JSON.parse(formData.get('generatedData') as string || '{}');
            const newExercise: Exercise = { id, name: generatedData.name || name, description: generatedData.description || formData.get('description') as string, sets: generatedData.sets || parseInt(formData.get('sets') as string), reps: generatedData.reps || parseInt(formData.get('reps') as string), imageUrl: generatedData.imageUrl || (editingItem as Exercise)?.imageUrl, videoUrl: generatedData.videoUrl || (editingItem as Exercise)?.videoUrl, audioUrl: generatedData.audioUrl || (editingItem as Exercise)?.audioUrl, };
            const newExercises = modalMode === 'add' ? [...exercises, newExercise] : exercises.map(e => e.id === id ? newExercise : e);
            setExercises(newExercises);
            await apiService.updateData({ exercises: newExercises });
        }
        if (modalType === 'service') {
            const exerciseIds: string[] = [];
            formData.forEach((_, key) => key.startsWith('exercise-') && exerciseIds.push(key.replace('exercise-', '')));
            const newProgram = { id, name, description: formData.get('description') as string, categoryId: formData.get('categoryId') as string, exerciseIds, };
            const newPrograms = modalMode === 'add' ? [...programs, newProgram] : programs.map(s => s.id === id ? newProgram : s);
            setPrograms(newPrograms);
            await apiService.updateData({ programs: newPrograms });
        }
        if (modalType === 'patient') {
             const serviceIds: string[] = [];
             formData.forEach((_, key) => key.startsWith('service-') && serviceIds.push(key.replace('service-', '')));
             const newPatient: Patient = { ...(editingItem || {}) as Patient, id, name, email: formData.get('email') as string, therapistId: formData.get('therapistId') as string, serviceIds, };
             const newPatients = modalMode === 'add' ? [...patients, newPatient] : patients.map(p => p.id === id ? newPatient : p);
             setPatients(newPatients);
             await apiService.updateData({ patients: newPatients });
        }
        if(modalType === 'therapist') {
            const newTherapist: Therapist = { ...(editingItem || {}) as Therapist, id, name, email: formData.get('email') as string, bio: formData.get('bio') as string, profileImageUrl: formData.get('profileImageUrl') as string, };
            const newTherapists = modalMode === 'add' ? [...therapists, newTherapist] : therapists.map(t => t.id === id ? newTherapist : t);
            setTherapists(newTherapists);
            await apiService.updateData({ therapists: newTherapists });
        }
        if(modalType === 'appointment' && editingItem) {
             handleUpsertAppointment({
                therapistId: (editingItem as Appointment).therapistId,
                start: (editingItem as Appointment).start,
                patientId: formData.get('patientId') as string,
                notes: formData.get('notes') as string,
            });
        }
        if(modalType === 'clinicalNote' && editingItem && 'patientId' in editingItem) {
            await handleAddClinicalNote(editingItem.patientId, {
                subjective: formData.get('subjective') as string,
                objective: formData.get('objective') as string,
                assessment: formData.get('assessment') as string,
                plan: formData.get('plan') as string,
            });
        }
        closeModal();
    };

    const handleCategoryDelete = async (id: string) => {
        const newCategories = categories.filter(c => c.id !== id);
        setCategories(newCategories);
        await apiService.updateData({ categories: newCategories });
    };

    const handleServiceDelete = async (id: string) => {
        const newPrograms = programs.filter(s => s.id !== id);
        setPrograms(newPrograms);
        await apiService.updateData({ programs: newPrograms });
    };
    
    const handlePatientDelete = async (patient: Patient) => {
        const newPatients = patients.filter(p => p.id !== patient.id);
        setPatients(newPatients);
        await apiService.updateData({ patients: newPatients });
    };
    
    const handleExerciseDelete = async (id: string) => {
        const newExercises = exercises.filter(e => e.id !== id);
        setExercises(newExercises);
        await apiService.updateData({ exercises: newExercises });
    };
    
    const handleTherapistDelete = async (id: string) => {
        const newTherapists = therapists.filter(t => t.id !== id);
        setTherapists(newTherapists);
        await apiService.updateData({ therapists: newTherapists });
    };

    const handleAdminCancelAppointment = async (app: Appointment) => {
        // FIX: Explicitly cast 'canceled' to its literal type to ensure the mapped array is of type Appointment[].
        const newAppointments = appointments.map(a => a.id === app.id ? {...a, status: 'canceled' as 'canceled'} : a);
        setAppointments(newAppointments);
        await apiService.updateData({ appointments: newAppointments });
    };

    if (isLoading) {
        return <FullScreenLoader />;
    }

    if (error) {
        return <ErrorDisplay error={error} onRetry={fetchData} />;
    }

    const renderContent = () => {
        switch(view) {
            case 'landing':
                return <LandingPage onGoToRoleSelection={() => setView('roleSelection')} therapists={therapists} categories={categories} programs={programs} testimonials={testimonials} faqs={faqs} theme={theme} setTheme={setTheme} />;
            case 'roleSelection':
                return <RoleSelection onRoleSelect={handleRoleSelect} onBackToLanding={() => setView('landing')} />;
            case 'login':
                return <Login selectedRole={selectedRole} onLogin={handleLogin} onBack={() => setView('roleSelection')} loginError={loginError} />;
            case 'dashboard':
                if (!currentUser) { setView('login'); return null; }
                return <Dashboard 
                    currentUser={currentUser}
                    categories={categories} programs={programs} patients={patients} 
                    exercises={exercises} appointments={appointments} therapists={therapists}
                    messages={messages} notifications={notifications}
                    theme={theme} setTheme={setTheme}
                    onLogout={handleLogout}
                    openModal={openModal}
                    onResetData={handleResetData}
                    onSendMessage={handleSendMessage}
                    activeChatPartner={activeChatPartner}
                    setActiveChatPartner={setActiveChatPartner}
                    setNotifications={async (newNotifications) => {
                        setNotifications(newNotifications);
                        await apiService.updateData({notifications: newNotifications});
                    }}
                    onCompleteExercise={handleCompleteExercise}
                    onAddJournalEntry={handleAddJournalEntry}
                    onUpsertAppointment={handleUpsertAppointment}
                    onCategoryDelete={handleCategoryDelete}
                    onServiceDelete={handleServiceDelete}
                    onPatientDelete={handlePatientDelete}
                    onExerciseDelete={handleExerciseDelete}
                    onTherapistDelete={handleTherapistDelete}
                    onAdminCancelAppointment={handleAdminCancelAppointment}
                />;
            default:
                return <div>Error</div>;
        }
    };

    return (
        <>
            {renderContent()}
            <Modal 
                isOpen={isModalOpen} 
                mode={modalMode} 
                type={modalType} 
                editingItem={editingItem} 
                onClose={closeModal} 
                onSubmit={handleFormSubmit}
                onUpsertAppointment={handleUpsertAppointment}
                categories={categories}
                exercises={exercises}
                therapists={therapists}
                programs={programs}
                patients={patients}
            />
        </>
    );
};

export default App;