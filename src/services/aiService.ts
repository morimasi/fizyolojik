/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Exercise, FAQItem, Message, User, Patient } from '../types';
import { fileToDataURL, createWavFileBlob, decodeBase64, blobToBase64 } from '../utils';

export const getAiSuggestion = async (
    currentUser: User, 
    activeChatPartnerId: string, 
    messages: Message[]
): Promise<string> => {
    const currentUserId = 'id' in currentUser ? currentUser.id : 'admin';
    const chatHistory = messages
      .filter(m =>
        (m.from === currentUserId && m.to === activeChatPartnerId) ||
        (m.from === activeChatPartnerId && m.to === currentUserId)
      )
      .sort((a, b) => a.timestamp - b.timestamp);

    const conversationContext = chatHistory
      .slice(-6)
      .map(m => {
        const speaker = m.from === currentUserId ? "Terapist" : "Danışan";
        return `${speaker}: ${m.text || '[Dosya gönderildi]'}`;
      })
      .join('\n');
      
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const prompt = `Sen profesyonel ve yardımsever bir fizyoterapi asistanısın. Bir danışan ve terapist arasındaki son konuşma dökümü aşağıdadır:
---
${conversationContext}
---
Bu konuşma geçmişine dayanarak, terapistin incelemesi için güvenli, empatik ve profesyonel bir yanıt önerisi oluştur. Yanıt Türkçe olmalıdır. Doğrudan tıbbi tavsiye verme, bunun yerine danışanı durumunu daha ayrıntılı açıklamaya teşvik et veya bir sonraki seansta konuyu tartışmayı öner. Sadece terapistin söyleyeceği yanıt metnini oluştur, herhangi bir ek açıklama yapma.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text;
};


export const generateExerciseWithAI = async (
    prompt: string, 
    wants: { description: boolean; image: boolean; video: boolean; audio: boolean; },
    onStatusUpdate: (status: string) => void,
    onDataUpdate: (data: Partial<Exercise>) => void
): Promise<Partial<Exercise>> => {

    let generatedData: Partial<Exercise> = {};
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    if (wants.description) {
        onStatusUpdate('Açıklama oluşturuluyor...');
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Bir fizyoterapi egzersizi oluştur. İstem: "${prompt}". JSON formatında şu alanları doldur: name (string, kısa ve net), description (string, detaylı açıklama), sets (number), reps (number). Sadece JSON nesnesini döndür.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        sets: { type: Type.INTEGER },
                        reps: { type: Type.INTEGER }
                    },
                    required: ["name", "description", "sets", "reps"]
                }
            }
        });
        const exerciseInfo = JSON.parse(response.text);
        generatedData = { ...generatedData, ...exerciseInfo };
        onDataUpdate(generatedData);
    }

    const descriptionForMedia = generatedData.description || `bir kişinin "${prompt}" hareketini yaptığı`;

    if (wants.image) {
        onStatusUpdate('Görsel oluşturuluyor...');
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: `Bir fizyoterapi egzersizini gösteren net, aydınlık, bilgilendirici bir görsel: ${descriptionForMedia}` }] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        const part = response.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            generatedData = { ...generatedData, imageUrl };
            onDataUpdate(generatedData);
        }
    }
    
    if (wants.video) {
        onStatusUpdate('Video oluşturuluyor... (Bu işlem birkaç dakika sürebilir)');
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: `Kısa, döngüsel bir video: Fizyoterapi egzersizi yapan bir kişi. Egzersiz: ${descriptionForMedia}. Net, eğitici stil.`,
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '1:1' }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
            const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            const videoBlob = await videoResponse.blob();
            const videoUrl = await fileToDataURL(videoBlob);
            generatedData = { ...generatedData, videoUrl };
            onDataUpdate(generatedData);
        }
    }
    
    if (wants.audio && generatedData.description) {
        onStatusUpdate('Sesli anlatım oluşturuluyor...');
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text: `Egzersiz: ${generatedData.name}. ${generatedData.description}` }] }],
            config: { 
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            const pcmData = decodeBase64(base64Audio);
            // Gemini TTS returns audio at 24000Hz, 1 channel (mono)
            const audioBlob = createWavFileBlob(pcmData, 24000, 1);
            const audioUrl = await fileToDataURL(audioBlob);
            generatedData = { ...generatedData, audioUrl };
            onDataUpdate(generatedData);
        }
    }

    onStatusUpdate('Oluşturma tamamlandı! Lütfen kontrol edip kaydedin.');
    return generatedData;
};


export const getAiPatientSummary = async (patient: Patient): Promise<string> => {
    const painJournalString = patient.painJournal.length > 0
        ? patient.painJournal.map(e => `- ${new Date(e.date).toLocaleDateString('tr-TR')}: Seviye ${e.painLevel}/10. Not: "${e.note}"`).join('\n')
        : "Danışan ağrı günlüğü tutmamış.";

    const exerciseLogString = Object.keys(patient.exerciseLog).length > 0
        ? Object.entries(patient.exerciseLog).map(([date, ids]) => `- ${new Date(date).toLocaleDateString('tr-TR')}: ${ids.length} egzersiz tamamlandı.`).join('\n')
        : "Danışan henüz hiç egzersiz tamamlamadı.";

    const clinicalNotesString = patient.clinicalNotes.length > 0
        ? patient.clinicalNotes.map(n => `Tarih: ${new Date(n.date).toLocaleDateString('tr-TR')}\nSübjektif: ${n.subjective}\nObjektif: ${n.objective}\nDeğerlendirme: ${n.assessment}\nPlan: ${n.plan}`).join('\n---\n')
        : "Danışan için klinik not bulunmuyor.";
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const prompt = `Sen, bir fizyoterapiste yardımcı olan bir yapay zeka asistanısın. Görevin, bir danışanın verilerini analiz ederek terapisti için kısa ve öz bir ilerleme özeti oluşturmaktır. Veriler, danışanın ağrı günlüğünü, egzersiz kayıtlarını ve terapistin yazdığı klinik notları içermektedir.

**Danışan Verileri:**

*   **Ağrı Günlüğü:**
${painJournalString}

*   **Egzersiz Kayıtları:**
${exerciseLogString}

*   **Klinik Notlar (SOAP formatı):**
${clinicalNotesString}

**Görevin:**

Yukarıdaki verilere dayanarak, Türkçe dilinde ve Markdown formatında bir özet oluştur. Özet şu bölümleri içermelidir:
*   **Ağrı Eğilimi:** Ağrı günlüğünü analiz et. Ağrı genel olarak artıyor mu, azalıyor mu yoksa dalgalı mı? Yüksek veya düşük ağrı günleriyle ilgili özel notlardan bahset.
*   **Egzersiz Uyumu:** Egzersiz kayıtlarını analiz et. Danışan egzersizlerini düzenli yapıyor mu? Kayıtlarda herhangi bir düzen veya boşluk var mı?
*   **Önemli Gözlemler:** Tüm kaynaklardan gelen bilgileri birleştir. Egzersiz tamamlama ile ağrı seviyeleri arasında bir ilişki var mı? Notlardaki danışan geri bildirimleri verilerle örtüşüyor mu? Olası endişeleri veya olumlu gelişmeleri vurgula.

Özeti nesnel ve verilere dayalı tut. Değerlendirmesine yardımcı olmak için bunu doğrudan terapiste sun.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text;
};

