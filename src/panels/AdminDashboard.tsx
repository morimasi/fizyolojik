/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { Category, TherapyProgram, Patient, Exercise, Appointment, EditableItem, Therapist } from '../types';
import { useCountUp } from '../hooks/useCountUp';
import EmptyState from '../components/EmptyState';

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
    onTherapistDelete: (id: string) => void;
    onAdminCancelAppointment: (app: Appointment) => void;
    onResetData: () => void;
    openModal: (type: 'category' | 'service' | 'patient' | 'exercise' | 'therapist', mode: 'add' | 'edit', item?: EditableItem | null) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    categories, programs, patients, exercises, appointments, therapists,
    onCategoryDelete, onServiceDelete, onPatientDelete, onExerciseDelete, onTherapistDelete,
    onAdminCancelAppointment, onResetData, openModal
}) => {
    const [adminView, setAdminView] = useState<'summary' | 'services' | 'patients' | 'appointments' | 'exercises' | 'therapists' | 'settings'>('summary');
    
    const AnimatedStat = ({ value, label }: { value: number; label: string }) => {
        const count = useCountUp(value, 1500);
        return (
            <div className="dashboard-card">
                <h4>{label}</h4>
                <p className="summary-stat animated">{count}</p>
            </div>
        );
    };
    
    const renderSummary = () => {
        const therapistPatientCounts = therapists.map(therapist => ({
            name: therapist.name,
            count: patients.filter(p => p.therapistId === therapist.id).length
        }));
        const maxPatients = Math.max(...therapistPatientCounts.map(t => t.count), 1);

        const programPopularity = programs.map(program => ({
            name: program.name,
            count: patients.filter(p => p.serviceIds.includes(program.id)).length
        })).sort((a,b) => b.count - a.count).slice(0, 5);
        const maxEnrollments = Math.max(...programPopularity.map(p => p.count), 1);

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const completedAppointmentsLastMonth = appointments.filter(a => a.status === 'completed' && a.start > oneMonthAgo.getTime()).length;

        return (
            <div>
                <h3>Klinik Analitiği</h3>
                 <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '2rem' }}>
                    <AnimatedStat value={patients.length} label="Toplam Danışan" />
                    <AnimatedStat value={therapists.length} label="Toplam Terapist" />
                    <AnimatedStat value={completedAppointmentsLastMonth} label="Son Ayda Biten Randevular" />
                </div>
                 <div className="dashboard-grid admin-summary-grid">
                    <div className="dashboard-card">
                        <h4>Terapist Başına Danışan Dağılımı</h4>
                        {therapists.length > 0 ? (
                            <div className="bar-chart">
                                {therapistPatientCounts.map(item => (
                                    <div className="bar-item" key={item.name}>
                                        <span className="bar-label">{item.name}</span>
                                        <div className="bar-wrapper">
                                            <div className="bar" style={{width: `${(item.count / maxPatients) * 100}%`}}>
                                                {item.count}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="empty-list-text">Terapist bulunmuyor.</p>}
                    </div>
                    <div className="dashboard-card">
                        <h4>En Popüler Programlar</h4>
                        {programs.length > 0 ? (
                            <div className="bar-chart">
                                {programPopularity.map(item => (
                                    <div className="bar-item" key={item.name}>
                                        <span className="bar-label">{item.name}</span>
                                        <div className="bar-wrapper">
                                            <div className="bar" style={{width: `${(item.count / maxEnrollments) * 100}%`}}>
                                                {item.count}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ): <p className="empty-list-text">Program bulunmuyor.</p>}
                    </div>
                </div>
            </div>
        );
    }


    return (
        <>
            <nav className="dashboard-nav">
                <button onClick={() => setAdminView('summary')} className={`nav-btn ${adminView === 'summary' ? 'active' : ''}`}>Genel Bakış</button>
                <button onClick={() => setAdminView('services')} className={`nav-btn ${adminView === 'services' ? 'active' : ''}`}>Programlar</button>
                <button onClick={() => setAdminView('exercises')} className={`nav-btn ${adminView === 'exercises' ? 'active' : ''}`}>Egzersizler</button>
                <button onClick={() => setAdminView('patients')} className={`nav-btn ${adminView === 'patients' ? 'active' : ''}`}>Danışanlar</button>
                <button onClick={() => setAdminView('therapists')} className={`nav-btn ${adminView === 'therapists' ? 'active' : ''}`}>Terapistler</button>
                <button onClick={() => setAdminView('appointments')} className={`nav-btn ${adminView === 'appointments' ? 'active' : ''}`}>Randevular</button>
                <button onClick={() => setAdminView('settings')} className={`nav-btn ${adminView === 'settings' ? 'active' : ''}`}>Ayarlar</button>
            </nav>

            {adminView === 'summary' && renderSummary()}
            {adminView === 'services' && (
                <div>
                    <div className="admin-actions">
                        <h3>Kategori ve Program Yönetimi</h3>
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
                    )) : <EmptyState 
                            title="Henüz Kategori Eklenmemiş"
                            message="Danışanlar için programlar oluşturmaya başlamak için ilk kategorinizi ekleyin."
                            actionText="+ Kategori Ekle"
                            onAction={() => openModal('category', 'add')}
                         />}
                </div>
            )}
            {adminView === 'exercises' && (
                <div>
                    <div className="admin-actions">
                        <h3>Egzersiz Kütüphanesi</h3>
                        <button className="btn btn-success" onClick={() => openModal('exercise', 'add')}>+ Yeni Egzersiz Ekle</button>
                    </div>
                    {exercises.length > 0 ? (
                        <table className="data-table">
                            <thead><tr><th>İsim</th><th>Set x Tekrar</th><th>Medya</th><th>Eylemler</th></tr></thead>
                            <tbody>
                                {exercises.map(ex => (
                                    <tr key={ex.id}>
                                        <td>{ex.name}</td>
                                        <td>{ex.sets} x {ex.reps}</td>
                                        <td className="media-icons">
                                            {ex.imageUrl && '🖼️'} {ex.videoUrl && '🎥'} {ex.audioUrl && '🔊'}
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
                    ) : (
                         <EmptyState 
                            title="Egzersiz Kütüphanesi Boş"
                            message="Programlara eklemek için yeni egzersizler oluşturun. Yapay zeka yardımcısını kullanabilirsiniz!"
                            actionText="+ Egzersiz Ekle"
                            onAction={() => openModal('exercise', 'add')}
                         />
                    )}
                </div>
            )}
            {adminView === 'patients' && (
                <div>
                    <div className="admin-actions">
                        <h3>Danışan Yönetimi</h3>
                        <button className="btn btn-success" onClick={() => openModal('patient', 'add')}>+ Yeni Danışan Ekle</button>
                    </div>
                    {patients.length > 0 ? (
                        <table className="data-table">
                            <thead><tr><th>İsim</th><th>E-posta</th><th>Terapist</th><th>Eylemler</th></tr></thead>
                            <tbody>
                                {patients.map(p => (<tr key={p.id}>
                                        <td>{p.name}</td>
                                        <td>{p.email}</td>
                                        <td>{therapists.find(t => t.id === p.therapistId)?.name || 'Atanmamış'}</td>
                                        <td>
                                            <div className="admin-item-actions">
                                                <button className="btn-action" onClick={() => openModal('patient', 'edit', p)}>Düzenle</button>
                                                <button className="btn-action btn-danger" onClick={() => onPatientDelete(p)}>Sil</button>
                                            </div>
                                        </td>
                                </tr>))}
                            </tbody>
                        </table>
                    ) : ( <EmptyState title="Henüz Danışan Yok" message="Platforma ilk danışanınızı ekleyerek başlayın." actionText="+ Danışan Ekle" onAction={() => openModal('patient', 'add')} /> )}
                </div>
            )}
             {adminView === 'therapists' && (
                <div>
                    <div className="admin-actions">
                        <h3>Terapist Yönetimi</h3>
                        <button className="btn btn-success" onClick={() => openModal('therapist', 'add')}>+ Yeni Terapist Ekle</button>
                    </div>
                    {therapists.length > 0 ? (
                        <table className="data-table">
                            <thead><tr><th>İsim</th><th>E-posta</th><th>Danışan Sayısı</th><th>Eylemler</th></tr></thead>
                            <tbody>
                                {therapists.map(t => (<tr key={t.id}>
                                        <td>{t.name}</td>
                                        <td>{t.email}</td>
                                        <td>{patients.filter(p => p.therapistId === t.id).length}</td>
                                        <td>
                                            <div className="admin-item-actions">
                                                <button className="btn-action" onClick={() => openModal('therapist', 'edit', t)}>Düzenle</button>
                                                <button className="btn-action btn-danger" onClick={() => onTherapistDelete(t.id)}>Sil</button>
                                            </div>
                                        </td>
                                </tr>))}
                            </tbody>
                        </table>
                    ) : ( <EmptyState title="Henüz Terapist Yok" message="Platforma ilk terapistinizi ekleyerek başlayın." actionText="+ Terapist Ekle" onAction={() => openModal('therapist', 'add')} /> )}
                </div>
            )}
            {adminView === 'appointments' && (
                <div>
                    <h3>Tüm Randevular</h3>
                     {appointments.length > 0 ? (
                        <table className="data-table">
                            <thead><tr><th>Danışan</th><th>Terapist</th><th>Tarih</th><th>Durum</th><th>Eylemler</th></tr></thead>
                            <tbody>
                                {[...appointments].sort((a, b) => b.start - a.start).map(app => (<tr key={app.id}>
                                        <td>{patients.find(p => p.id === app.patientId)?.name || 'Bilinmiyor'}</td>
                                        <td>{therapists.find(t => t.id === app.therapistId)?.name || 'Bilinmiyor'}</td>
                                        <td>{new Date(app.start).toLocaleString('tr-TR')}</td>
                                        <td><span className={`status-badge status-${app.status}`}>{app.status}</span></td>
                                        <td>
                                            {app.status === 'scheduled' && <button className="btn-action btn-danger" onClick={() => onAdminCancelAppointment(app)}>İptal Et</button>}
                                        </td>
                                </tr>))}
                            </tbody>
                        </table>
                     ) : <EmptyState title="Randevu Bulunmuyor" message="Sistemde henüz planlanmış veya tamamlanmış bir randevu yok." />}
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