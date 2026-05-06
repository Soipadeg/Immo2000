/**
 * PDF Export Utility - Gère l'export des documents légaux en PDF
 */

class PDFExporter {
    /**
     * Exporter un document en PDF
     * @param {string} docType - Type du document ('cgu' ou 'privacy')
     */
    static exportPDF(docType) {
        const container = document.querySelector('.legal-content-wrapper');

        if (!container) {
            console.error('Document container not found');
            alert('Erreur : conteneur du document non trouvé');
            return;
        }

        // Configuration html2pdf
        const config = {
            margin: [10, 10, 10, 10],
            filename: this.getFilename(docType),
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
            pagebreak: { mode: 'avoid-all', before: '.page-break' }
        };

        // Générer PDF
        html2pdf().set(config).from(container).save();

        console.log(`✅ PDF exporté : ${config.filename}`);
    }

    /**
     * Obtenir le nom du fichier PDF
     * @param {string} docType - Type du document
     * @returns {string} Nom du fichier
     */
    static getFilename(docType) {
        const date = new Date();
        const year = date.getFullYear();

        switch(docType) {
            case 'cgu':
                return `Immo2000_CGU_${year}.pdf`;
            case 'privacy':
                return `Immo2000_Politique_Confidentialite_${year}.pdf`;
            default:
                return `Immo2000_Document_${year}.pdf`;
        }
    }

    /**
     * Vérifier si html2pdf est disponible
     */
    static isAvailable() {
        return typeof html2pdf !== 'undefined';
    }
}

// Exposer globalement
window.PDFExporter = PDFExporter;
