import React, { useState, useRef } from 'react';
import { useCalendarExport } from '../hooks/useCalendarExport';
import '../styles/CalendarExportPage.css';

/**
 * Page pour exporter/importer le calendrier des rendez-vous
 */
const CalendarExportPage = () => {
  const { exporting, error, exportAsICal, exportAsVCalendar, exportAsCSV, importCalendar } =
    useCalendarExport();
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  const handleExportICal = async () => {
    await exportAsICal();
  };

  const handleExportVCalendar = async () => {
    await exportAsVCalendar();
  };

  const handleExportCSV = async () => {
    await exportAsCSV();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportError(null);

      // Vérifier l'extension du fichier
      const validExtensions = ['.ics', '.ical', '.vcs', '.csv'];
      const fileName = file.name.toLowerCase();
      const hasValidExtension = validExtensions.some((ext) => fileName.endsWith(ext));

      if (!hasValidExtension) {
        setImportError('Format de fichier non supporté. Utilisez .ics, .ical, .vcs ou .csv');
        return;
      }

      await importCalendar(file);
    }
  };

  return (
    <div className="calendar-export-page">
      {/* En-tête */}
      <div className="export-header">
        <h1>📅 Exporter / Importer Calendrier</h1>
        <p className="subtitle">
          Exportez vos rendez-vous dans différents formats ou importez un calendrier
        </p>
      </div>

      {/* Erreurs */}
      {error && <div className="error-banner">{error}</div>}
      {importError && <div className="error-banner">{importError}</div>}

      <div className="export-content">
        {/* Section Export */}
        <section className="export-section">
          <h2>📤 Exporter les Rendez-vous</h2>
          <p className="section-description">
            Téléchargez vos rendez-vous dans le format de votre choix
          </p>

          <div className="export-options">
            {/* Option iCal */}
            <div className="export-card">
              <div className="card-icon">📆</div>
              <div className="card-content">
                <h3>iCalendar (.ics)</h3>
                <p>
                  Format standard pour les calendriers. Compatible avec Outlook, Google
                  Calendar, Apple Calendar, etc.
                </p>
                <ul className="features-list">
                  <li>✓ Tous les rendez-vous</li>
                  <li>✓ Détails complets</li>
                  <li>✓ Rappels inclus</li>
                </ul>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleExportICal}
                disabled={exporting}
              >
                📥 Exporter iCal
              </button>
            </div>

            {/* Option vCalendar */}
            <div className="export-card">
              <div className="card-icon">🗓️</div>
              <div className="card-content">
                <h3>vCalendar (.vcs)</h3>
                <p>Format classique pour l'échange de calendriers. Compatible avec la plupart des clients.</p>
                <ul className="features-list">
                  <li>✓ Format compact</li>
                  <li>✓ Événements simples</li>
                  <li>✓ Large compatibilité</li>
                </ul>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleExportVCalendar}
                disabled={exporting}
              >
                📥 Exporter vCal
              </button>
            </div>

            {/* Option CSV */}
            <div className="export-card">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <h3>Spreadsheet (.csv)</h3>
                <p>
                  Format tabulaire pour Excel, Google Sheets, etc. Parfait pour l'analyse
                  des données.
                </p>
                <ul className="features-list">
                  <li>✓ Ouvre dans Excel</li>
                  <li>✓ Format tabulaire</li>
                  <li>✓ Facile à analyser</li>
                </ul>
              </div>
              <button className="btn btn-primary" onClick={handleExportCSV} disabled={exporting}>
                📥 Exporter CSV
              </button>
            </div>
          </div>
        </section>

        {/* Divider */}
        <hr className="export-divider" />

        {/* Section Import */}
        <section className="export-section">
          <h2>📤 Importer un Calendrier</h2>
          <p className="section-description">
            Importez des rendez-vous depuis un autre calendrier
          </p>

          <div className="import-zone">
            <div className="import-icon">📁</div>
            <h3>Sélectionner un fichier</h3>
            <p>Formats supportés: .ics, .ical, .vcs, .csv</p>

            <button
              className="btn btn-secondary"
              onClick={handleImportClick}
              disabled={exporting}
            >
              🔍 Choisir un fichier
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".ics,.ical,.vcs,.csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <p className="import-hint">
              💡 Les rendez-vous importés seront ajoutés à votre calendrier existant
            </p>
          </div>
        </section>

        {/* Section Guide */}
        <section className="export-section">
          <h2>📖 Guide d'Utilisation</h2>

          <div className="guide-grid">
            <div className="guide-card">
              <h4>🏠 Exporter vers Google Calendar</h4>
              <ol>
                <li>Cliquez sur "Exporter iCal"</li>
                <li>Ouvrez Google Calendar</li>
                <li>Cliquez sur le bouton "+" et "Importer &amp; Exporter"</li>
                <li>Sélectionnez le fichier téléchargé</li>
              </ol>
            </div>

            <div className="guide-card">
              <h4>📌 Exporter vers Outlook</h4>
              <ol>
                <li>Cliquez sur "Exporter vCal"</li>
                <li>Ouvrez Outlook</li>
                <li>Allez à "Fichier" &gt; "Ouvrir &amp; Exporter"</li>
                <li>Importez le fichier .vcs</li>
              </ol>
            </div>

            <div className="guide-card">
              <h4>🍎 Exporter vers Apple Calendar</h4>
              <ol>
                <li>Cliquez sur "Exporter iCal"</li>
                <li>Double-cliquez sur le fichier .ics</li>
                <li>Confirmez l'ajout au calendrier</li>
                <li>Les rendez-vous apparaissent automatiquement</li>
              </ol>
            </div>

            <div className="guide-card">
              <h4>📊 Exporter vers Excel</h4>
              <ol>
                <li>Cliquez sur "Exporter CSV"</li>
                <li>Ouvrez le fichier dans Excel</li>
                <li>Formatez comme vous le souhaitez</li>
                <li>Sauvegardez en .xlsx ou autres formats</li>
              </ol>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CalendarExportPage;
