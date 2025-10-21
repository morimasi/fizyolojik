/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Testimonial } from '../../types';

interface TestimonialsPageProps {
  onBack: () => void;
  testimonials: Testimonial[];
}

const TestimonialsPage: React.FC<TestimonialsPageProps> = ({ onBack, testimonials }) => {
  return (
    <div className="page-container">
      <div className="page-header">
        <button onClick={onBack} className="btn btn-secondary">‹ Geri</button>
        <h1>Danışan Deneyimleri</h1>
      </div>
      <div className="testimonials-grid">
        {testimonials.map(testimonial => (
          <div key={testimonial.id} className="testimonial-card">
            <p>"{testimonial.quote}"</p>
            <h4>- {testimonial.author}</h4>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestimonialsPage;