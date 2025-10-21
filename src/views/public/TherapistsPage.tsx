/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Therapist } from '../../types';

interface TherapistsPageProps {
  therapists: Therapist[];
  onBack: () => void;
}

const TherapistsPage: React.FC<TherapistsPageProps> = ({ therapists, onBack }) => {
  return (
    <div className="page-container">
      <div className="page-header">
        <button onClick={onBack} className="btn btn-secondary">‹ Geri</button>
        <h1>Uzman Terapist Kadromuz</h1>
      </div>
      <div className="therapist-grid">
        {therapists.map(therapist => (
          <div key={therapist.id} className="therapist-card-full">
            <img src={therapist.profileImageUrl} alt={therapist.name} className="therapist-photo" />
            <h3>{therapist.name}</h3>
            <p>{therapist.bio}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TherapistsPage;