export const getAiAdminSummary = async (stats: {
    totalPatients: number;
    totalTherapists: number;
    completedAppointments: number;
    patientEngagement: number;
}): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const prompt = `Sen bir sağlık yöneticisine veri analizi sunan bir yapay zeka asistanısın. Aşağıda bir fizyoterapi kliniğinin belirli bir dönemdeki performans metrikleri bulunmaktadır:
- Toplam Aktif Danışan: ${stats.totalPatients}
- Toplam Terapist: ${stats.totalTherapists}
- Tamamlanan Randevu Sayısı: ${stats.completedAppointments}
- Ortalama Danışan Etkileşimi (Egzersiz Tamamlama Oranı): %${stats.patientEngagement.toFixed(1)}

Bu verilere dayanarak, klinik yöneticisi için kısa, profesyonel ve eyleme geçirilebilir bir özet oluştur. Özet, Markdown formatında olmalı ve şu bölümleri içermelidir:
1.  **Genel Performans:** Rakamların genel bir değerlendirmesi.
2.  **Güçlü Yönler:** Özellikle iyi olan metrikleri vurgula.
3.  **Geliştirilebilecek Alanlar:** Düşük görünen veya dikkat edilmesi gereken metrikler hakkında önerilerde bulun. Örneğin, etkileşim oranı düşükse ne yapılabilir?

Yanıtı doğrudan yöneticiye hitap eder gibi yaz ve Türkçe olsun.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

export const getFaqAnswer = async (
    userQuestion: string,
    faqs: FAQItem[]
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const faqContext = faqs.map(faq => `Soru: ${faq.question}\nCevap: ${faq.answer}`).join('\n\n');

    const prompt = `Sen bir müşteri hizmetleri yapay zekasısın. Aşağıda bir Sıkça Sorulan Sorular (SSS) listesi ve bir kullanıcının sorusu bulunmaktadır.
