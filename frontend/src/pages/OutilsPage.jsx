import '../styles/OutilsPage.css';
import { Alert,Button,Input } from '@/components';
import React, { useState, useEffect } from 'react';
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
      <div maxWidth="lg">
        <div />
        <p>Chargement des outils...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div maxWidth="lg">
        <Alert severity="error">{error}</Alert>
      </div>
    );
  }

  return (
    <div maxWidth="lg">
      <div>
        <h4 variant="h4">
          🛠️ Outils Pratiques
        </h4>
        <p variant="body1">
          Utilisez nos outils pour faciliter vos démarches immobilières.
        </h4>
      </div>

      <div>
        <div
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default OutilsPage;
