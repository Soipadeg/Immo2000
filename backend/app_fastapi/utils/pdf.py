"""Utilitaires pour la génération de PDF."""
import pdfkit
from io import BytesIO
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def generer_compromis_pdf(
    transaction_data: dict,
    notaire_data: dict,
    vendeur_data: dict,
    acheteur_data: dict
) -> bytes:
    """
    Générer un PDF du compromis de vente.

    Args:
        transaction_data: Dict avec prix_final, frais_notaire, date_creation
        notaire_data: Dict avec nom, email, adresse du notaire
        vendeur_data: Dict avec nom, email, adresse du vendeur
        acheteur_data: Dict avec nom, email, adresse de l'acheteur

    Returns:
        Bytes du PDF généré
    """
    html_content = _generer_html_compromis(
        transaction_data, notaire_data, vendeur_data, acheteur_data
    )

    try:
        # Générer le PDF depuis le HTML
        pdf_bytes = pdfkit.from_string(
            html_content,
            False,  # Retourner les bytes au lieu d'écrire un fichier
            options={
                'page-size': 'A4',
                'margin-top': '0.75in',
                'margin-right': '0.75in',
                'margin-bottom': '0.75in',
                'margin-left': '0.75in',
                'encoding': 'UTF-8',
                'no-outline': None,
                'enable-local-file-access': None,
            }
        )
        logger.info(f"✅ PDF compromis généré ({len(pdf_bytes)} bytes)")
        return pdf_bytes
    except Exception as e:
        logger.error(f"❌ Erreur génération PDF: {e}")
        raise


