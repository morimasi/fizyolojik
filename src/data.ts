/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Category, Exercise, TherapyProgram, Therapist, Patient, Message, ClinicalNote, Appointment, Notification } from './types';

// --- MOCK DATA ---
export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat1', name: 'Ameliyat Sonrası Rehabilitasyon' },
  { id: 'cat2', name: 'Sporcu Sakatlıkları' },
  { id: 'cat3', name: 'Nörolojik Rehabilitasyon' },
];

export const MOCK_EXERCISES: Exercise[] = [
    { id: 'ex1', name: 'Diz Bükme ve Düzleştirme', description: 'Yatak kenarında oturarak bacağınızı yavaşça bükün ve düzleştirin.', sets: 3, reps: 15, videoUrl: 'https://storage.googleapis.com/assets.aistudio.google.com/Llama_Yoga.mp4' },
    { id: 'ex2', name: 'Topuk Kaydırma', description: 'Sırt üstü yatarken, topuğunuzu yatak üzerinde kalçanıza doğru yavaşça kaydırın.', sets: 3, reps: 15 },
    { id: 'ex3', name: 'Bacak Kaldırma', description: 'Sırt üstü yatarken, bir bacağınızı dizinizi bükmeden yavaşça yukarı kaldırın.', sets: 3, reps: 10, videoUrl: 'https://storage.googleapis.com/assets.aistudio.google.com/Llama_Yoga.mp4' },
    { id: 'ex4', name: 'Bilek Esnetme', description: 'Bir sandalyede otururken, etkilenen kolunuzu öne uzatın ve diğer elinizle bileğinizi yavaşça esnetin.', sets: 4, reps: 10 },
    { id: 'ex5', name: 'Statik Kuadriseps Egzersizi', description: 'Sırt üstü yatarken dizinizin altına rulo haline getirilmiş bir havlu koyun ve dizi aşağı bastırarak 5 saniye kasılı tutun.', sets: 3, reps: 20 },
    { id: 'ex6', name: 'Omuz Makarası', description: 'Bir kapıya takılan makara sistemi ile kollarınızı yavaşça yukarı ve aşağı hareket ettirin.', sets: 3, reps: 15 },
];

export const MOCK_PROGRAMS: TherapyProgram[] = [
  { id: 's1', categoryId: 'cat1', name: 'Diz Protezi Rehabilitasyonu', description: 'Diz protezi ameliyatı sonrası güç ve hareket kabiliyetini geri kazandırma programı.', exerciseIds: ['ex1', 'ex2', 'ex5'] },
  { id: 's2', categoryId: 'cat1', name: 'Kalça Protezi Rehabilitasyonu', description: 'Kalça protezi sonrası hastaların günlük yaşam aktivitelerine dönmesini hızlandıran program.', exerciseIds: ['ex2', 'ex3'] },
  { id: 's3', categoryId: 'cat2', name: 'Menisküs Yırtığı Tedavisi', description: 'Sporcularda sık görülen menisküs yırtıkları için cerrahi olmayan tedavi ve güçlendirme.', exerciseIds: ['ex1', 'ex5'] },
  { id: 's4', categoryId: 'cat2', name: 'Tenisçi Dirseği Tedavisi', description: 'Tekrarlayan kol hareketlerine bağlı ağrı ve hassasiyet için özel egzersizler.', exerciseIds: ['ex4'] },
  { id: 's5', categoryId: 'cat3', name: 'İnme Sonrası Fizik Tedavi', description: 'İnme geçirmiş hastaların motor becerilerini yeniden kazanmalarına yönelik kapsamlı rehabilitasyon.', exerciseIds: ['ex6'] },
];

export const MOCK_THERAPISTS: Therapist[] = [
  { id: 't1', name: 'Zeynep Kaya', email: 'zeynep@clinic.com', password: '1234', patientIds: ['p1', 'p2'], availability: [
      { day: 1, slots: [{ start: '09:00', end: '12:00'}, { start: '13:00', end: '17:00'}] }, // Pazartesi
      { day: 3, slots: [{ start: '10:00', end: '13:00'}] }, // Çarşamba
      { day: 5, slots: [{ start: '09:00', end: '16:00'}] }, // Cuma
  ]},
  { id: 't2', name: 'Ahmet Çelik', email: 'ahmet@clinic.com', password: '1234', patientIds: [], availability: [] },
];

export const MOCK_PATIENTS: Patient[] = [
  { id: 'p1', name: 'Ayşe Yılmaz', email: 'ayse@example.com', password: '1234', therapistId: 't1', serviceIds: ['s1', 's4'], progress: { 'ex1': 'completed', 'ex2': 'todo', 'ex5': 'todo', 'ex4': 'todo' } },
  { id: 'p2', name: 'Mehmet Öztürk', email: 'mehmet@example.com', password: '1234', therapistId: 't1', serviceIds: ['s3'], progress: { 'ex1': 'todo', 'ex5': 'todo' } },
];

export const MOCK_MESSAGES: Message[] = [
    { id: 'm1', from: 'p1', to: 't1', text: 'Merhaba Zeynep Hanım, dizimdeki ağrı son egzersizden sonra biraz arttı. Bu normal mi?', timestamp: Date.now() - 200000 },
    { id: 'm2', from: 't1', to: 'p1', text: 'Merhaba Ayşe Hanım. Egzersiz sonrası hafif bir hassasiyet beklenen bir durum olabilir. Ancak ağrınız keskin veya sürekli ise durumu daha detaylı değerlendirmemiz gerekir. Ağrıyı 1-10 arasında derecelendirir misiniz?', timestamp: Date.now() - 100000 },
    { id: 'm3', from: 'p1', to: 't1', text: 'Yaklaşık 4 gibi diyebilirim. Özellikle merdiven çıkarken hissediyorum.', timestamp: Date.now() - 50000 },
];

export const MOCK_NOTES: ClinicalNote[] = [
    { id: 'cn1', patientId: 'p1', therapistId: 't1', text: 'Danışan, ilk hafta egzersizlerine düzenli olarak devam ettiğini belirtti. Merdiven çıkarken hafif ağrı şikayeti devam ediyor. Statik kuadriseps egzersizine odaklanması önerildi.', timestamp: Date.now() - 300000 },
];

export const getTomorrowAt = (hour: number) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hour, 0, 0, 0);
    return tomorrow.getTime();
}

export const MOCK_APPOINTMENTS: Appointment[] = [
    { id: 'app1', patientId: 'p1', therapistId: 't1', start: getTomorrowAt(10), end: getTomorrowAt(10) + 30 * 60 * 1000, status: 'scheduled' }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
    { id: 'n1', userId: 't1', text: "Mehmet Öztürk'ten yeni bir mesajınız var.", timestamp: Date.now() - 600000, read: true, link: { view: 'patient-chat', contextId: 'p2'} },
];
