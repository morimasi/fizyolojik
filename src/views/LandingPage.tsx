/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { Category, Therapist, TherapyProgram } from '../types';
import ServicesPage from './public/ServicesPage';
import TherapistsPage from './public/TherapistsPage';
import TestimonialsPage from './public/TestimonialsPage';

interface LandingPageProps {
  onGoToRoleSelection: () => void;
  therapists: Therapist[];
  categories: Category[];
  programs: TherapyProgram[];
}

type PublicView = 'home' | 'services' | 'therapists' | 'testimonials';

const LandingPage: React.FC<LandingPageProps> = ({ onGoToRoleSelection, therapists, categories, programs }) => {
  const [activeView, setActiveView] = useState<PublicView>('home');

  const renderContent = () => {
    switch (activeView) {
      case 'services':
        return <ServicesPage categories={categories} programs={programs} onBack={() => setActiveView('home')} />;
      case 'therapists':
        return <TherapistsPage therapists={therapists} onBack={() => setActiveView('home')} />;
      case 'testimonials':
        return <TestimonialsPage onBack={() => setActiveView('home')} />;
      case 'home':
      default:
        return (
           <>
            <section id="hero" className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Sağlığınıza Giden Yolda <br /> Dijital Destekçiniz</h1>
                    <p className="hero-subtitle">Yapay zeka destekli platformumuzla, uzman fizyoterapistlerle tanışın ve kişiselleştirilmiş tedavi programınıza hemen başlayın.</p>
                    <button className="btn btn-primary btn-large" onClick={onGoToRoleSelection}>Hemen Başla</button>
                </div>
            </section>
            
            <section id="features-summary" className="content-section">
                <h2 className="section-title">Neden Biz?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">👩‍⚕️</div>
                        <h3>Uzman Terapistler</h3>
                        <p>Alanında deneyimli, lisanslı fizyoterapist kadromuzla kişiye özel tedavi planları sunuyoruz.</p>
                    </div>
                     <div className="feature-card">
                        <div className="feature-icon">🤖</div>
                        <h3>Yapay Zeka Desteği</h3>
                        <p>Egzersiz programlarınız, yapay zeka tarafından analiz edilerek en verimli hale getirilir.</p>
                    </div>
                     <div className="feature-card">
                        <div className="feature-icon">📱</div>
                        <h3>Her Yerden Erişim</h3>
                        <p>Tedavi programınıza ve terapistinize istediğiniz zaman, istediğiniz yerden ulaşın.</p>
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
        </>
        );
    }
  };


  return (
    <div className="landing-container">
        <header className="landing-header">
            <div className="logo" onClick={() => setActiveView('home')} style={{cursor: 'pointer'}}>Fizyoterapi Asistanı</div>
            <nav className="nav-links">
                <a onClick={() => setActiveView('home')} className={activeView === 'home' ? 'active' : ''}>Ana Sayfa</a>
                <a onClick={() => setActiveView('services')} className={activeView === 'services' ? 'active' : ''}>Hizmetlerimiz</a>
                <a onClick={() => setActiveView('therapists')} className={activeView === 'therapists' ? 'active' : ''}>Terapistlerimiz</a>
                <a onClick={() => setActiveView('testimonials')} className={activeView === 'testimonials' ? 'active' : ''}>Yorumlar</a>
            </nav>
            <button className="btn btn-primary" onClick={onGoToRoleSelection}>Giriş Yap</button>
        </header>

        <main>
          {renderContent()}
        </main>

        <footer className="landing-footer">
            <p>&copy; 2024 Fizyoterapi Asistanı. Tüm hakları saklıdır.</p>
        </footer>
    </div>
  );
};

export default LandingPage;