def _generer_html_compromis(
    transaction_data: dict,
    notaire_data: dict,
    vendeur_data: dict,
    acheteur_data: dict
) -> str:
    """Générer le HTML du compromis de vente."""

    prix_final = transaction_data.get('prix_final', 0)
    frais_notaire = transaction_data.get('frais_notaire', 0)
    frais_immo2000 = transaction_data.get('frais_immo2000', 0)
    date_creation = transaction_data.get('date_creation', datetime.utcnow())
    bien_titre = transaction_data.get('bien_titre', 'Bien immobilier')
    bien_adresse = transaction_data.get('bien_adresse', '')
    bien_surface = transaction_data.get('bien_surface', 0)
    conditions_suspensives = transaction_data.get('conditions_suspensives', 'Aucune')

    if isinstance(date_creation, str):
        date_str = date_creation
    else:
        date_str = date_creation.strftime('%d/%m/%Y')

    total_a_payer = prix_final + frais_notaire + frais_immo2000

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
                color: #333;
            }}
            .container {{
                background-color: white;
                padding: 40px;
                max-width: 900px;
                margin: 0 auto;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }}
            h1 {{
                text-align: center;
                color: #1a1a1a;
                margin-bottom: 10px;
                font-size: 28px;
                border-bottom: 3px solid #007bff;
                padding-bottom: 10px;
            }}
            .document-ref {{
                text-align: center;
                color: #666;
                font-size: 12px;
                margin-bottom: 30px;
            }}
            h2 {{
                background-color: #f0f0f0;
                padding: 10px;
                margin-top: 30px;
                margin-bottom: 15px;
                border-left: 4px solid #007bff;
                font-size: 16px;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }}
            th, td {{
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
            }}
            th {{
                background-color: #e9ecef;
                font-weight: bold;
                font-size: 13px;
            }}
            tr:nth-child(even) {{
                background-color: #f9f9f9;
            }}
            .amount {{
                text-align: right;
                font-weight: bold;
            }}
            .total-row {{
                background-color: #e7f3ff;
                font-weight: bold;
            }}
            .total-row td {{
                border: 2px solid #007bff;
            }}
            .signature-section {{
                margin-top: 50px;
                display: flex;
                justify-content: space-around;
            }}
            .signature-block {{
                text-align: center;
                width: 30%;
            }}
            .signature-line {{
                margin-top: 60px;
                border-top: 1px solid #000;
                padding-top: 10px;
            }}
            .date-line {{
                margin-top: 30px;
                font-size: 12px;
                text-align: center;
                color: #666;
            }}
            .info-row {{
                margin-bottom: 8px;
                font-size: 13px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>COMPROMIS DE VENTE IMMOBILIÈRE</h1>
            <div class="document-ref">
                <strong>Document officiel</strong><br>
                Généré le: {date_str}
            </div>

            <h2>1. PARTIES CONTRACTANTES</h2>
            <table>
                <tr>
                    <th>Rôle</th>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Adresse</th>
                </tr>
                <tr>
                    <td><strong>Vendeur</strong></td>
                    <td>{vendeur_data.get('nom', 'N/A')}</td>
                    <td>{vendeur_data.get('email', 'N/A')}</td>
                    <td>{vendeur_data.get('adresse', 'N/A')}</td>
                </tr>
                <tr>
                    <td><strong>Acheteur</strong></td>
                    <td>{acheteur_data.get('nom', 'N/A')}</td>
                    <td>{acheteur_data.get('email', 'N/A')}</td>
                    <td>{acheteur_data.get('adresse', 'N/A')}</td>
                </tr>
                <tr>
                    <td><strong>Notaire</strong></td>
                    <td>{notaire_data.get('nom', 'N/A')}</td>
                    <td>{notaire_data.get('email', 'N/A')}</td>
                    <td>{notaire_data.get('adresse', 'N/A')}</td>
                </tr>
            </table>

            <h2>2. BIEN IMMOBILIER</h2>
            <div class="info-row"><strong>Titre:</strong> {bien_titre}</div>
            <div class="info-row"><strong>Adresse:</strong> {bien_adresse}</div>
            <div class="info-row"><strong>Surface:</strong> {bien_surface} m²</div>

            <h2>3. CONDITIONS SUSPENSIVES</h2>
            <div class="info-row">{conditions_suspensives}</div>

            <h2>4. DÉTAIL FINANCIER</h2>
            <table>
                <tr>
                    <th>Description</th>
                    <th style="width: 20%; text-align: right;">Montant (€)</th>
                </tr>
                <tr>
                    <td>Prix de vente du bien</td>
                    <td class="amount">{prix_final:,.2f}</td>
                </tr>
                <tr>
                    <td>Frais de notaire</td>
                    <td class="amount">{frais_notaire:,.2f}</td>
                </tr>
                <tr>
                    <td>Commission Immo2000 (2%)</td>
                    <td class="amount">{frais_immo2000:,.2f}</td>
                </tr>
                <tr class="total-row">
                    <td><strong>TOTAL À PAYER PAR L'ACHETEUR</strong></td>
                    <td class="amount"><strong>{total_a_payer:,.2f}</strong></td>
                </tr>
            </table>

            <h2>5. SIGNATURES</h2>
            <p style="margin-bottom: 40px;">
                Les parties reconnaissent avoir lu et approuvé les termes du présent compromis de vente.
            </p>

            <div class="signature-section">
                <div class="signature-block">
                    <strong>Vendeur</strong>
                    <div class="signature-line"></div>
                </div>
                <div class="signature-block">
                    <strong>Acheteur</strong>
                    <div class="signature-line"></div>
                </div>
                <div class="signature-block">
                    <strong>Notaire</strong>
                    <div class="signature-line"></div>
                </div>
            </div>

            <div class="date-line">
                <strong>Fait à Paris, le {date_str}</strong>
            </div>
        </div>
    </body>
    </html>
    """

    return html


def generer_pdf_simple(html_content: str) -> bytes:
    """
    Générer un PDF à partir de contenu HTML brut.

    Args:
        html_content: Contenu HTML à convertir

    Returns:
        Bytes du PDF généré
    """
    try:
        pdf_bytes = pdfkit.from_string(
            html_content,
            False,
            options={
                'page-size': 'A4',
                'margin-top': '0.75in',
                'margin-right': '0.75in',
                'margin-bottom': '0.75in',
                'margin-left': '0.75in',
                'encoding': 'UTF-8',
            }
        )
        return pdf_bytes
    except Exception as e:
        logger.error(f"❌ Erreur génération PDF simple: {e}")
        raise
