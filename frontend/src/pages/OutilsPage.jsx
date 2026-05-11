import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Paper,
  CircularProgress,
  Alert,
  Typography,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';

const OutilsPage = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOutils = async () => {
      try {
        setLoading(true);
        const response = await fetch('/outils/checklist_achat.md');
        if (!response.ok) {
          throw new Error('Failed to load outils');
        }
        const text = await response.text();
        setContent(text);
        setError('');
      } catch (err) {
        setError(`Erreur lors du chargement des outils: ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadOutils();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Chargement des outils...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
          🛠️ Outils Pratiques
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
          Utilisez nos outils pour faciliter vos démarches immobilières.
        </Typography>
      </Box>

      <Paper sx={{ borderRadius: 2, p: 3 }}>
        <Box
          sx={{
            '& h1': { fontSize: '1.8rem', fontWeight: 700, mt: 2, mb: 2 },
            '& h2': { fontSize: '1.4rem', fontWeight: 600, mt: 2.5, mb: 1.5 },
            '& h3': { fontSize: '1.2rem', fontWeight: 600, mt: 2, mb: 1 },
            '& p': { mb: 1.5, lineHeight: 1.6 },
            '& ul, & ol': { mb: 1.5, pl: 2 },
            '& li': { mb: 0.5 },
            '& code': {
              backgroundColor: '#f5f5f5',
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'monospace',
            },
            '& a': {
              color: '#1976d2',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            },
            '& blockquote': {
              borderLeft: '4px solid #1976d2',
              pl: 2,
              py: 1,
              my: 2,
              backgroundColor: '#f9f9f9',
              fontStyle: 'italic',
            },
            '& table': {
              width: '100%',
              borderCollapse: 'collapse',
              mb: 1.5,
            },
            '& th, & td': {
              border: '1px solid #ddd',
              padding: '8px 12px',
              textAlign: 'left',
            },
            '& th': {
              backgroundColor: '#f5f5f5',
              fontWeight: 600,
            },
          }}
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </Box>
      </Paper>
    </Container>
  );
};

export default OutilsPage;
