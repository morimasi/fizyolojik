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
- **Derleme Aracı (Build Tool)**: Vite

## 🚀 Başlarken

Bu proje, Vite kullanılarak oluşturulmuş modern bir React uygulamasıdır. Başlamak için Node.js ve npm'in (veya pnpm/yarn) yüklü olması gerekmektedir.

### Ön Gereksinimler
- Node.js (LTS sürümü önerilir)
- Geçerli bir Google Gemini API Anahtarı.

### Kurulum ve Yerel Geliştirme

1.  **Projeyi klonlayın ve bağımlılıkları yükleyin:**
    ```bash
    # Proje dizinine gidin
    npm install
    ```

2.  **API Anahtarınızı ayarlayın:**
    Projenin ana dizininde `.env.local` adında yeni bir dosya oluşturun. Bu dosyaya API anahtarınızı aşağıdaki formatta ekleyin:
    ```
    VITE_API_KEY="AIzaSy...ANOTHER_PART_OF_YOUR_KEY"
    ```
    `"AIzaSy...ANOTHER_PART_OF_YOUR_KEY"` kısmını kendi Gemini API anahtarınızla değiştirin. Bu dosya, anahtarınızın güvende kalmasını sağlar ve kaynak kontrolüne dahil edilmemelidir.

3.  **Geliştirme Sunucusunu Başlatın:**
    Aşağıdaki komutu çalıştırarak yerel geliştirme sunucusunu başlatın:
    ```bash
    npm run dev
    ```
    Uygulama genellikle `http://localhost:5173` adresinde erişilebilir olacaktır. Vite, Hızlı Yenileme (Fast Refresh) desteği ile harika bir geliştirme deneyimi sunar.

### Üretim için Derleme (Build)

Uygulamayı Vercel gibi bir platformda yayınlamadan önce, optimize edilmiş üretim dosyalarını oluşturmanız gerekir:
```bash
npm run build
```
Bu komut, projenin statik dosyalarını içeren bir `dist` klasörü oluşturacaktır.

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
    -   **E-posta**: `elif@terapi.com`
    -   **Parola**: `1234`

-   **Danışan**:
    -   **E-posta**: `ayse@mail.com`
    -   **Parola**: `1234`
    ---
    -   **E-posta**: `mehmet@mail.com`
    -   **Parola**: `1234`
