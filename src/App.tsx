/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, Patient, Therapist, Admin, User, Category, TherapyProgram, Exercise, Message, ClinicalNote, Notification, Appointment, EditableItem } from './types';
import { MOCK_PATIENTS, MOCK_THERAPISTS, MOCK_PROGRAMS, MOCK_CATEGORIES, MOCK_MESSAGES, MOCK_EXERCISES, MOCK_NOTES, MOCK_NOTIFICATIONS, MOCK_APPOINTMENTS } from './data';
import { usePersistentState } from './hooks/usePersistentState';

import LandingPage from './views/LandingPage';
import RoleSelection from './views/RoleSelection';
import Login from './views/Login';
import Dashboard from './views/Dashboard';


const App = () => {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState<'landing' | 'role-selection' | 'login' | 'dashboard'>('landing');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState('');

  // Data state with persistence
  const [patients, setPatients] = usePersistentState<Patient[]>('patients', MOCK_PATIENTS);
  const [therapists, setTherapists] = usePersistentState<Therapist[]>('therapists', MOCK_THERAPISTS);
  const [programs, setPrograms] = usePersistentState<TherapyProgram[]>('programs', MOCK_PROGRAMS);
  const [categories, setCategories] = usePersistentState<Category[]>('categories', MOCK_CATEGORIES);
  const [messages, setMessages] = usePersistentState<Message[]>('messages', MOCK_MESSAGES);
  const [exercises, setExercises] = usePersistentState<Exercise[]>('exercises', MOCK_EXERCISES);
  const [notes, setNotes] = usePersistentState<ClinicalNote[]>('notes', MOCK_NOTES);
  const [notifications, setNotifications] = usePersistentState<Notification[]>('notifications', MOCK_NOTIFICATIONS);
  const [appointments, setAppointments] = usePersistentState<Appointment[]>('appointments', MOCK_APPOINTMENTS);
  
  // --- EFFECTS ---
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.content-section');
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100) {
          section.classList.add('visible');
        }
      });
    };

    if (view === 'landing') {
      window.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [view]);
  
  // This effect ensures that if a patient's progress changes,
  // the currentUser state (which is a snapshot) gets updated to reflect it.
  useEffect(() => {
    if (currentUser && 'progress' in currentUser) {
      const patient = patients.find(p => p.id === (currentUser as Patient).id);
      if (patient) {
        setCurrentUser(patient);
      }
    }
  }, [patients, currentUser]);

  // --- HANDLERS ---
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setView('login');
  };
  
  const handleGoToRoleSelection = () => {
    setView('role-selection');
  }

  const handleBack = () => {
    setSelectedRole(null);
    setLoginError('');
    setView('role-selection');
  };
  
  const handleBackToLanding = () => {
    setSelectedRole(null);
    setLoginError('');
    setView('landing');
  }

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError('');
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    let userFound: User | null = null;
    if (selectedRole === 'admin') {
      if (password === 'admin2024') userFound = { name: 'Admin' };
    } else if (selectedRole === 'therapist') {
      userFound = therapists.find(u => u.email === email && u.password === password) || null;
    } else if (selectedRole === 'patient') {
      userFound = patients.find(u => u.email === email && u.password === password) || null;
    }

    if (userFound) {
      setCurrentUser(userFound);
      setView('dashboard');
    } else {
      setLoginError('Geçersiz e-posta veya parola.');
    }
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedRole(null);
    setLoginError('');
    setView('landing');
  };
  
  const handleResetData = () => {
    if (confirm("Emin misiniz? Bu işlem, tüm verileri SİLEREK uygulamayı orijinal demo durumuna geri yükleyecektir. Bu işlem geri alınamaz.")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  if (view === 'landing') return <LandingPage onGoToRoleSelection={handleGoToRoleSelection} />;
  if (view === 'role-selection') return <RoleSelection onRoleSelect={handleRoleSelect} onBackToLanding={handleBackToLanding} />;
  if (view === 'login') return <Login selectedRole={selectedRole} onLogin={handleLogin} onBack={handleBack} loginError={loginError}/>;
  if (view === 'dashboard' && currentUser && selectedRole) {
    return (
        <Dashboard
            currentUser={currentUser}
            selectedRole={selectedRole}
            onLogout={handleLogout}
            patientsState={[patients, setPatients]}
            therapistsState={[therapists, setTherapists]}
            programsState={[programs, setPrograms]}
            categoriesState={[categories, setCategories]}
            messagesState={[messages, setMessages]}
            exercisesState={[exercises, setExercises]}
            notesState={[notes, setNotes]}
            notificationsState={[notifications, setNotifications]}
            appointmentsState={[appointments, setAppointments]}
            onResetData={handleResetData}
        />
    );
  }

  return <div>Yükleniyor...</div>;
};

export default App;
