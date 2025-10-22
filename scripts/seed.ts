import postgres from 'postgres';
import { Therapist, Patient, Category, TherapyProgram, Exercise, Appointment, Message, Notification, Testimonial, FAQItem, ClinicalNote } from '../src/types';

const therapist1Id = 'therapist-1';
const therapist2Id = 'therapist-2';
const patient1Id = 'patient-1';
const patient2Id = 'patient-2';
const patient3Id = 'patient-3';
const patient4Id = 'patient-4';
const category1Id = 'cat-1';
const category2Id = 'cat-2';
const program1Id = 'prog-1';
const program2Id = 'prog-2';
const program3Id = 'prog-3';
const exercise1Id = 'ex-1';
const exercise2Id = 'ex-2';
const exercise3Id = 'ex-3';
const exercise4Id = 'ex-4';

const MOCK_THERAPISTS: Therapist[] = [
    { id: therapist1Id, name: 'Dr. Elif Yılmaz', email: 'elif@terapi.com', patientIds: [patient1Id, patient2Id], profileImageUrl: 'https://storage.googleapis.com/gemini-ui-params/fpt/therapist1.png', bio: 'Spor yaralanmaları ve ortopedik rehabilitasyon konusunda uzmanlaşmış deneyimli fizyoterapist.', },
    { id: therapist2Id, name: 'Dr. Ahmet Kaya', email: 'ahmet@terapi.com', patientIds: [patient3Id, patient4Id], profileImageUrl: 'https://storage.googleapis.com/gemini-ui-params/fpt/therapist2.png', bio: 'Nörolojik rehabilitasyon ve kronik ağrı yönetimi alanlarında 10 yıllık tecrübeye sahip.', }
];
const MOCK_CLINICAL_NOTES: ClinicalNote[] = [
    { id: 'note-1', therapistId: therapist1Id, date: new Date('2024-05-22').getTime(), subjective: 'Danışan, dizinde özellikle sabahları artan bir ağrı olduğunu ve merdiven çıkarken zorlandığını belirtiyor.', objective: 'Diz eklem hareket açıklığında hafif kısıtlılık, 10 derece fleksiyon kaybı. Palpasyonda medial menisküs hattında hassasiyet.', assessment: 'Menisküs irritasyonu ile uyumlu bulgular. Danışanın egzersiz programına uyumu iyi, ancak ağrı yönetimi stratejileri eklenmeli.', plan: 'Ağrı yönetimi için soğuk uygulama önerildi. Egzersiz programına quadriseps güçlendirme odaklı yeni hareketler eklenecek. Bir sonraki seans 1 hafta sonra.', }
];
const MOCK_PATIENTS: Patient[] = [
    { id: patient1Id, name: 'Ayşe Demir', email: 'ayse@mail.com', therapistId: therapist1Id, serviceIds: [program1Id], painJournal: [ { date: new Date('2024-05-20').getTime(), painLevel: 7, note: 'Sabah kalktığımda dizim çok ağrıyordu.' }, { date: new Date('2024-05-21').getTime(), painLevel: 6, note: 'Egzersiz sonrası biraz rahatladı.' }, { date: new Date('2024-05-22').getTime(), painLevel: 6, note: 'Bugün daha iyi hissediyorum.' }, { date: new Date('2024-05-23').getTime(), painLevel: 5, note: 'Yürüyüş yapabildim.' }, ], exerciseLog: { '2024-05-21': [exercise1Id], '2024-05-22': [exercise1Id, exercise2Id], '2024-05-23': [exercise1Id, exercise2Id], }, clinicalNotes: MOCK_CLINICAL_NOTES, },
    { id: patient2Id, name: 'Mehmet Öztürk', email: 'mehmet@mail.com', therapistId: therapist1Id, serviceIds: [program2Id], painJournal: [], exerciseLog: {}, clinicalNotes: [], },
    { id: patient3Id, name: 'Fatma Şahin', email: 'fatma@mail.com', therapistId: therapist2Id, serviceIds: [program3Id], painJournal: [ { date: new Date('2024-05-19').getTime(), painLevel: 8, note: 'Bel ağrım çok şiddetliydi.' }, { date: new Date('2024-05-21').getTime(), painLevel: 7, note: 'Isı uygulaması iyi geldi.' }, ], exerciseLog: {}, clinicalNotes: [], },
    { id: patient4Id, name: 'Mustafa Can', email: 'mustafa@mail.com', therapistId: therapist2Id, serviceIds: [program1Id, program2Id], painJournal: [], exerciseLog: {}, clinicalNotes: [], },
];
const MOCK_CATEGORIES: Category[] = [ { id: category1Id, name: 'Ortopedik Rehabilitasyon' }, { id: category2Id, name: 'Nörolojik Rehabilitasyon' } ];
const MOCK_EXERCISES: Exercise[] = [
    { id: exercise1Id, name: 'Diz Ekstansiyonu (Oturarak)', description: 'Bir sandalyeye oturun ve sırtınızı dik tutun. Bir bacağınızı yavaşça yukarı doğru kaldırarak düzleştirin, birkaç saniye bu pozisyonda kalın ve yavaşça indirin. Hareketi diğer bacağınızla tekrarlayın.', sets: 3, reps: 10, imageUrl: 'https://storage.googleapis.com/gemini-ui-params/fpt/exercise1.png', videoUrl: 'https://storage.googleapis.com/gemini-ui-params/fpt/exercise_video.mp4' },
    { id: exercise2Id, name: 'Köprü Kurma', description: 'Sırt üstü uzanın, dizlerinizi bükün ve ayaklarınızı kalça genişliğinde açarak yere basın. Kalçanızı yavaşça yukarı kaldırarak vücudunuzla omuzlarınızdan dizlerinize kadar düz bir çizgi oluşturun. Tepe noktada birkaç saniye bekleyin ve yavaşça başlangıç pozisyonuna dönün.', sets: 3, reps: 12, imageUrl: 'https://storage.googleapis.com/gemini-ui-params/fpt/exercise2.png', },
    { id: exercise3Id, name: 'Kedi-Deve Esnemesi', description: 'Elleriniz ve dizleriniz üzerinde dört ayak pozisyonunda başlayın. Nefes alırken sırtınızı yukarı doğru yuvarlayarak kamburlaştırın (kedi). Nefes verirken sırtınızı aşağı doğru indirerek çukurlaştırın (deve). Hareketi yavaş ve kontrollü bir şekilde tekrarlayın.', sets: 2, reps: 15, imageUrl: 'https://storage.googleapis.com/gemini-ui-params/fpt/exercise3.png', },
    { id: exercise4Id, name: 'Omuz Fleksiyonu (Duvarda)', description: 'Sırtınız duvara dönük şekilde ayakta durun. Kollarınızı düz bir şekilde omuz hizasında yanlara doğru açın. Yavaşça kollarınızı yukarı doğru kaydırarak başınızın üzerine getirin ve başlangıç pozisyonuna dönün.', sets: 3, reps: 10, imageUrl: 'https://storage.googleapis.com/gemini-ui-params/fpt/exercise4.png', }
];
const MOCK_PROGRAMS: TherapyProgram[] = [
    { id: program1Id, name: 'Diz Güçlendirme Programı', description: 'Diz ameliyatı sonrası güçlenme ve hareket kabiliyetini artırma odaklı program.', categoryId: category1Id, exerciseIds: [exercise1Id, exercise2Id] },
    { id: program2Id, name: 'Omuz Hareket Programı', description: 'Donuk omuz sendromu için esneklik ve hareket açıklığını geliştirmeye yönelik egzersizler.', categoryId: category1Id, exerciseIds: [exercise4Id] },
    { id: program3Id, name: 'Bel Ağrısı Yönetimi', description: 'Kronik bel ağrısını azaltmak ve omurga esnekliğini artırmak için temel egzersizler.', categoryId: category2Id, exerciseIds: [exercise2Id, exercise3Id] }
];
const now = new Date();
const MOCK_APPOINTMENTS: Appointment[] = [
    { id: 'app-1', patientId: patient1Id, therapistId: therapist1Id, start: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 10, 0).getTime(), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 10, 30).getTime(), status: 'scheduled', notes: 'Haftalık kontrol ve ilerleme değerlendirmesi.' },
    { id: 'app-2', patientId: patient3Id, therapistId: therapist2Id, start: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 14, 0).getTime(), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 14, 30).getTime(), status: 'scheduled' },
    { id: 'app-3', patientId: patient1Id, therapistId: therapist1Id, start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5, 11, 0).getTime(), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5, 11, 30).getTime(), status: 'completed', notes: 'Danışan egzersizleri doğru formda yapıyor, ağrıda azalma var.' },
    { id: 'app-4', patientId: patient2Id, therapistId: therapist1Id, start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0).getTime(), end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30).getTime(), status: 'scheduled', notes: 'İlk değerlendirme seansı.' },
];
const MOCK_MESSAGES: Message[] = [
    { id: 'msg-1', from: patient1Id, to: therapist1Id, text: 'Merhaba Elif Hanım, diz egzersizlerini yaparken biraz zorlanıyorum, normal midir?', timestamp: new Date().getTime() - 86400000 * 2 },
    { id: 'msg-2', from: therapist1Id, to: patient1Id, text: 'Merhaba Ayşe Hanım, başlangıçta hafif bir zorlanma normaldir. Ağrınız artarsa lütfen hemen bildirin. Bir sonraki seansımızda hareket formunuzu tekrar kontrol edelim.', timestamp: new Date().getTime() - 86400000 * 1.9 },
];
const MOCK_NOTIFICATIONS: Notification[] = [
    { id: 'notif-1', userId: patient1Id, text: 'Yaklaşan randevunuz: Dr. Elif Yılmaz ile 2 gün sonra saat 10:00\'da.', timestamp: new Date().getTime() - 3600000, read: true },
    { id: 'notif-2', userId: therapist1Id, text: 'Ayşe Demir yeni bir mesaj gönderdi.', timestamp: new Date().getTime() - 86400000 * 2, read: false }
];
const MOCK_TESTIMONIALS: Testimonial[] = [
    { id: 'test-1', quote: "Bu platform sayesinde diz ameliyatım sonrası iyileşme sürecim inanılmaz hızlandı. Terapistimle sürekli iletişimde olmak bana çok güven verdi. Egzersiz takvimi özelliği ise motivasyonumu hep yüksek tuttu.", author: 'Ayşe Y.' },
    { id: 'test-2', quote: "Spor yaparken yaşadığım sakatlık sonrası ne yapacağımı bilemiyordum. Fizyoterapi Asistanı ile hem doğru egzersizlere ulaştım hem de motivasyonumu hiç kaybetmedim. Yapay zeka destekli videolar harikaydı.", author: 'Mehmet Ö.' },
    { id: 'test-3', quote: "Yoğun iş temposunda kliniğe gitmeye vaktim olmuyordu. Evden, kendi programıma göre terapi alabilmek harika bir kolaylık. Terapistimin SOAP notları sayesinde ilerlememi net bir şekilde görebiliyorum. Kesinlikle tavsiye ederim.", author: 'Elif K.' },
    { id: 'test-4', quote: "Kronik bel ağrılarım için başvurdum. Platformdaki kişiselleştirilmiş program ve terapistimin anlık geri bildirimleri sayesinde ağrılarımda ciddi bir azalma oldu. Dijital ağrı günlüğü çok faydalıydı.", author: 'Mustafa C.' }
];
const MOCK_FAQS: FAQItem[] = [
    { id: 'faq-1', question: 'Platforma nasıl kayıt olabilirim?', answer: 'Ana sayfadaki "Hemen Başla" butonuna tıklayarak danışan rolünü seçebilir ve adımları takip ederek kolayca kayıt olabilirsiniz.' },
    { id: 'faq-2', question: 'Terapistimi nasıl seçebilirim?', answer: 'Kayıt olduktan sonra, sistem şikayetlerinize en uygun terapisti size otomatik olarak atayacaktır. Terapistlerimiz sayfasından tüm uzmanlarımızı inceleyebilirsiniz.' },
    { id: 'faq-3', question: 'Egzersiz programımı nerede görebilirim?', answer: 'Danışan olarak giriş yaptığınızda, "Programlarım" sekmesi altında size atanmış olan tüm egzersiz programlarını ve detaylarını bulabilirsiniz.' },
    { id: 'faq-4', question: 'Ödemeler güvenli mi?', answer: 'Evet, tüm ödeme işlemleri endüstri standardı şifreleme yöntemleriyle korunmaktadır. Güvenliğiniz bizim için en önemli önceliktir.' },
    { id: 'faq-5', question: 'Randevumu nasıl iptal edebilirim?', answer: 'Danışan panelinizdeki "Randevularım" bölümünden yaklaşan randevularınızı görebilir ve randevudan en az 24 saat önce iptal etme veya yeniden planlama talebinde bulunabilirsiniz.' }
];

