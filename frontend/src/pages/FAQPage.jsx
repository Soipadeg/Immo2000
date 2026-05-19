import './FAQPage.css';
/**
 * Page FAQ - Questions Fréquemment Posées
 */

import React, { useState, useEffect } from 'react';
import { Button, Input, Card, Alert, FormContainer } from '@/components';
import { faqApi } from '../services/api';

const FAQPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [faqs, setFaqs] = useState([]);
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    loadFAQs();
    if (tabValue === 1) {
      loadStats();
    }
  }, [tabValue]);

  const loadFAQs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await faqApi.listAll(0, 100);
      setFaqs(response.data.faqs || response.data || []);
      setFilteredFaqs(response.data.faqs || response.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement des FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (term) => {
    setSearchTerm(term);

    if (!term.trim()) {
      setFilteredFaqs(faqs);
      return;
    }

    try {
      const response = await faqApi.search(term);
      setFilteredFaqs(response.data.faqs || response.data || []);
    } catch (err) {
      // Fallback: filtrer localement
      const filtered = faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(term.toLowerCase()) ||
          faq.reponse.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredFaqs(filtered);
    }
  };

  const categories = [...new Set(faqs.map((faq) => faq.categorie))];

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    if (!category) {
      setFilteredFaqs(faqs);
    } else {
      setFilteredFaqs(faqs.filter((faq) => faq.categorie === category));
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const response = await faqApi.getStats();
      setStats(response.data.stats || response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <FormContainer
      title="❓ Questions Fréquemment Posées"
      subtitle="Trouvez les réponses aux questions les plus courantes sur Immo2000"
      maxWidth="medium"
    >
      {error && (
        <Alert
          isOpen={true}
          type="error"
          title="Erreur"
          message={error}
          dismissible={true}
          onClose={() => setError('')}
        />
      )}

      {/* Tab Navigation */}
      <div className="faq-tabs">
        <button
          className={`tab-button ${tabValue === 0 ? 'active' : ''}`}
          onClick={() => setTabValue(0)}
        >
          📚 Parcourir les FAQs
        </button>
        <button
          className={`tab-button ${tabValue === 1 ? 'active' : ''}`}
          onClick={() => {
            setTabValue(1);
            if (stats === null) loadStats();
          }}
        >
          📊 Statistiques
        </button>
      </div>

      {/* Tab 1: Browse FAQs */}
      {tabValue === 0 && (
        <div className="faq-browse">
          <Input
            label="Rechercher dans les FAQs"
            type="text"
            name="search"
            placeholder="Ex: comment acheter un bien..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />

          {loading ? (
            <div className="faq-loading">
              <div className="spinner"></div>
              <p>Chargement des FAQs...</p>
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="faq-empty">
              <p>
                {searchTerm
                  ? 'Aucune FAQ ne correspond à votre recherche'
                  : 'Aucune FAQ disponible'}
              </p>
            </div>
          ) : (
            <>
              {/* Category Filters */}
              {categories.length > 1 && (
                <div className="faq-categories">
                  <span className="categories-label">Catégories:</span>
                  <button
                    className={`category-chip ${!selectedCategory ? 'active' : ''}`}
                    onClick={() => handleCategoryFilter('')}
                  >
                    Toutes
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      className={`category-chip ${selectedCategory === category ? 'active' : ''}`}
                      onClick={() => handleCategoryFilter(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}

              {/* FAQ Accordion */}
              <div className="faq-list">
                {filteredFaqs.map((faq, index) => (
                  <FAQAccordion
                    key={faq.faq_id || index}
                    faq={faq}
                    index={index}
                  />
                ))}
              </div>

              {/* Summary */}
              <div className="faq-summary">
                <p>
                  <strong>{filteredFaqs.length} FAQ{filteredFaqs.length > 1 ? 's' : ''}</strong>
                  {selectedCategory && ` - Catégorie: ${selectedCategory}`}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 2: Statistics */}
      {tabValue === 1 && (
        <div className="faq-stats">
          {statsLoading ? (
            <div className="faq-loading">
              <div className="spinner"></div>
              <p>Chargement des statistiques...</p>
            </div>
          ) : stats ? (
            <div className="stats-grid">
              {/* Total FAQs */}
              <Card variant="elevated">
                <div className="stat-card">
                  <div className="stat-label">Total FAQs</div>
                  <div className="stat-value">{stats.total_faqs || 0}</div>
                </div>
              </Card>

              {/* Total Categories */}
              <Card variant="elevated">
                <div className="stat-card">
                  <div className="stat-label">Catégories</div>
                  <div className="stat-value">{stats.total_categories || 0}</div>
                </div>
              </Card>

              {/* Category Distribution */}
              {stats.category_distribution && stats.category_distribution.length > 0 && (
                <Card variant="elevated" interactive>
                  <div className="stat-section">
                    <h3>📊 FAQs par Catégorie</h3>
                    {stats.category_distribution.map((cat, idx) => (
                      <div key={idx} className="distribution-item">
                        <div className="distribution-header">
                          <span className="dist-category">{cat.categorie}</span>
                          <span className="dist-count">
                            {cat.count} FAQ{cat.count > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="distribution-bar">
                          <div
                            className="distribution-fill"
                            style={{
                              width: `${(cat.count / (stats.total_faqs || 1)) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Popular Questions */}
              {stats.popular_questions && stats.popular_questions.length > 0 && (
                <Card variant="elevated" interactive>
                  <div className="stat-section">
                    <h3>⭐ Questions Populaires</h3>
                    <ol className="popular-questions">
                      {stats.popular_questions.map((q, idx) => (
                        <li key={idx}>
                          <div className="question-text">{q.question}</div>
                          <div className="question-views">
                            👁️ {q.views || 0} vue{(q.views || 0) > 1 ? 's' : ''}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <div className="faq-empty">
              <p>Aucune donnée statistique disponible</p>
            </div>
          )}
        </div>
      )}
    </FormContainer>
  );
};

/**
 * FAQ Accordion Component
 */
function FAQAccordion({ faq, index }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`faq-accordion ${isOpen ? 'open' : ''}`}>
      <button
        className="faq-accordion-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="accordion-icon">▶</span>
        <span className="accordion-question">{faq.question}</span>
      </button>
      {isOpen && (
        <div className="faq-accordion-content">
          <p className="accordion-answer">{faq.reponse}</p>
          {faq.categorie && (
            <div className="accordion-category">📂 {faq.categorie}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default FAQPage;
