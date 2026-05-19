"""
Simulateur de prêt immobilier avec intégration Pretto/Melo
"""

import httpx
import os
import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class LoanSimulator:
    """Simulateur de prêt immobilier"""

    def __init__(self, provider='pretto'):
        """
        Initialiser le simulateur.

        Args:
            provider: 'pretto' ou 'melo'
        """
        self.provider = provider

        if provider == 'pretto':
            self.api_key = os.getenv('PRETTO_API_KEY')
            self.base_url = 'https://api.pretto.fr/v1'
        elif provider == 'melo':
            self.api_key = os.getenv('MELO_API_KEY')
            self.base_url = 'https://api.melo.fr/v1'
        else:
            raise ValueError(f"Provider non supporté: {provider}")

        if not self.api_key:
            logger.warning(f"API key manquante pour {provider}")

    async def simulate_loan(
        self,
        amount: float,
        duration: int,
        rate: Optional[float] = None,
        contribution: Optional[float] = None
    ) -> Dict:
        """
        Simuler un prêt bancaire.

        Args:
            amount: Montant du prêt en euros
            duration: Durée en années
            rate: Taux d'intérêt annuel (%) - optionnel, utilise le taux du marché sinon
            contribution: Apport personnel en euros (optionnel)

        Returns:
            Dict avec les résultats de la simulation
        """
        try:
            if self.provider == 'pretto':
                return await self._simulate_pretto(amount, duration, rate, contribution)
            elif self.provider == 'melo':
                return await self._simulate_melo(amount, duration, rate, contribution)

        except Exception as e:
            logger.error(f"Erreur simulation prêt: {str(e)}")
            return self._fallback_simulation(amount, duration, rate)

    async def _simulate_pretto(
        self,
        amount: float,
        duration: int,
        rate: Optional[float] = None,
        contribution: Optional[float] = None
    ) -> Dict:
        """Simuler via l'API Pretto"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "amount": int(amount),
            "duration_months": duration * 12,
        }

        if rate:
            payload["annual_rate"] = float(rate)

        if contribution:
            payload["contribution"] = int(contribution)

        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                f"{self.base_url}/simulations",
                headers=headers,
                json=payload
            )

            if response.status_code not in [200, 201]:
                logger.error(f"Erreur Pretto API: {response.text}")
                return self._fallback_simulation(amount, duration, rate)

            data = response.json()

            # Parser la réponse Pretto
            return {
                'provider': 'pretto',
                'amount': amount,
                'duration': duration,
                'rate': data.get('annual_rate', rate or 3.5),
                'monthly_payment': data.get('monthly_payment', 0),
                'total_cost': data.get('total_cost', 0),
                'total_interest': data.get('total_interest', 0),
                'apr': data.get('apr', 0),  # Taux Effectif Global
                'amortization_table': self._generate_amortization_table(
                    amount, duration, data.get('annual_rate', rate or 3.5)
                )
            }

    async def _simulate_melo(
        self,
        amount: float,
        duration: int,
        rate: Optional[float] = None,
        contribution: Optional[float] = None
    ) -> Dict:
        """Simuler via l'API Melo"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "loan_amount": int(amount),
            "loan_duration": duration,
        }

        if rate:
            payload["interest_rate"] = float(rate)

        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                f"{self.base_url}/simulations",
                headers=headers,
                json=payload
            )

            if response.status_code not in [200, 201]:
                logger.error(f"Erreur Melo API: {response.text}")
                return self._fallback_simulation(amount, duration, rate)

            data = response.json()

            # Parser la réponse Melo
            return {
                'provider': 'melo',
                'amount': amount,
                'duration': duration,
                'rate': data.get('rate', rate or 3.5),
                'monthly_payment': data.get('monthly_payment', 0),
                'total_cost': data.get('total_cost', 0),
                'total_interest': data.get('total_interest', 0),
                'apr': data.get('apr', 0),
                'amortization_table': self._generate_amortization_table(
                    amount, duration, data.get('rate', rate or 3.5)
                )
            }

    def _fallback_simulation(
        self,
        amount: float,
        duration: int,
        rate: Optional[float] = None
    ) -> Dict:
        """
        Simulation par défaut (calculs mathématiques simples).
        Utilisée en cas d'erreur API ou si les clés sont manquantes.
        """
        rate = rate or 3.5  # Taux par défaut
        monthly_rate = rate / 100 / 12
        months = duration * 12

        # Formule de calcul de mensualité
        if monthly_rate == 0:
            monthly_payment = amount / months
        else:
            monthly_payment = amount * (monthly_rate * (1 + monthly_rate) ** months) / \
                             ((1 + monthly_rate) ** months - 1)

        total_cost = monthly_payment * months
        total_interest = total_cost - amount

        return {
            'provider': 'fallback',
            'amount': amount,
            'duration': duration,
            'rate': rate,
            'monthly_payment': round(monthly_payment, 2),
            'total_cost': round(total_cost, 2),
            'total_interest': round(total_interest, 2),
            'apr': rate,  # Approximation du TEG
            'amortization_table': self._generate_amortization_table(amount, duration, rate)
        }

    def _generate_amortization_table(
        self,
        amount: float,
        duration: int,
        rate: float,
        rows: int = 360  # Limiter à 30 ans max
    ) -> List[Dict]:
        """
        Générer un tableau d'amortissement.

        Args:
            amount: Montant du prêt
            duration: Durée en années
            rate: Taux d'intérêt annuel (%)
            rows: Nombre de lignes (mois) à retourner

        Returns:
            Liste des lignes du tableau d'amortissement
        """
        monthly_rate = rate / 100 / 12
        months = min(duration * 12, rows)

        # Calculer la mensualité
        if monthly_rate == 0:
            monthly_payment = amount / months
        else:
            monthly_payment = amount * (monthly_rate * (1 + monthly_rate) ** months) / \
                             ((1 + monthly_rate) ** months - 1)

        table = []
        remaining_capital = amount

        for month in range(1, months + 1):
            # Intérêts du mois
            interests = remaining_capital * monthly_rate

            # Capital remboursé
            capital_paid = monthly_payment - interests

            # Nouveau capital restant
            remaining_capital -= capital_paid

            table.append({
                'month': month,
                'monthly_payment': round(monthly_payment, 2),
                'interests': round(interests, 2),
                'capital_paid': round(capital_paid, 2),
                'remaining_capital': round(max(0, remaining_capital), 2)
            })

        return table

    async def get_market_rates(self) -> Dict[str, float]:
        """Obtenir les taux du marché actuels"""
        try:
            if self.provider == 'pretto':
                headers = {"Authorization": f"Bearer {self.api_key}"}
                async with httpx.AsyncClient(timeout=10) as client:
                    response = await client.get(
                        f"{self.base_url}/market-rates",
                        headers=headers
                    )
                    if response.status_code == 200:
                        return response.json()

            # Taux par défaut si API indisponible
            return {
                '15_years': 3.2,
                '20_years': 3.4,
                '25_years': 3.6,
                '30_years': 3.8,
            }

        except Exception as e:
            logger.error(f"Erreur récupération taux: {str(e)}")
            return {}