export async function seed(sql: postgres.Sql) {
    await sql.begin(async (sql) => {
        await sql`
            INSERT INTO therapists ${sql(MOCK_THERAPISTS.map(t => ({
                id: t.id,
                name: t.name,
                email: t.email,
                profile_image_url: t.profileImageUrl,
                bio: t.bio,
                patient_ids: t.patientIds as any,
            })))}
            ON CONFLICT (id) DO NOTHING;
        `;
        await sql`
            INSERT INTO patients ${sql(MOCK_PATIENTS.map(p => ({
                id: p.id,
                name: p.name,
                email: p.email,
                therapist_id: p.therapistId,
                service_ids: p.serviceIds as any,
                pain_journal: p.painJournal as any,
                exercise_log: p.exerciseLog as any,
                clinical_notes: p.clinicalNotes as any,
            })))}
            ON CONFLICT (id) DO NOTHING;
        `;
        await sql`
            INSERT INTO categories ${sql(MOCK_CATEGORIES)}
            ON CONFLICT (id) DO NOTHING;
        `;
        await sql`
            INSERT INTO exercises ${sql(MOCK_EXERCISES.map(e => ({
                id: e.id,
                name: e.name,
                description: e.description,
                sets: e.sets,
                reps: e.reps,
                image_url: e.imageUrl,
                video_url: e.videoUrl,
                audio_url: e.audioUrl,
            })))}
            ON CONFLICT (id) DO NOTHING;
        `;
        await sql`
            INSERT INTO therapy_programs ${sql(MOCK_PROGRAMS.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                category_id: p.categoryId,
                exercise_ids: p.exerciseIds as any,
            })))}
            ON CONFLICT (id) DO NOTHING;
        `;
        await sql`
            INSERT INTO appointments ${sql(MOCK_APPOINTMENTS.map(a => ({
                id: a.id,
                patient_id: a.patientId,
                therapist_id: a.therapistId,
                start_time: a.start,
                end_time: a.end,
                status: a.status,
                notes: a.notes,
                reminder_sent: a.reminderSent,
            })))}
            ON CONFLICT (id) DO NOTHING;
        `;
        await sql`
            INSERT INTO messages ${sql(MOCK_MESSAGES.map(m => ({
                id: m.id,
                from_user_id: m.from,
                to_user_id: m.to,
                text_content: m.text,
                timestamp: m.timestamp,
                file_data: m.file || null as any,
            })))}
            ON CONFLICT (id) DO NOTHING;
        `;
        await sql`
            INSERT INTO notifications ${sql(MOCK_NOTIFICATIONS.map(n => ({
                id: n.id,
                user_id: n.userId,
                text_content: n.text,
                timestamp: n.timestamp,
                is_read: n.read,
            })))}
            ON CONFLICT (id) DO NOTHING;
        `;
         await sql`
            INSERT INTO testimonials ${sql(MOCK_TESTIMONIALS)}
            ON CONFLICT (id) DO NOTHING;
        `;
        await sql`
            INSERT INTO faqs ${sql(MOCK_FAQS)}
            ON CONFLICT (id) DO NOTHING;
        `;
    });
    console.log('Database seeded successfully in a single transaction.');
}