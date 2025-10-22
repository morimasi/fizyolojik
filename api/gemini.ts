/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Exercise, FAQItem, Patient } from '../src/types';
import { createWavFileBlob, decodeBase64, blobToDataURL } from './_utils';

// A type for the state that will be passed between poll requests
interface GenerationState {
    generatedData: Partial<Exercise>;
    wants: { description: boolean; image: boolean; video: boolean; audio: boolean; };
    prompt: string;
    nextStep: 'image' | 'video_start' | 'video_poll' | 'audio' | 'done';
    videoOperation?: any;
}

// Main handler for all AI-related tasks
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    if (!process.env.API_KEY) {
        return res.status(500).json({ error: "Sunucu tarafında API_KEY ortam değişkeni ayarlanmamış." });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const { task, payload } = req.body;

    try {
        let result: any;
        switch (task) {
            case 'getSuggestion':
                const { currentUser, activeChatPartnerId, messages } = payload;
                const currentUserId = 'id' in currentUser ? currentUser.id : 'admin';
                const chatHistory = messages
                  .filter((m: any) =>
                    (m.from === currentUserId && m.to === activeChatPartnerId) ||
                    (m.from === activeChatPartnerId && m.to === currentUserId)
                  )
                  .sort((a: any, b: any) => a.timestamp - b.timestamp);
            
                const conversationContext = chatHistory
                  .slice(-6)
                  .map((m: any) => `${m.from === currentUserId ? "Terapist" : "Danışan"}: ${m.text || '[Dosya gönderildi]'}`)
                  .join('\n');
                  
                const suggestionPrompt = `Sen profesyonel ve yardımsever bir fizyoterapi asistanısın. Bir danışan ve terapist arasındaki son konuşma dökümü aşağıdadır:\n---\n${conversationContext}\n---\nBu konuşma geçmişine dayanarak, terapistin incelemesi için güvenli, empatik ve profesyonel bir yanıt önerisi oluştur. Yanıt Türkçe olmalıdır. Doğrudan tıbbi tavsiye verme, bunun yerine danışanı durumunu daha ayrıntılı açıklamaya teşvik et veya bir sonraki seansta konuyu tartışmayı öner. Sadece terapistin söyleyeceği yanıt metnini oluştur, herhangi bir ek açıklama yapma.`;
            
                const suggestionResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: suggestionPrompt });
                result = suggestionResponse.text || 'Üzgünüm, şu anda bir öneri oluşturamıyorum. Lütfen daha sonra tekrar deneyin.';
                break;

            case 'generateExercise_start': {
                const { prompt, wants } = payload;
                let generatedData: Partial<Exercise> = {};
                let statusMessage = "İstek alındı, metin içeriği oluşturuluyor...";
            
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `Bir fizyoterapi egzersizi oluştur. İstem: "${prompt}". JSON formatında şu alanları doldur: name (string, kısa ve net), description (string, detaylı açıklama), sets (number), reps (number). Sadece JSON nesnesini döndür.`,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, sets: { type: Type.INTEGER }, reps: { type: Type.INTEGER } }, required: ["name", "description", "sets", "reps"] }
                    }
                });
                const responseText = response.text;
                if (!responseText) {
                    throw new Error('Yapay zeka egzersiz için geçerli bir metin oluşturamadı.');
                }
                try {
                    generatedData = JSON.parse(responseText);
                } catch (e) {
                    console.error("Failed to parse JSON from AI for exercise description:", responseText);
                    throw new Error("Yapay zeka geçersiz bir formatta yanıt verdi.");
                }
                
                const nextStep = wants.image ? 'image' : (wants.video ? 'video_start' : (wants.audio ? 'audio' : 'done'));
                statusMessage = `Metin oluşturuldu. Sonraki adım: ${nextStep}`;
            
                const initialState: GenerationState = {
                    generatedData,
                    wants,
                    prompt,
                    nextStep,
                };
                
                result = { state: initialState, isDone: nextStep === 'done', statusMessage, finalData: nextStep === 'done' ? generatedData : null };
                break;
            }

            case 'generateExercise_poll': {
                const state: GenerationState = payload.state;
                let { generatedData, wants, prompt, nextStep, videoOperation } = state;
                let isDone = false;
                let statusMessage = '';
            
                const descriptionForMedia = generatedData.description || `bir kişinin "${prompt}" hareketini yaptığı`;
            
                switch (nextStep) {
                    case 'image':
                        statusMessage = "Görsel materyal oluşturuluyor...";
                        if (wants.image) {
                            const response = await ai.models.generateContent({
                                model: 'gemini-2.5-flash-image',
                                contents: { parts: [{ text: `Bir fizyoterapi egzersizini gösteren net, aydınlık, bilgilendirici bir görsel: ${descriptionForMedia}` }] },
                                config: { responseModalities: [Modality.IMAGE] },
                            });
                            const part = response.candidates?.[0]?.content?.parts?.[0];
                            if (part?.inlineData) {
                                generatedData.imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                            }
                        }
                        nextStep = wants.video ? 'video_start' : (wants.audio ? 'audio' : 'done');
                        statusMessage = "Görsel oluşturuldu. Sonraki adım: " + nextStep;
                        break;
            
                    case 'video_start':
                        statusMessage = "Video oluşturma işlemi başlatılıyor...";
                        videoOperation = await ai.models.generateVideos({ model: 'veo-3.1-fast-generate-preview', prompt: `Kısa, döngüsel bir video: Fizyoterapi egzersizi yapan bir kişi. Egzersiz: ${descriptionForMedia}. Net, eğitici stil.`, config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '1:1' } });
                        nextStep = 'video_poll';
                        statusMessage = "Video işlemi sunucuya gönderildi, sonuç bekleniyor...";
                        break;
                        
                    case 'video_poll':
                        statusMessage = "Video işleniyor... Bu işlem birkaç dakika sürebilir.";
                        videoOperation = await ai.operations.getVideosOperation({ operation: videoOperation });
                        if (videoOperation.done) {
                            statusMessage = "Video işleme tamamlandı, dosya alınıyor...";
                            const link = videoOperation.response?.generatedVideos?.[0]?.video?.uri;
                            if (link) {
                                const videoRes = await fetch(`${link}&key=${process.env.API_KEY}`);
                                const videoBlob = await videoRes.blob();
                                generatedData.videoUrl = await blobToDataURL(videoBlob);
                            }
                            nextStep = wants.audio ? 'audio' : 'done';
                            statusMessage = "Video oluşturuldu. Sonraki adım: " + nextStep;
                        } else {
                            nextStep = 'video_poll';
                        }
                        break;
            
                    case 'audio':
                        statusMessage = "Sesli anlatım oluşturuluyor...";
                        if (wants.audio && generatedData.description) {
                            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-preview-tts', contents: [{ parts: [{ text: `Egzersiz: ${generatedData.name}. ${generatedData.description}` }] }], config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } } });
                            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                            if (base64Audio) {
                                const pcmData = decodeBase64(base64Audio);
                                const audioBlob = createWavFileBlob(pcmData, 24000, 1);
                                generatedData.audioUrl = await blobToDataURL(audioBlob);
                            }
                        }
                        nextStep = 'done';
                        statusMessage = "Sesli anlatım oluşturuldu. İşlem tamamlandı.";
                        break;
                }
            
                if (nextStep === 'done') {
                    isDone = true;
                }
            
                const newState: GenerationState = { generatedData, wants, prompt, nextStep, videoOperation };
                result = { state: newState, isDone, statusMessage, finalData: isDone ? generatedData : null };
                break;
            }

            case 'getPatientSummary':
                const patient: Patient = payload.patient;
                const painJournalString = patient.painJournal.length > 0 ? patient.painJournal.map(e => `- ${new Date(e.date).toLocaleDateString('tr-TR')}: Seviye ${e.painLevel}/10. Not: "${e.note}"`).join('\n') : "Danışan ağrı günlüğü tutmamış.";
                const exerciseLogString = Object.keys(patient.exerciseLog).length > 0 ? Object.entries(patient.exerciseLog).map(([date, ids]) => `- ${new Date(date).toLocaleDateString('tr-TR')}: ${ids.length} egzersiz tamamlandı.`).join('\n') : "Danışan henüz hiç egzersiz tamamlamadı.";
                const clinicalNotesString = patient.clinicalNotes.length > 0 ? patient.clinicalNotes.map(n => `Tarih: ${new Date(n.date).toLocaleDateString('tr-TR')}\nSübjektif: ${n.subjective}\nObjektif: ${n.objective}\nDeğerlendirme: ${n.assessment}\nPlan: ${n.plan}`).join('\n---\n') : "Danışan için klinik not bulunmuyor.";
                const summaryPrompt = `Sen, bir fizyoterapiste yardımcı olan bir yapay zeka asistanısın. Görevin, bir danışanın verilerini analiz ederek terapisti için kısa ve öz bir ilerleme özeti oluşturmaktır. Veriler, danışanın ağrı günlüğünü, egzersiz kayıtlarını ve terapistin yazdığı klinik notları içermektedir.\n\n**Danışan Verileri:**\n\n*   **Ağrı Günlüğü:**\n${painJournalString}\n\n*   **Egzersiz Kayıtları:**\n${exerciseLogString}\n\n*   **Klinik Notlar (SOAP formatı):**\n${clinicalNotesString}\n\n**Görevin:**\n\nYukarıdaki verilere dayanarak, Türkçe dilinde ve Markdown formatında bir özet oluştur. Özet şu bölümleri içermelidir:\n*   **Ağrı Eğilimi:** Ağrı günlüğünü analiz et. Ağrı genel olarak artıyor mu, azalıyor mu yoksa dalgalı mı? Yüksek veya düşük ağrı günleriyle ilgili özel notlardan bahset.\n*   **Egzersiz Uyumu:** Egzersiz kayıtlarını analiz et. Danışan egzersizlerini düzenli yapıyor mu? Kayıtlarda herhangi bir düzen veya boşluk var mı?\n*   **Önemli Gözlemler:** Tüm kaynaklardan gelen bilgileri birleştir. Egzersiz tamamlama ile ağrı seviyeleri arasında bir ilişki var mı? Notlardaki danışan geri bildirimleri verilerle örtüşüyor mu? Olası endişeleri veya olumlu gelişmeleri vurgula.\n\nÖzeti nesnel ve verilere dayalı tut. Değerlendirmesine yardımcı olmak için bunu doğrudan terapiste sun.`;
                const summaryResponse = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: summaryPrompt });
                result = summaryResponse.text || "Danışan özeti oluşturulurken bir hata oluştu.";
                break;
            
            case 'getAdminSummary':
                 const stats = payload.stats;
                 const adminPrompt = `Sen bir sağlık yöneticisine veri analizi sunan bir yapay zeka asistanısın. Aşağıda bir fizyoterapi kliniğinin belirli bir dönemdeki performans metrikleri bulunmaktadır:\n- Toplam Aktif Danışan: ${stats.totalPatients}\n- Toplam Terapist: ${stats.totalTherapists}\n- Tamamlanan Randevu Sayısı: ${stats.completedAppointments}\n- Ortalama Danışan Etkileşimi (Egzersiz Tamamlama Oranı): %${stats.patientEngagement.toFixed(1)}\n\nBu verilere dayanarak, klinik yöneticisi için kısa, profesyonel ve eyleme geçirilebilir bir özet oluştur. Özet, Markdown formatında olmalı ve şu bölümleri içermelidir:\n1.  **Genel Performans:** Rakamların genel bir değerlendirmesi.\n2.  **Güçlü Yönler:** Özellikle iyi olan metrikleri vurgula.\n3.  **Geliştirilebilecek Alanlar:** Düşük görünen veya dikkat edilmesi gereken metrikler hakkında önerilerde bulun. Örneğin, etkileşim oranı düşükse ne yapılabilir?\n\nYanıtı doğrudan yöneticiye hitap eder gibi yaz ve Türkçe olsun.`;
                 const adminResponse = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: adminPrompt });
                 result = adminResponse.text || "Yönetici özeti oluşturulurken bir hata oluştu.";
                 break;

            case 'getFaqAnswer':
                const { userQuestion, faqs } = payload;
                const faqContext = faqs.map((faq: FAQItem) => `Soru: ${faq.question}\nCevap: ${faq.answer}`).join('\n\n');
                const faqPrompt = `Sen bir müşteri hizmetleri yapay zekasısın. Aşağıda bir Sıkça Sorulan Sorular (SSS) listesi ve bir kullanıcının sorusu bulunmaktadır.\n---\n**SSS LİSTESİ:**\n${faqContext}\n---\n**KULLANICI SORUSU:** "${userQuestion}"\n\nGörevin: Kullanıcının sorusuna en uygun cevabı SSS listesinden bulup döndürmektir.\n- Eğer doğrudan eşleşen bir soru varsa, o sorunun cevabını ver.\n- Eğer doğrudan eşleşme yoksa, anlamsal olarak en yakın sorunun cevabını ver.\n- Eğer hiçbir soru kullanıcının sorusuyla ilgili değilse, "Üzgünüm, sorunuzla ilgili bir cevap bulamadım. Lütfen daha farklı bir şekilde sormayı deneyin veya destek ekibimizle iletişime geçin." yanıtını ver.\nSadece cevabı döndür, ek bir açıklama yapma.`;
                const faqResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: faqPrompt });
                result = faqResponse.text || "Üzgünüm, sorunuza bir yanıt bulunamadı.";
                break;
            
            case 'generateVideo_start':
                result = await ai.models.generateVideos(payload);
                break;
            
            case 'generateVideo_poll':
                result = await ai.operations.getVideosOperation({ operation: payload.operation });
                break;

            case 'generateVideo_fetch':
                const videoResponse = await fetch(`${payload.downloadLink}&key=${process.env.API_KEY}`);
                 if (!videoResponse.ok) {
                    throw new Error(`Video indirme başarısız oldu: ${videoResponse.statusText}`);
                }
                const videoBlob = await videoResponse.blob();
                result = await blobToDataURL(videoBlob);
                break;

            default:
                return res.status(400).json({ error: 'Invalid task specified' });
        }

        return res.status(200).json({ result });

    } catch (error: any) {
        console.error(`API Hatası - Görev: ${task}`, error);
        return res.status(500).json({ error: error.message || 'Bilinmeyen bir sunucu hatası oluştu.' });
    }
}