/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { Appointment, EditableItem, Patient, Therapist } from '../types';

interface TherapistCalendarProps {
    therapist: Therapist;
    appointments: Appointment[];
    patients: Patient[];
    openModal: (type: 'appointment', mode: 'add' | 'edit', item?: EditableItem | null) => void;
}

const TherapistCalendar: React.FC<TherapistCalendarProps> = ({ therapist, appointments, patients, openModal }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getWeekDays = (date: Date): Date[] => {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Monday start
        return Array.from({ length: 7 }).map((_, i) => {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            return day;
        });
    };

    const weekDays = getWeekDays(currentDate);
    const today = new Date();
    const timeSlots = Array.from({ length: 18 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`); // 8 AM to 9 PM

    const changeWeek = (amount: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + 7 * amount);
        setCurrentDate(newDate);
    };

    const handleSlotClick = (day: Date, hour: number, minute: number) => {
        const start = new Date(day);
        start.setHours(hour, minute, 0, 0);
        openModal('appointment', 'add', { therapistId: therapist.id, start: start.getTime() });
    };

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <button onClick={() => changeWeek(-1)}>&lt; Önceki</button>
                <h4>{weekDays[0].toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</h4>
                <button onClick={() => changeWeek(1)}>Sonraki &gt;</button>
            </div>
            <div className="calendar-grid">
                <div className="time-column">
                    {timeSlots.map(time => <div key={time} className="time-label">{time}</div>)}
                </div>
                {weekDays.map(day => {
                    const isToday = day.toDateString() === today.toDateString();
                    const dayAppointments = appointments.filter(app => {
                        const appDate = new Date(app.start);
                        return appDate.toDateString() === day.toDateString();
                    });

                    return (
                        <div key={day.toISOString()} className={`day-column ${isToday ? 'today' : ''}`}>
                            <div className="day-header">
                                <strong>{day.toLocaleDateString('tr-TR', { weekday: 'short' })}</strong>
                                <span>{day.getDate()}</span>
                            </div>
                            <div className="slots-container">
                                {Array.from({length: 36}).map((_, i) => {
                                    const hour = 8 + Math.floor(i/2);
                                    const minute = (i % 2) * 30;
                                    return <div key={i} className="empty-slot" style={{top: `${i * 30}px`}} onClick={() => handleSlotClick(day, hour, minute)} />
                                })}
                                {dayAppointments.map(app => {
                                    const start = new Date(app.start);
                                    const end = new Date(app.end);
                                    const startHour = start.getHours();
                                    const startMinute = start.getMinutes();
                                    const endHour = end.getHours();
                                    const endMinute = end.getMinutes();

                                    const top = (startHour - 8) * 60 + startMinute;
                                    const duration = ((endHour * 60 + endMinute) - (startHour * 60 + startMinute));

                                    const patientName = patients.find(p => p.id === app.patientId)?.name || 'Bilinmeyen Danışan';
                                    
                                    return (
                                        <div 
                                            key={app.id} 
                                            className={`appointment-slot status-${app.status}`} 
                                            style={{ top: `${top}px`, height: `${duration}px`}}
                                            title={`${patientName}\n${start.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} - ${end.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`}
                                            onClick={() => openModal('appointment', 'edit', app)}
                                        >
                                            <strong>{patientName}</strong>
                                            <span>{app.notes}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TherapistCalendar;