# Initialiser le simulateur
def create_loan_simulator(provider='pretto') -> LoanSimulator:
    """Créer une instance du simulateur"""
    return LoanSimulator(provider)


# Calculs additionnels utiles

def calculate_loan_capacity(
    annual_income: float,
    savings: float,
    debt_ratio: float = 0.35
) -> Dict:
    """
    Calculer la capacité d'emprunt d'un utilisateur.

    Args:
        annual_income: Revenu annuel en euros
        savings: Épargne disponible en euros
        debt_ratio: Ratio d'endettement maximal (par défaut 35%)

    Returns:
        Dict avec capacité d'emprunt, apport, etc.
    """
    # Capacité mensuelle = revenu mensuel × ratio
    monthly_income = annual_income / 12
    max_monthly_payment = monthly_income * debt_ratio

    # Estimation du montant empruntable (avec un taux de 3.5%)
    # En utilisant une approximation simplifiée
    estimated_loan = max_monthly_payment * 240  # ~20 ans

    # Apport recommandé (10-20% du prix)
    recommended_price = (estimated_loan + savings) / 0.85

    return {
        'annual_income': annual_income,
        'monthly_income': round(monthly_income, 2),
        'max_monthly_payment': round(max_monthly_payment, 2),
        'estimated_loan_capacity': round(estimated_loan, 2),
        'savings': savings,
        'recommended_property_price': round(recommended_price, 2),
        'savings_ratio': round((savings / recommended_price) * 100, 1) if recommended_price > 0 else 0,
    }


def compare_loans(simulations: List[Dict]) -> Dict:
    """
    Comparer plusieurs simulations de prêt.

    Args:
        simulations: Liste des résultats de simulation

    Returns:
        Analyse comparative
    """
    if not simulations:
        return {}

    return {
        'cheapest': min(simulations, key=lambda x: x.get('total_interest', float('inf'))),
        'fastest': min(simulations, key=lambda x: x.get('duration', float('inf'))),
        'lowest_rate': min(simulations, key=lambda x: x.get('rate', float('inf'))),
        'total_count': len(simulations),
        'average_rate': sum(s.get('rate', 0) for s in simulations) / len(simulations) if simulations else 0,
    }
