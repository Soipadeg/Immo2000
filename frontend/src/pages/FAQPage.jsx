/**
 * Page FAQ - Questions Fréquemment Posées
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
  Grid,
  InputAdornment,
  Tabs,
  Tab,
  LinearProgress,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Search as SearchIcon } from '@mui/icons-material';
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* En-tête */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
          ❓ Questions Fréquemment Posées
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Trouvez les réponses aux questions les plus courantes sur Immo2000
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="Parcourir les FAQs" />
        <Tab label="Statistiques" />
      </Tabs>

      {/* Onglet 1: Parcourir les FAQs */}
      {tabValue === 0 && (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Rechercher dans les FAQs..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Paper>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : filteredFaqs.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {searchTerm
                  ? 'Aucune FAQ ne correspond à votre recherche'
                  : 'Aucune FAQ disponible'}
              </Typography>
            </Paper>
          ) : (
            <>
              {/* Filtres de catégories */}
              {categories.length > 1 && (
                <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="body2" sx={{ alignSelf: 'center', mr: 1 }}>
                    <strong>Catégories:</strong>
                  </Typography>
                  <Box
                    onClick={() => handleCategoryFilter('')}
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      cursor: 'pointer',
                      backgroundColor: !selectedCategory ? '#1976d2' : '#f0f0f0',
                      color: !selectedCategory ? 'white' : 'black',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      '&:hover': { opacity: 0.8 },
                    }}
                  >
                    Toutes
                  </Box>
                  {categories.map((category) => (
                    <Box
                      key={category}
                      onClick={() => handleCategoryFilter(category)}
                      sx={{
                        px: 2,
                        py: 1,
                        borderRadius: 2,
                        cursor: 'pointer',
                        backgroundColor: selectedCategory === category ? '#1976d2' : '#f0f0f0',
                        color: selectedCategory === category ? 'white' : 'black',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        '&:hover': { opacity: 0.8 },
                      }}
                    >
                      {category}
                    </Box>
                  ))}
                </Box>
              )}

              {/* Liste des FAQs */}
              <Box sx={{ mb: 3 }}>
                {filteredFaqs.map((faq, index) => (
                  <Accordion key={faq.faq_id || index} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: '1.05rem',
                          flex: 1,
                        }}
                      >
                        {faq.question}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                        {faq.reponse}
                      </Typography>
                      {faq.categorie && (
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 2,
                            color: '#1976d2',
                            fontWeight: 600,
                          }}
                        >
                          📂 {faq.categorie}
                        </Typography>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>

              {/* Résumé */}
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: '#f5f5f5',
                  textAlign: 'center',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Affichage de {filteredFaqs.length} FAQ{selectedCategory && ` - Catégorie: ${selectedCategory}`}
                </Typography>
              </Paper>
            </>
          )}
        </>
      )}
      {tabValue === 1 && (
        <Box>
          {statsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : stats ? (
            <Grid container spacing={2}>
              {/* Total FAQs */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total FAQs
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.total_faqs || 0}
                  </Typography>
                </Paper>
              </Grid>

              {/* Total Catégories */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Catégories
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.total_categories || 0}
                  </Typography>
                </Paper>
              </Grid>

              {/* Distribution par catégorie */}
              {stats.category_distribution && stats.category_distribution.length > 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        📊 FAQs par Catégorie
                      </Typography>
                      {stats.category_distribution.map((cat, idx) => (
                        <Box key={idx} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {cat.categorie}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {cat.count} FAQ{cat.count > 1 ? 's' : ''}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(cat.count / (stats.total_faqs || 1)) * 100}
                          />
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Questions populaires */}
              {stats.popular_questions && stats.popular_questions.length > 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        ⭐ Questions Populaires
                      </Typography>
                      {stats.popular_questions.map((q, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            mb: 1.5,
                            pb: 1.5,
                            borderBottom: idx < stats.popular_questions.length - 1 ? '1px solid #eee' : 'none',
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {idx + 1}. {q.question}
                          </Typography>
                          <Chip
                            label={`${q.views || 0} vues`}
                            size="small"
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Aucune donnée statistique disponible
              </Typography>
            </Paper>
          )}
        </Box>
      )}
    </Container>
  );
};

export default FAQPage;
