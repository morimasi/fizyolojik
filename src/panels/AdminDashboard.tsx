/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { Category, TherapyProgram, Patient, Exercise, Appointment, EditableItem, Therapist } from '../types';

interface AdminDashboardProps {
    categories: Category[];
    programs: TherapyProgram[];
    patients: Patient[];
    exercises: Exercise[];
    appointments: Appointment[];
    therapists: Therapist[];
    onCategoryDelete: (id: string) => void;
    onServiceDelete: (id: string) => void;
    onPatientDelete: (patient: Patient) => void;
    onExerciseDelete: (id: string) => void;
    onAdminCancelAppointment: (app: Appointment) => void;
    onResetData: () => void;
    openModal: (type: 'category' | 'service' | 'patient' | 'exercise', mode: 'add' | 'edit', item?: EditableItem | null) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    categories, programs, patients, exercises, appointments, therapists,
    onCategoryDelete, onServiceDelete, onPatientDelete, onExerciseDelete,
    onAdminCancelAppointment, onResetData, openModal
}) => {
    const [adminView, setAdminView] = useState<'services' | 'patients' | 'appointments' | 'exercises' | 'settings'>('services');

    return (
        <>
            <nav className="dashboard-nav">
                <button onClick={() => setAdminView('services')} className={`nav-btn ${adminView === 'services' ? 'active' : ''}`}>Programlar</button>
                <button onClick={() => setAdminView('exercises')} className={`nav-btn ${adminView === 'exercises' ? 'active' : ''}`}>Egzersiz Kütüphanesi</button>
                <button onClick={() => setAdminView('patients')} className={`nav-btn ${adminView === 'patients' ? 'active' : ''}`}>Danışanlar</button>
                <button onClick={() => setAdminView('appointments')} className={`nav-btn ${adminView === 'appointments' ? 'active' : ''}`}>Randevular</button>
                <button onClick={() => setAdminView('settings')} className={`nav-btn ${adminView === 'settings' ? 'active' : ''}`}>Ayarlar</button>
            </nav>
            {adminView === 'services' && (
                <div>
                    <div className="admin-actions">
                        <h3>Kategori Yönetimi</h3>
                        <button className="btn btn-success" onClick={() => openModal('category', 'add')}>+ Yeni Kategori Ekle</button>
                    </div>
                    {categories.length > 0 ? categories.map(cat => (
                        <div key={cat.id} className="admin-category-block">
                            <div className="admin-item-header">
                                <h4>{cat.name}</h4>
                                <div className="admin-item-actions">
                                    <button className="btn-action" onClick={() => openModal('category', 'edit', cat)}>Düzenle</button>
                                    <button className="btn-action btn-danger" onClick={() => onCategoryDelete(cat.id)}>Sil</button>
                                </div>
                            </div>
                            <div className="admin-actions-service">
                                <h5>Programlar</h5>
                                <button className="btn btn-primary btn-sm" onClick={() => openModal('service', 'add', { categoryId: cat.id })}>+ Program Ekle</button>
                            </div>
                            <ul className="admin-service-list">
                                {programs.filter(s => s.categoryId === cat.id).map(s => (
                                    <li key={s.id}>
                                        <span><strong>{s.name}:</strong> {s.description}</span>
                                        <div className="admin-item-actions">
                                            <button className="btn-action" onClick={() => openModal('service', 'edit', s)}>Düzenle</button>
                                            <button className="btn-action btn-danger" onClick={() => onServiceDelete(s.id)}>Sil</button>
                                        </div>
                                    </li>
                                ))}
                                {programs.filter(s => s.categoryId === cat.id).length === 0 && <p className="empty-list-text">Bu kategoride program bulunmuyor.</p>}
                            </ul>
                        </div>
                    )) : <p>Henüz kategori eklenmemiş.</p>}
                </div>
            )}
            {adminView === 'exercises' && (
                <div>
                    <div className="admin-actions">
                        <h3>Egzersiz Kütüphanesi</h3>
                        <button className="btn btn-success" onClick={() => openModal('exercise', 'add')}>+ Yeni Egzersiz Ekle</button>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>İsim</th>
                                <th>Açıklama</th>
                                <th>Set x Tekrar</th>
                                <th>Medya</th>
                                <th>Eylemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exercises.map(ex => (
                                <tr key={ex.id}>
                                    <td>{ex.name}</td>
                                    <td>{ex.description}</td>
                                    <td>{ex.sets} x {ex.reps}</td>
                                    <td className="media-icons">
                                        {ex.imageUrl && '🖼️'}
                                        {ex.videoUrl && '🎥'}
                                        {ex.audioUrl && '🔊'}
                                    </td>
                                    <td>
                                        <div className="admin-item-actions">
                                            <button className="btn-action" onClick={() => openModal('exercise', 'edit', ex)}>Düzenle</button>
                                            <button className="btn-action btn-danger" onClick={() => onExerciseDelete(ex.id)}>Sil</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {adminView === 'patients' && (
                <div>
                    <div className="admin-actions">
                        <h3>Tüm Danışanlar</h3>
                        <button className="btn btn-success" onClick={() => openModal('patient', 'add')}>+ Yeni Danışan Ekle</button>
                    </div>
                    <table className="data-table">
                        <thead><tr><th>İsim</th><th>E-posta</th><th>Terapist</th><th>Eylemler</th></tr></thead>
                        <tbody>
                            {patients.map(p => {
                                const therapist = therapists.find(t => t.id === p.therapistId);
                                return (<tr key={p.id}>
                                    <td>{p.name}</td>
                                    <td>{p.email}</td>
                                    <td>{therapist?.name || 'Atanmamış'}</td>
                                    <td>
                                        <div className="admin-item-actions">
                                            <button className="btn-action" onClick={() => openModal('patient', 'edit', p)}>Düzenle</button>
                                            <button className="btn-action btn-danger" onClick={() => onPatientDelete(p)}>Sil</button>
                                        </div>
                                    </td>
                                </tr>)
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            {adminView === 'appointments' && (
                <div>
                    <h3>Tüm Randevular</h3>
                    <table className="data-table">
                        <thead><tr><th>Danışan</th><th>Terapist</th><th>Tarih</th><th>Durum</th><th>Eylemler</th></tr></thead>
                        <tbody>
                            {[...appointments].sort((a, b) => b.start - a.start).map(app => {
                                const patient = patients.find(p => p.id === app.patientId);
                                const therapist = therapists.find(t => t.id === app.therapistId);
                                return (<tr key={app.id}>
                                    <td>{patient?.name || 'Bilinmiyor'}</td>
                                    <td>{therapist?.name || 'Bilinmiyor'}</td>
                                    <td>{new Date(app.start).toLocaleString('tr-TR')}</td>
                                    <td><span className={`status-badge status-${app.status}`}>{app.status}</span></td>
                                    <td>
                                        {app.status === 'scheduled' && <button className="btn-action btn-danger" onClick={() => onAdminCancelAppointment(app)}>İptal Et</button>}
                                    </td>
                                </tr>)
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            {adminView === 'settings' && (
                <div>
                    <h3>Uygulama Ayarları</h3>
                    <div className="settings-card">
                        <h4>Veri Yönetimi</h4>
                        <p>Uygulamayı orijinal demo durumuna sıfırlamak için aşağıdaki düğmeyi kullanın. Bu işlem tüm değişiklikleri geri alır.</p>
                        <button className="btn btn-danger" onClick={onResetData}>Demo Verilerini Sıfırla</button>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminDashboard;
