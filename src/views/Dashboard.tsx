/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
// FIX: Added Admin and PainJournalEntry type to import
import { Appointment, Category, EditableItem, Exercise, Message, Notification, Patient, PainJournalEntry, TherapyProgram, Therapist, User, Admin, Theme } from '../types';

import AdminDashboard from '../panels/AdminDashboard';
import TherapistDashboard from '../panels/TherapistDashboard';
import PatientDashboard from '../panels/PatientDashboard';
import ChatInterface from '../components/ChatInterface';
import NotificationPanel from '../components/NotificationPanel';
import ThemeSelector from '../components/ThemeSelector';


interface DashboardProps {
    // FIX: Added Admin to currentUser prop type.
    currentUser: User | Therapist | Patient | Admin;
    categories: Category[];
    programs: TherapyProgram[];
    patients: Patient[];
    exercises: Exercise[];
    appointments: Appointment[];
    therapists: Therapist[];
    messages: Message[];
    notifications: Notification[];
    theme: Theme;
    setTheme: (theme: Theme) => void;
    onLogout: () => void;
    onResetData: () => void;
    openModal: (type: 'category' | 'service' | 'patient' | 'exercise' | 'therapist' | 'clinicalNote' | 'appointment', mode: 'add' | 'edit', item?: EditableItem | null) => void;
    onSendMessage: (text: string, file?: File | null) => void;
    activeChatPartner: Patient | Therapist | null;
    setActiveChatPartner: React.Dispatch<React.SetStateAction<Patient | Therapist | null>>;
    setNotifications: (notifications: Notification[]) => Promise<void>;
    onCompleteExercise: (patientId: string, exerciseId: string) => void;
    onAddJournalEntry: (patientId: string, entryData: Omit<PainJournalEntry, 'date'>) => void;
    onUpsertAppointment: (app: Partial<Appointment> & { id?: string }) => void;
    onCategoryDelete: (id: string) => void;
    onServiceDelete: (id: string) => void;
    onPatientDelete: (patient: Patient) => void;
    onExerciseDelete: (id: string) => void;
    onTherapistDelete: (id: string) => void;
    onAdminCancelAppointment: (app: Appointment) => void;
}

const Dashboard: React.FC<DashboardProps> = (props) => {
    const { currentUser, onLogout, notifications, therapists, setActiveChatPartner, activeChatPartner, setNotifications, theme, setTheme } = props;
    const [showNotifications, setShowNotifications] = useState(false);
    
    const currentUserNotifications = 'id' in currentUser ? notifications.filter(n => n.userId === currentUser.id).sort((a, b) => b.timestamp - a.timestamp) : [];
    const unreadCount = currentUserNotifications.filter(n => !n.read).length;

    const handleNotificationClick = (notification: Notification) => {
        const newNotifications = notifications.map(n => n.id === notification.id ? {...n, read: true} : n);
        setNotifications(newNotifications);
        setShowNotifications(false);
    };

    const handleStartChat = (partner: Patient | Therapist) => {
        setActiveChatPartner(partner);
    };

    const renderDashboard = () => {
        if ('patientIds' in currentUser) { // Therapist
            return <TherapistDashboard 
                therapist={currentUser} 
                patients={props.patients}
                programs={props.programs}
                appointments={props.appointments}
                messages={props.messages}
                therapists={props.therapists}
                onStartChat={handleStartChat}
                openModal={props.openModal}
                onUpsertAppointment={props.onUpsertAppointment}
            />;
        } else if ('therapistId' in currentUser) { // Patient
            const therapist = therapists.find(t => t.id === currentUser.therapistId);
            return <PatientDashboard 
                patient={currentUser}
                therapist={therapist}
                programs={props.programs}
                exercises={props.exercises}
                appointments={props.appointments}
                onStartChat={handleStartChat}
                onCompleteExercise={props.onCompleteExercise}
                onAddJournalEntry={props.onAddJournalEntry}
            />;
        } else { // Admin
             return <AdminDashboard {...props} />;
        }
    };

    return (
        <div className="app-container dashboard-view view-enter">
            <header className="dashboard-header">
                <div className="logo">Fizyoterapi Asistanı</div>
                <div className="header-user-info">
                    <ThemeSelector theme={theme} setTheme={setTheme} />
                    <span>Hoş Geldiniz, <strong>{currentUser.name}</strong></span>
                    <div className="notification-bell" onClick={() => setShowNotifications(!showNotifications)}>
                        🔔
                        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                    </div>
                    <button className="btn btn-secondary" onClick={onLogout}>Çıkış Yap</button>
                </div>
            </header>
            
            {showNotifications && (
                <NotificationPanel 
                    notifications={currentUserNotifications}
                    onNotificationClick={handleNotificationClick}
                />
            )}

            <main className="dashboard-main">
                {/* FIX: Add type guard to ensure currentUser is not Admin when rendering ChatInterface. */}
                {activeChatPartner && 'email' in currentUser ? (
                    <ChatInterface 
                        currentUser={currentUser}
                        activeChatPartner={activeChatPartner}
                        messages={props.messages}
                        onSendMessage={props.onSendMessage}
                        onBack={() => setActiveChatPartner(null)}
                    />
                ) : (
                    renderDashboard()
                )}
            </main>
        </div>
    );
};

export default Dashboard;