---
**SSS LİSTESİ:**
${faqContext}
---
**KULLANICI SORUSU:** "${userQuestion}"

Görevin: Kullanıcının sorusuna en uygun cevabı SSS listesinden bulup döndürmektir.
- Eğer doğrudan eşleşen bir soru varsa, o sorunun cevabını ver.
- Eğer doğrudan eşleşme yoksa, anlamsal olarak en yakın sorunun cevabını ver.
- Eğer hiçbir soru kullanıcının sorusuyla ilgili değilse, "Üzgünüm, sorunuzla ilgili bir cevap bulamadım. Lütfen daha farklı bir şekilde sormayı deneyin veya destek ekibimizle iletişime geçin." yanıtını ver.
Sadece cevabı döndür, ek bir açıklama yapma.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text;
};

export const generateVideoFromImageAI = async (
    imageFile: File,
    prompt: string,
    aspectRatio: '16:9' | '9:16',
    onStatusUpdate: (status: string) => void,
): Promise<Partial<Exercise>> => {
    onStatusUpdate('Görsel hazırlanıyor...');
    const base64Image = await blobToBase64(imageFile);
    
    // Create a new instance right before the call to use the latest API key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    onStatusUpdate('Video oluşturma işlemi başlatılıyor... (Bu işlem birkaç dakika sürebilir)');

    let operation;
    try {
        operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: `Kısa, döngüsel bir video: ${prompt}`,
            image: {
                imageBytes: base64Image,
                mimeType: imageFile.type,
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio
            }
        });
    } catch(e) {
        if (e instanceof Error && e.message.includes('API key not valid')) {
             throw new Error("API Anahtarı geçerli değil. Lütfen geçerli bir anahtar seçip tekrar deneyin.");
        }
        throw e;
    }
    
    onStatusUpdate('Video işleniyor... Lütfen bekleyin. Bu süreçte ekranı kapatmayın.');

    let progressCounter = 0;
    const progressMessages = [
        "İlk kareler oluşturuluyor...",
        "Hareket vektörleri hesaplanıyor...",
        "Görüntü akışı render ediliyor...",
        "Son rötuşlar yapılıyor..."
    ];

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        onStatusUpdate(`Video işleniyor... (${progressMessages[progressCounter % progressMessages.length]})`);
        progressCounter++;
        try {
            operation = await ai.operations.getVideosOperation({ operation: operation });
        } catch (e) {
            if (e instanceof Error && e.message.includes('Requested entity was not found')) {
                 throw new Error("API Anahtarı bulunamadı veya geçersiz. Lütfen anahtarınızı seçip tekrar deneyin.");
            }
            throw e; // Re-throw other errors
        }
    }

    onStatusUpdate('Video alınıyor...');
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!videoResponse.ok) {
            throw new Error(`Video indirme hatası: ${videoResponse.statusText}`);
        }
        const videoBlob = await videoResponse.blob();
        const videoUrl = await fileToDataURL(videoBlob);
        
        return {
            videoUrl,
            name: prompt || 'Oluşturulan Video Egzersizi',
            description: `Bu egzersiz, "${prompt}" istemiyle bir görselden oluşturulmuştur.`,
            sets: 3,
            reps: 10,
        };
    } else {
        throw new Error('Video oluşturulamadı. Model bir sonuç döndürmedi.');
    }
};