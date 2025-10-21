/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { Category, Therapist, TherapyProgram, Testimonial, Theme } from '../types';
import ServicesPage from './public/ServicesPage';
import TherapistsPage from './public/TherapistsPage';
import TestimonialsPage from './public/TestimonialsPage';
import ThemeSelector from '../components/ThemeSelector';

interface LandingPageProps {
  onGoToRoleSelection: () => void;
  therapists: Therapist[];
  categories: Category[];
  programs: TherapyProgram[];
  testimonials: Testimonial[];
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

type PublicView = 'home' | 'services' | 'therapists' | 'testimonials';

const LandingPage: React.FC<LandingPageProps> = ({ onGoToRoleSelection, therapists, categories, programs, testimonials, theme, setTheme }) => {
  const [activeView, setActiveView] = useState<PublicView>('home');

  const renderContent = () => {
    switch (activeView) {
      case 'services':
        return <ServicesPage categories={categories} programs={programs} onBack={() => setActiveView('home')} />;
      case 'therapists':
        return <TherapistsPage therapists={therapists} onBack={() => setActiveView('home')} />;
      case 'testimonials':
        return <TestimonialsPage testimonials={testimonials} onBack={() => setActiveView('home')} />;
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
                <h2 className="section-title">Platformumuzun Gücü</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm8 11.12V20a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v1.12a10 10 0 0 0 16 0zM17.07 19H6.93a8 8 0 0 1 10.14 0zM19 13a1 1 0 0 0-1 1v2h-2a1 1 0 1 0 0 2h2v2a1 1 0 1 0 2 0v-2h2a1 1 0 1 0 0-2h-2v-2a1 1 0 0 0-1-1z"/></svg>
                        </div>
                        <h3>Uzman Terapistler</h3>
                        <p>Alanında deneyimli, lisanslı fizyoterapist kadromuzla kişiye özel tedavi planları sunuyoruz.</p>
                    </div>
                     <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 3.5A1.5 1.5 0 0 1 8.5 2a1.5 1.5 0 0 1 0 3A1.5 1.5 0 0 1 10 3.5zm-3.5 6A1.5 1.5 0 0 1 5 8a1.5 1.5 0 0 1 3 0 1.5 1.5 0 0 1-1.5 1.5zm6.5-5A1.5 1.5 0 0 1 11.5 3a1.5 1.5 0 0 1 3 0 1.5 1.5 0 0 1-1.5 1.5zm-2 5.5a1.5 1.5 0 0 1-1.5-1.5 1.5 1.5 0 0 1 3 0A1.5 1.5 0 0 1 11 10zm6.5-3.5A1.5 1.5 0 0 1 16 5a1.5 1.5 0 0 1 3 0 1.5 1.5 0 0 1-1.5 1.5zm-1.5 4a1.5 1.5 0 0 1-1.5-1.5A1.5 1.5 0 0 1 17.5 7a1.5 1.5 0 0 1 0 3 1.5 1.5 0 0 1-1.5 1.5zm-5 11.5c-3.2 0-5-1.8-5-5s1.8-5 5-5 5 1.8 5 5-1.8 5-5 5z"/></svg>
                        </div>
                        <h3>Yapay Zeka Desteği</h3>
                        <p>Egzersiz programlarınız, yapay zeka tarafından analiz edilerek en verimli hale getirilir.</p>
                    </div>
                     <div className="feature-card">
                        <div className="feature-icon-wrapper">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 1h-8A2.5 2.5 0 0 0 5 3.5v17A2.5 2.5 0 0 0 7.5 23h8a2.5 2.5 0 0 0 2.5-2.5v-17A2.5 2.5 0 0 0 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z"/></svg>
                        </div>
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
                  <div className="step-card">
                      <div className="step-number">2</div>
                      <h3>Terapistinizle Tanışın</h3>
                      <p>Size atanan uzman fizyoterapistinizle güvenli mesajlaşma üzerinden tanışın.</p>
                  </div>
                  <div className="step-card">
                      <div className="step-number">3</div>
                      <h3>Programa Başlayın</h3>
                      <p>Kişisel panelinizden tedavi programınızı takip edin ve sağlığınıza kavuşun.</p>
                  </div>
              </div>
            </section>

            <section id="therapists-landing" className="content-section">
                <h2 className="section-title">Öne Çıkan Terapistlerimiz</h2>
                <div className="therapist-showcase-landing">
                    <div className="therapist-scroll-container">
                        {therapists.slice(0, 4).map(therapist => (
                            <div key={therapist.id} className="therapist-card-landing">
                                <img src={therapist.profileImageUrl} alt={therapist.name} className="therapist-photo" />
                                <h3>{therapist.name}</h3>
                                <p>{therapist.bio.substring(0, 60)}...</p>
                                <a className="btn" onClick={() => setActiveView('therapists')}>Profili Görüntüle</a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

             <section id="testimonials-landing" className="content-section">
                <h2 className="section-title">Danışanlarımız Ne Diyor?</h2>
                <div className="testimonial-slider-container">
                    {testimonials.map(testimonial => (
                        <div key={testimonial.id} className="testimonial-card">
                             <div className="quote-icon">“</div>
                            <p>{testimonial.quote}</p>
                            <h4>- {testimonial.author}</h4>
                        </div>
                    ))}
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
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <ThemeSelector theme={theme} setTheme={setTheme} />
                <button className="btn btn-primary" onClick={onGoToRoleSelection}>Giriş Yap</button>
            </div>
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