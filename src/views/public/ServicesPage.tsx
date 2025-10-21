/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo } from 'react';
import { Category, TherapyProgram } from '../../types';

interface ServicesPageProps {
  categories: Category[];
  programs: TherapyProgram[];
  onBack: () => void;
}

const ServicesPage: React.FC<ServicesPageProps> = ({ categories, programs, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const filteredPrograms = useMemo(() => {
        return programs.filter(program => {
            const matchesCategory = selectedCategory === 'all' || program.categoryId === selectedCategory;
            const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) || program.description.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [programs, searchTerm, selectedCategory]);

    const getCategoryName = (categoryId: string) => {
        return categories.find(c => c.id === categoryId)?.name || 'Bilinmeyen Kategori';
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <button onClick={onBack} className="btn btn-secondary">‹ Geri</button>
                <h1>Sunduğumuz Hizmetler</h1>
            </div>

            <div className="filters-container">
                <input 
                    type="search"
                    placeholder="Program ara..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <div className="btn-group">
                    <button onClick={() => setSelectedCategory('all')} className={`btn ${selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}>Tümü</button>
                    {categories.map(cat => (
                         <button 
                            key={cat.id} 
                            onClick={() => setSelectedCategory(cat.id)} 
                            className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="program-grid">
                {filteredPrograms.length > 0 ? filteredPrograms.map(program => (
                    <div key={program.id} className="program-card-full">
                        <span className="category-badge">{getCategoryName(program.categoryId)}</span>
                        <h3>{program.name}</h3>
                        <p>{program.description}</p>
                        <span className="exercise-count">{program.exerciseIds.length} egzersiz içerir</span>
                    </div>
                )) : (
                    <p>Filtrelerinize uygun program bulunamadı.</p>
                )}
            </div>
        </div>
    );
};

export default ServicesPage;
