/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { MOCK_DATA } from './data';
import { usePersistentState } from './hooks/usePersistentState';
// FIX: Added Admin and PainJournalEntry to import
import { Appointment, Category, ClinicalNote, EditableItem, Exercise, Message, Notification, Patient, PainJournalEntry, TherapyProgram, Therapist, User, UserRole, Admin, Testimonial, Theme, FAQItem } from './types';

import LandingPage from './views/LandingPage';
import RoleSelection from './views/RoleSelection';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import Modal from './components/Modal';
import { fileToDataURL } from './utils';

type View = 'landing' | 'roleSelection' | 'login' | 'dashboard';

const App: React.FC = () => {
    const [view, setView] = useState<View>('landing');
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [loginError, setLoginError] = useState('');
    
    // FIX: Added Admin to currentUser state type.
    const [currentUser, setCurrentUser] = usePersistentState<User | Therapist | Patient | Admin | null>('currentUser', null);
    const [categories, setCategories] = usePersistentState<Category[]>('categories', MOCK_DATA.categories);
    const [programs, setPrograms] = usePersistentState<TherapyProgram[]>('programs', MOCK_DATA.programs);
    const [patients, setPatients] = usePersistentState<Patient[]>('patients', MOCK_DATA.patients);
    const [exercises, setExercises] = usePersistentState<Exercise[]>('exercises', MOCK_DATA.exercises);
    const [appointments, setAppointments] = usePersistentState<Appointment[]>('appointments', MOCK_DATA.appointments);
    const [therapists, setTherapists] = usePersistentState<Therapist[]>('therapists', MOCK_DATA.therapists);
    const [messages, setMessages] = usePersistentState<Message[]>('messages', MOCK_DATA.messages);
    const [notifications, setNotifications] = usePersistentState<Notification[]>('notifications', MOCK_DATA.notifications);
    const [testimonials, setTestimonials] = usePersistentState<Testimonial[]>('testimonials', MOCK_DATA.testimonials);
    const [faqs, setFaqs] = usePersistentState<FAQItem[]>('faqs', MOCK_DATA.faqs);
    const [theme, setTheme] = usePersistentState<Theme>('theme', 'light');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
    const [modalType, setModalType] = useState<'category' | 'service' | 'patient' | 'exercise' | 'therapist' | 'clinicalNote' | 'appointment' | null>(null);
    const [editingItem, setEditingItem] = useState<EditableItem | null>(null);

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

    const handleResetData = () => {
        if (window.confirm('Emin misiniz? Tüm değişiklikler kaybolacak ve uygulama başlangıç durumuna dönecektir.')) {
            localStorage.clear();
            window.location.reload();
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
        setMessages(prev => [...prev, newMessage]);
        const recipient = therapists.find(t => t.id === partnerId) || patients.find(p => p.id === partnerId);
        if (recipient) {
            const newNotification: Notification = { id: crypto.randomUUID(), userId: recipient.id, text: `${currentUser.name} tarafından yeni bir mesajınız var.`, timestamp: Date.now(), read: false, };
            setNotifications(prev => [...prev, newNotification]);
        }
    };
    
    const handleCompleteExercise = (patientId: string, exerciseId: string) => {
        const today = new Date().toISOString().split('T')[0];
        setPatients(prev => prev.map(p => {
            if (p.id !== patientId) return p;
            const newLog = { ...p.exerciseLog };
            const todayLog = newLog[today] || [];
            if (!todayLog.includes(exerciseId)) {
                newLog[today] = [...todayLog, exerciseId];
            }
            return { ...p, exerciseLog: newLog };
        }));
    };
    
    const handleAddClinicalNote = (patientId: string, noteData: Omit<ClinicalNote, 'id' | 'date' | 'therapistId'>) => {
        if (!currentUser || !('patientIds' in currentUser)) return; // Therapist check
        const newNote: ClinicalNote = { ...noteData, id: crypto.randomUUID(), date: Date.now(), therapistId: currentUser.id };
        setPatients(prev => prev.map(p => p.id === patientId ? { ...p, clinicalNotes: [...p.clinicalNotes, newNote].sort((a,b)=> b.date - a.date) } : p ));
    };

    const handleAddJournalEntry = (patientId: string, entryData: Omit<PainJournalEntry, 'date'>) => {
        const newEntry: PainJournalEntry = { ...entryData, date: Date.now() };
        setPatients(prev => 
            prev.map(p => 
                p.id === patientId 
                    ? { ...p, painJournal: [...p.painJournal, newEntry].sort((a,b) => a.date - b.date) } 
                    : p
            )
        );
    };

    const [activeChatPartner, setActiveChatPartner] = useState<Patient | Therapist | null>(null);

    const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        // FIX: Used a type guard to safely access 'id' on editingItem.
        const id = (editingItem && 'id' in editingItem) ? editingItem.id : crypto.randomUUID();
        const name = formData.get('name') as string;

        if (modalType === 'category') {
            const newCategory = { id, name };
            setCategories(prev => modalMode === 'add' ? [...prev, newCategory] : prev.map(c => c.id === id ? newCategory : c));
        }
        if (modalType === 'exercise') {
            const generatedData = JSON.parse(formData.get('generatedData') as string || '{}');
            const newExercise: Exercise = { id, name: generatedData.name || name, description: generatedData.description || formData.get('description') as string, sets: generatedData.sets || parseInt(formData.get('sets') as string), reps: generatedData.reps || parseInt(formData.get('reps') as string), imageUrl: generatedData.imageUrl || (editingItem as Exercise)?.imageUrl, videoUrl: generatedData.videoUrl || (editingItem as Exercise)?.videoUrl, audioUrl: generatedData.audioUrl || (editingItem as Exercise)?.audioUrl, };
            setExercises(prev => modalMode === 'add' ? [...prev, newExercise] : prev.map(e => e.id === id ? newExercise : e));
        }
        if (modalType === 'service') {
            const exerciseIds: string[] = [];
            formData.forEach((_, key) => key.startsWith('exercise-') && exerciseIds.push(key.replace('exercise-', '')));
            const newProgram = { id, name, description: formData.get('description') as string, categoryId: formData.get('categoryId') as string, exerciseIds, };
            setPrograms(prev => modalMode === 'add' ? [...prev, newProgram] : prev.map(s => s.id === id ? newProgram : s));
        }
        if (modalType === 'patient') {
             const serviceIds: string[] = [];
             formData.forEach((_, key) => key.startsWith('service-') && serviceIds.push(key.replace('service-', '')));
             const newPatient: Patient = { ...editingItem as Patient, id, name, email: formData.get('email') as string, therapistId: formData.get('therapistId') as string, serviceIds, };
             setPatients(prev => modalMode === 'add' ? [...prev, newPatient] : prev.map(p => p.id === id ? newPatient : p));
        }
        if(modalType === 'therapist') {
            const newTherapist: Therapist = { ...editingItem as Therapist, id, name, email: formData.get('email') as string, bio: formData.get('bio') as string, profileImageUrl: formData.get('profileImageUrl') as string, };
            setTherapists(prev => modalMode === 'add' ? [...prev, newTherapist] : prev.map(t => t.id === id ? newTherapist : t));
        }
        if(modalType === 'clinicalNote' && editingItem && 'patientId' in editingItem) {
            handleAddClinicalNote(editingItem.patientId, {
                subjective: formData.get('subjective') as string,
                objective: formData.get('objective') as string,
                assessment: formData.get('assessment') as string,
                plan: formData.get('plan') as string,
            });
        }
        closeModal();
    };

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
                    setAppointments={setAppointments}
                    setPatients={setPatients}
                    setNotifications={setNotifications}
                    onCompleteExercise={handleCompleteExercise}
                    onAddJournalEntry={handleAddJournalEntry}
                    onCategoryDelete={(id) => setCategories(prev => prev.filter(c => c.id !== id))}
                    onServiceDelete={(id) => setPrograms(prev => prev.filter(s => s.id !== id))}
                    onPatientDelete={(patient) => setPatients(prev => prev.filter(p => p.id !== patient.id))}
                    onExerciseDelete={(id) => setExercises(prev => prev.filter(e => e.id !== id))}
                    onTherapistDelete={(id) => setTherapists(prev => prev.filter(t => t.id !== id))}
                    onAdminCancelAppointment={(app) => setAppointments(prev => prev.map(a => a.id === app.id ? {...a, status: 'canceled'} : a))}
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
                categories={categories}
                exercises={exercises}
                therapists={therapists}
                programs={programs}
            />
        </>
    );
};

export default App;