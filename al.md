# Fizyoterapi Asistanı

Yapay Zeka Destekli Fizyoterapi Asistanı'na hoş geldiniz! Bu, fizyoterapistleri hastalarıyla buluşturmak, iletişimi kolaylaştırmak ve kişiselleştirilmiş terapi programları için yapay zeka destekli yardım sağlamak üzere tasarlanmış web tabanlı bir platformdur.

## ✨ Özellikler

Uygulama, her biri özel bir arayüze ve özelliklere sahip üç ana kullanıcı rolüne ayrılmıştır.

### 👤 Yönetici Paneli
- **Danışan Yönetimi**: Kayıtlı oldukları terapi hizmetleri de dahil olmak üzere hasta ayrıntılarını görüntüleyin ve düzenleyin.
- **Hizmet Yönetimi**:
    - **Kategoriler**: Hizmet kategorileri (ör. Ameliyat Sonrası Rehabilitasyon, Sporcu Sakatlıkları) oluşturun, güncelleyin ve silin.
    - **Hizmetler**: Bu kategoriler altında belirli terapi hizmetleri oluşturun, güncelleyin ve silin.
- **Güvenli Giriş**: Panele özel bir parola ile erişin.

### 👨‍⚕️ Terapist Görünümü
- **Danışan Paneli**: Atanmış hastaların bir listesini görüntüleyin.
- **Güvenli Mesajlaşma**: Seçilen herhangi bir hastayla gerçek zamanlı, bire bir sohbet edin.
- **Yapay Zeka Destekli Öneriler**: Bir hasta soru sorduğunda, terapist bu soruyu Gemini API'ye gönderilmek üzere onaylayabilir. Yapay zeka, terapistin inceleyebileceği, düzenleyebileceği ve hastaya gönderebileceği profesyonel, güvenli ve yardımcı bir yanıt önerisi oluşturur.

### 🤕 Danışan Görünümü
- **Kişisel Panel**: Kayıtlı tüm terapi programlarını ve hizmetlerini bir bakışta görün.
- **Hizmet Kataloğu**: Kolay gezinme için kategorize edilmiş tüm fizyoterapi hizmetlerine göz atın ve yeni programlara kaydolun.
- **Doğrudan Mesajlaşma**: Soru sormak ve rehberlik almak için atanmış terapistleriyle doğrudan ve güvenli bir şekilde iletişim kurun.

## 🛠️ Teknoloji Yığını

- **Frontend**: React & TypeScript
- **Yapay Zeka Entegrasyonu**: Google Gemini API (`@google/genai`)
- **Stil**: Modern bir görünüm ve his için özel değişkenler (custom properties) içeren saf CSS.
- **Modül Sistemi**: Import Maps ile yerel ES Modülleri (Webpack veya Vite gibi bir paketleyici gerektirmez).

## 🚀 Başlarken

Bu proje, karmaşık bir derleme (build) sürecine gerek kalmadan doğrudan tarayıcıda çalışacak şekilde tasarlanmıştır.

### Ön Gereksinimler
- ES Modüllerini destekleyen modern bir web tarayıcısı (ör. Chrome, Firefox, Edge).
- Geçerli bir Google Gemini API Anahtarı.

### Kurulum ve Ayarlama

1.  **Projeyi klonlayın veya dosyaları indirin.**
2.  **API Anahtarınızı ayarlayın:**
    Uygulamanın yapay zeka özelliklerini kullanabilmesi için bir Google Gemini API anahtarına ihtiyacı vardır. Bu anahtarı tarayıcının `process.env.API_KEY` değişkeninde kullanılabilir hale getirmeniz gerekir. Bunu yapmanın en kolay yolu, `index.html` dosyasına bir script etiketi eklemektir.

    `index.html` dosyasını açın ve `<script type="module" src="/index.tsx"></script>` satırından **önce** aşağıdaki script etiketini ekleyin:

    ```html
    <script>
      // UYARI: Bu yalnızca geliştirme amaçlıdır.
      // Üretim ortamında API anahtarınızı herkese açık olarak ifşa etmeyin.
      window.process = {
        env: {
          API_KEY: 'AIzaSyDwCLelIHYSCtwwkIlJ74KDpX4ml_eHioQ'
        }
      };
    </script>
    ```
    `'GEMINI_API_ANAHTARINIZI_BURAYA_YAZIN'` kısmını kendi Gemini API anahtarınızla değiştirin.

3.  **Uygulamayı Çalıştırma:**
    Proje dosyalarını basit bir yerel web sunucusu kullanarak sunabilirsiniz. Eğer Node.js yüklüyse, `serve` gibi bir paket kullanabilirsiniz:
    ```bash
    # Serve paketini genel olarak yükleyin
    npm install -g serve

    # Proje dizininde sunucuyu başlatın
    serve .
    ```
    Ardından, tarayıcınızı açın ve sunucunun sağladığı yerel adrese gidin (ör. `http://localhost:3000`).

## 📁 Proje Yapısı

```
.
├── index.html              # Ana HTML giriş noktası
├── index.css               # Global CSS stilleri
├── index.tsx               # Uygulamanın ana giriş noktası (root render)
├── al.md                   # Proje dokümantasyonu (şu anda buradasınız!)
└── src/
    ├── App.tsx             # Ana uygulama bileşeni, state ve view yönetimini yapar
    ├── types.ts            # TypeScript tip tanımlamaları
    ├── data.ts             # Uygulamanın başlangıç verileri (mock data)
    ├── utils.ts            # Genel yardımcı fonksiyonlar
    ├── hooks/
    │   └── usePersistentState.ts # LocalStorage ile state'i senkronize eden custom hook
    ├── services/
    │   └── aiService.ts    # Google Gemini API ile ilgili tüm mantık
    ├── views/              # Üst seviye ekran bileşenleri
    │   ├── LandingPage.tsx
    │   ├── RoleSelection.tsx
    │   ├── Login.tsx
    │   └── Dashboard.tsx   # Tüm paneller için sarmalayıcı (wrapper) bileşen
    ├── panels/             # Role özgü ana panel bileşenleri
    │   ├── AdminDashboard.tsx
    │   ├── TherapistDashboard.tsx
    │   └── PatientDashboard.tsx
    └── components/         # Yeniden kullanılabilir React bileşenleri
        ├── ChatInterface.tsx
        ├── Modal.tsx
        ├── NotificationPanel.tsx
        └── VideoModal.tsx
```

## 🔑 Nasıl Kullanılır (Giriş Bilgileri)

Uygulama, sahte verilerle önceden doldurulmuştur. Farklı rolleri test etmek için aşağıdaki giriş bilgilerini kullanın:

-   **Yönetici**:
    -   **Parola**: `admin2024`

-   **Terapist**:
    -   **E-posta**: `zeynep@clinic.com`
    -   **Parola**: `1234`

-   **Danışan**:
    -   **E-posta**: `ayse@example.com`
    -   **Parola**: `1234`
    ---
    -   **E-posta**: `mehmet@example.com`
    -   **Parola**: `1234`
