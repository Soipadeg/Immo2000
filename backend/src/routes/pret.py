"""
Routes pour le simulateur de prêt immobilier
"""

from flask import Blueprint, request, jsonify, render_template
from flask_login import login_required, current_user
from src.utils.loan import create_loan_simulator, calculate_loan_capacity, compare_loans
from src.utils.cache import cache_annonces
import logging

logger = logging.getLogger(__name__)

pret_bp = Blueprint('pret', __name__, url_prefix='/api/pret')


@pret_bp.route('/simulate', methods=['POST'])
def simulate_loan():
    """
    Simuler un prêt immobilier.

    Body JSON:
    {
        "amount": 300000,
        "duration": 25,
        "rate": 3.5 (optionnel),
        "contribution": 50000 (optionnel),
        "provider": "pretto" ou "melo" (optionnel, défaut: pretto)
    }
    """
    try:
        data = request.get_json()

        # Validation
        if not data.get('amount') or not data.get('duration'):
            return jsonify({'error': 'amount et duration requis'}), 400

        amount = float(data.get('amount'))
        duration = int(data.get('duration'))
        rate = data.get('rate')
        contribution = data.get('contribution')
        provider = data.get('provider', 'pretto')

        if amount <= 0 or duration <= 0 or duration > 50:
            return jsonify({'error': 'Montant et durée invalides'}), 400

        # Créer le simulateur
        simulator = create_loan_simulator(provider)

        # Simuler
        result = simulator._fallback_simulation(amount, duration, rate)

        return jsonify(result), 200

    except ValueError as e:
        logger.error(f"Erreur validation: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Erreur simulation: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur lors de la simulation'}), 500


@pret_bp.route('/amortization', methods=['POST'])
def get_amortization():
    """
    Obtenir le tableau d'amortissement détaillé.

    Body JSON:
    {
        "amount": 300000,
        "duration": 25,
        "rate": 3.5,
        "rows": 360 (optionnel)
    }
    """
    try:
        data = request.get_json()

        if not data.get('amount') or not data.get('duration') or not data.get('rate'):
            return jsonify({'error': 'amount, duration et rate requis'}), 400

        amount = float(data.get('amount'))
        duration = int(data.get('duration'))
        rate = float(data.get('rate'))
        rows = int(data.get('rows', 360))

        simulator = create_loan_simulator()
        table = simulator._generate_amortization_table(amount, duration, rate, rows)

        return jsonify({
            'total_rows': len(table),
            'amortization_table': table
        }), 200

    except ValueError as e:
        logger.error(f"Erreur tableau amortissement (paramètres invalides): {str(e)}", exc_info=True)
        return jsonify({'error': 'Paramètres invalides'}), 400
    except Exception as e:
        logger.error(f"Erreur tableau amortissement: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur lors de la génération du tableau'}), 500


@pret_bp.route('/capacity', methods=['POST'])
def calculate_capacity():
    """
    Calculer la capacité d'emprunt.

    Body JSON:
    {
        "annual_income": 50000,
        "savings": 30000,
        "debt_ratio": 0.35 (optionnel)
    }
    """
    try:
        data = request.get_json()

        if not data.get('annual_income'):
            return jsonify({'error': 'annual_income requis'}), 400

        annual_income = float(data.get('annual_income'))
        savings = float(data.get('savings', 0))
        debt_ratio = float(data.get('debt_ratio', 0.35))

        if annual_income <= 0:
            return jsonify({'error': 'Revenu invalide'}), 400

        if not 0 < debt_ratio < 1:
            return jsonify({'error': 'Ratio d\'endettement invalide'}), 400

        result = calculate_loan_capacity(annual_income, savings, debt_ratio)

        return jsonify(result), 200

    except ValueError as e:
        logger.error(f"Erreur calcul capacité (paramètres invalides): {str(e)}", exc_info=True)
        return jsonify({'error': 'Paramètres invalides'}), 400
    except Exception as e:
        logger.error(f"Erreur calcul capacité: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur lors du calcul'}), 500


@pret_bp.route('/compare', methods=['POST'])
def compare_simulations():
    """
    Comparer plusieurs simulations.

    Body JSON:
    {
        "simulations": [
            {"amount": 300000, "duration": 20, "rate": 3.2},
            {"amount": 300000, "duration": 25, "rate": 3.5},
            ...
        ]
    }
    """
    try:
        data = request.get_json()

        if not data.get('simulations'):
            return jsonify({'error': 'simulations requises'}), 400

        simulations = []
        for sim in data.get('simulations', []):
            amount = float(sim.get('amount'))
            duration = int(sim.get('duration'))
            rate = float(sim.get('rate', 3.5))

            simulator = create_loan_simulator()
            result = simulator._fallback_simulation(amount, duration, rate)
            simulations.append(result)

        comparison = compare_loans(simulations)

        return jsonify({
            'simulations': simulations,
            'comparison': comparison
        }), 200

    except ValueError as e:
        logger.error(f"Erreur comparaison (paramètres invalides): {str(e)}", exc_info=True)
        return jsonify({'error': 'Paramètres invalides'}), 400
    except Exception as e:
        logger.error(f"Erreur comparaison: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur lors de la comparaison'}), 500


@pret_bp.route('/market-rates', methods=['GET'])
def get_market_rates():
    """Obtenir les taux du marché"""
    try:
        simulator = create_loan_simulator()
        rates = {
            '15_years': 3.2,
            '20_years': 3.4,
            '25_years': 3.6,
            '30_years': 3.8,
        }

        return jsonify({
            'timestamp': datetime.utcnow().isoformat(),
            'rates': rates
        }), 200

    except ValueError as e:
        logger.error(f"Erreur taux (erreur de calcul): {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur de calcul'}), 500
    except Exception as e:
        logger.error(f"Erreur taux: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur lors de la récupération des taux'}), 500


@pret_bp.route('/simulator', methods=['GET'])
@login_required
def simulator_page():
    """Page HTML du simulateur"""
    return render_template('simulator/pret.html')


@pret_bp.route('/save-simulation', methods=['POST'])
@login_required
def save_simulation():
    """
    Sauvegarder une simulation pour consultation ultérieure.

    Body JSON:
    {
        "name": "Ma première simulation",
        "amount": 300000,
        "duration": 25,
        "rate": 3.5
    }
    """
    try:
        from src.auth.models import db, UserData
        from datetime import datetime

        data = request.get_json()

        if not data.get('name') or not data.get('amount'):
            return jsonify({'error': 'Données incomplètes'}), 400

        simulation = {
            'name': data.get('name'),
            'amount': data.get('amount'),
            'duration': data.get('duration'),
            'rate': data.get('rate'),
            'created_at': datetime.utcnow().isoformat()
        }

        # Sauvegarder dans les données utilisateur
        user_data = UserData.query.filter_by(user_id=current_user.id).first()
        if not user_data:
            user_data = UserData(user_id=current_user.id)
            db.session.add(user_data)

        if not user_data.loan_simulations:
            user_data.loan_simulations = []

        user_data.loan_simulations.append(simulation)
        db.session.commit()

        logger.info(f"Simulation sauvegardée pour l'utilisateur {current_user.id}")
        return jsonify({'success': True, 'simulation_id': len(user_data.loan_simulations)}), 201

    except ValueError as e:
        logger.error(f"Erreur sauvegarde simulation (données invalides): {str(e)}", exc_info=True)
        return jsonify({'error': 'Données invalides'}), 400
    except Exception as e:
        logger.error(f"Erreur sauvegarde simulation: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur lors de la sauvegarde'}), 500


@pret_bp.route('/saved-simulations', methods=['GET'])
@login_required
def get_saved_simulations():
    """Récupérer les simulations sauvegardées"""
    try:
        from src.auth.models import UserData

        user_data = UserData.query.filter_by(user_id=current_user.id).first()
        simulations = user_data.loan_simulations if user_data else []

        return jsonify({
            'count': len(simulations),
            'simulations': simulations
        }), 200

    except ValueError as e:
        logger.error(f"Erreur récupération simulations (utilisateur introuvable): {str(e)}", exc_info=True)
        return jsonify({'error': 'Utilisateur introuvable'}), 404
    except Exception as e:
        logger.error(f"Erreur récupération simulations: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur lors de la récupération'}), 500


@pret_bp.route('/delete-simulation/<int:simulation_id>', methods=['DELETE'])
@login_required
def delete_simulation(simulation_id):
    """Supprimer une simulation sauvegardée"""
    try:
        from src.auth.models import db, UserData

        user_data = UserData.query.filter_by(user_id=current_user.id).first()
        if not user_data or not user_data.loan_simulations:
            return jsonify({'error': 'Simulation non trouvée'}), 404

        if 0 <= simulation_id < len(user_data.loan_simulations):
            del user_data.loan_simulations[simulation_id]
            db.session.commit()
            return jsonify({'success': True}), 200

        return jsonify({'error': 'Simulation non trouvée'}), 404

    except ValueError as e:
        logger.error(f"Erreur suppression simulation (ID invalide): {str(e)}", exc_info=True)
        return jsonify({'error': 'ID invalide'}), 400
    except Exception as e:
        logger.error(f"Erreur suppression simulation: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erreur lors de la suppression'}), 500


from datetime import datetime
