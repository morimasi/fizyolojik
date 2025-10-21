/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
// FIX: Added Admin type to import
import { Appointment, Category, ClinicalNote, EditableItem, Exercise, Message, Notification, Patient, TherapyProgram, Therapist, User, Admin } from '../types';

import AdminDashboard from '../panels/AdminDashboard';
import TherapistDashboard from '../panels/TherapistDashboard';
import PatientDashboard from '../panels/PatientDashboard';
import ChatInterface from '../components/ChatInterface';
import NotificationPanel from '../components/NotificationPanel';


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
    onLogout: () => void;
    onResetData: () => void;
    openModal: (type: 'category' | 'service' | 'patient' | 'exercise' | 'therapist' | 'clinicalNote', mode: 'add' | 'edit', item?: EditableItem | null) => void;
    onSendMessage: (text: string, file?: File | null) => void;
    activeChatPartner: Patient | Therapist | null;
    setActiveChatPartner: React.Dispatch<React.SetStateAction<Patient | Therapist | null>>;
    setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
    setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    onCompleteExercise: (patientId: string, exerciseId: string) => void;
    onCategoryDelete: (id: string) => void;
    onServiceDelete: (id: string) => void;
    onPatientDelete: (patient: Patient) => void;
    onExerciseDelete: (id: string) => void;
    onTherapistDelete: (id: string) => void;
    onAdminCancelAppointment: (app: Appointment) => void;
}

const Dashboard: React.FC<DashboardProps> = (props) => {
    const { currentUser, onLogout, notifications, therapists, patients, setActiveChatPartner, activeChatPartner, setNotifications } = props;
    const [showNotifications, setShowNotifications] = useState(false);
    
    useEffect(() => {
        // Auto update appointment status
        const now = Date.now();
        const updatedAppointments = props.appointments.map(app => {
            if (app.status === 'scheduled' && now > app.end) {
                // Send notification to therapist
                 const newNotification: Notification = {
                    id: crypto.randomUUID(),
                    userId: app.therapistId,
                    text: `Danışanınız ${patients.find(p=>p.id === app.patientId)?.name} ile olan randevunuz tamamlandı. Klinik not eklemeyi unutmayın.`,
                    timestamp: now,
                    read: false,
                };
                setNotifications(prev => [...prev, newNotification]);
                return { ...app, status: 'completed' as const };
            }
            return app;
        });

        // Auto send reminders
        updatedAppointments.forEach(app => {
            const twentyFourHours = 24 * 60 * 60 * 1000;
            if (app.status === 'scheduled' && !app.reminderSent && app.start > now && (app.start - now < twentyFourHours)) {
                 const patientNotification: Notification = { id: crypto.randomUUID(), userId: app.patientId, text: `Yaklaşan randevunuz yarın saat ${new Date(app.start).toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})}'de.`, timestamp: now, read: false };
                 const therapistNotification: Notification = { id: crypto.randomUUID(), userId: app.therapistId, text: `${patients.find(p=>p.id === app.patientId)?.name} ile yarın saat ${new Date(app.start).toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})}'de randevunuz var.`, timestamp: now, read: false };
                 setNotifications(prev => [...prev, patientNotification, therapistNotification]);
                 app.reminderSent = true;
            }
        });

        if (JSON.stringify(updatedAppointments) !== JSON.stringify(props.appointments)) {
            props.setAppointments(updatedAppointments);
        }

    }, [props.appointments, props.setAppointments, setNotifications, patients]);


    const currentUserNotifications = 'id' in currentUser ? notifications.filter(n => n.userId === currentUser.id).sort((a, b) => b.timestamp - a.timestamp) : [];
    const unreadCount = currentUserNotifications.filter(n => !n.read).length;

    const handleNotificationClick = (notification: Notification) => {
        setNotifications(prev => prev.map(n => n.id === notification.id ? {...n, read: true} : n));
        setShowNotifications(false);
    };

    const handleStartChat = (partner: Patient | Therapist) => {
        setActiveChatPartner(partner);
    };

    const renderDashboard = () => {
        if ('patientIds' in currentUser) { // Therapist
            // FIX: Passed missing 'messages' and 'therapists' props.
            return <TherapistDashboard 
                therapist={currentUser} 
                patients={props.patients}
                programs={props.programs}
                messages={props.messages}
                therapists={props.therapists}
                onStartChat={handleStartChat}
                openModal={props.openModal}
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
                setAppointments={props.setAppointments}
                onCompleteExercise={props.onCompleteExercise}
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