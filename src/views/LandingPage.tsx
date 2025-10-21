/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface LandingPageProps {
  onGoToRoleSelection: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGoToRoleSelection }) => {
  return (
    <div className="landing-container">
        <header className="landing-header">
            <div className="logo">Fizyoterapi Asistanı</div>
            <nav className="nav-links">
                <a href="#hero">Ana Sayfa</a>
                <a href="#features">Hizmetlerimiz</a>
                <a href="#how-it-works">Nasıl Çalışır?</a>
            </nav>
            <button className="btn btn-primary" onClick={onGoToRoleSelection}>Giriş Yap</button>
        </header>

        <main>
            <section id="hero" className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Sağlığınıza Giden Yolda <br /> Dijital Destekçiniz</h1>
                    <p className="hero-subtitle">Yapay zeka destekli platformumuzla, uzman fizyoterapistlerle tanışın ve kişiselleştirilmiş tedavi programınıza hemen başlayın.</p>
                    <button className="btn btn-primary btn-large" onClick={onGoToRoleSelection}>Hemen Başla</button>
                </div>
            </section>

            <section id="features" className="content-section">
                <h2 className="section-title">Neden Fizyoterapi Asistanı?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon"> Personalized </div>
                        <h3>Kişiselleştirilmiş Terapi</h3>
                        <p>Size özel hazırlanan egzersiz ve tedavi programları ile hedeflerinize daha hızlı ulaşın.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"> Support </div>
                        <h3>Uzman Terapist Desteği</h3>
                        <p>Alanında uzman fizyoterapistlerimizle güvenli mesajlaşma üzerinden sürekli iletişimde kalın.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"> AI </div>
                        <h3>Yapay Zeka Destekli İletişim</h3>
                        <p>Terapistlerimiz, sorularınıza daha hızlı ve etkili yanıtlar vermek için yapay zeka önerilerinden faydalanır.</p>
                    </div>
                </div>
            </section>
            
            <section id="how-it-works" className="content-section">
              <h2 className="section-title">Nasıl Çalışır?</h2>
              <div className="steps-container">
                  <div className="step-card">
                      <div className="step-number">1</div>
                      <h3>Kaydolun</h3>
                      <p>Platformumuza danışan olarak giriş yapın ve size en uygun hizmetleri keşfedin.</p>
                  </div>
                   <div className="step-arrow">→</div>
                  <div className="step-card">
                      <div className="step-number">2</div>
                      <h3>Terapistinizle Tanışın</h3>
                      <p>Size atanan uzman fizyoterapistinizle güvenli mesajlaşma üzerinden tanışın.</p>
                  </div>
                   <div className="step-arrow">→</div>
                  <div className="step-card">
                      <div className="step-number">3</div>
                      <h3>Programa Başlayın</h3>
                      <p>Kişisel panelinizden tedavi programınızı takip edin ve sağlığınıza kavuşun.</p>
                  </div>
              </div>
            </section>
        </main>

        <footer className="landing-footer">
            <p>&copy; 2024 Fizyoterapi Asistanı. Tüm hakları saklıdır.</p>
        </footer>
    </div>
  );
};

export default LandingPage;
