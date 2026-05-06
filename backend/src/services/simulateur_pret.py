"""
Service de simulation de prêt immobilier.

Ce module contient la logique de calcul pour estimer:
- La capacité d'emprunt (règle des 35% du revenu)
- La mensualité
- Le coût total du crédit
- Le tableau d'amortissement

Pour Gilbert (le canard):
  - Capacité d'emprunt = combien vous pouvez emprunter max
  - Mensualité = ce que vous payez chaque mois
  - Coût total = tout ce que vous paierez (prêt + intérêts + assurance)
  - Tableau d'amortissement = détail mois par mois
"""

import math
from typing import Dict, List, Tuple


class SimulateurPretError(Exception):
    """Exception pour les erreurs de simulation de prêt."""
    pass


class CalculatricePret:
    """
    Calculatrice de simulation de prêt immobilier.

    Utilise les formules bancaires françaises standard pour calculer
    la capacité d'emprunt, les mensualités et l'amortissement.
    """

    # Constantes
    TAUX_INTERET_DEFAUT = 3.5  # % annuel
    DUREE_ANS_DEFAUT = 20  # années
    TAUX_ASSURANCE_DEFAUT = 0.3  # % annuel
    RATIO_CAPACITE = 0.35  # 35% du revenu (règle bancaire française)
    TAUX_USURE_MAX = 15.0  # Taux maximum légal pour éviter l'usure

    @staticmethod
    def valider_entrees(
        revenu_mensuel_net: float,
        apport: float,
        taux_interet: float,
        duree_ans: int,
        taux_assurance: float,
    ) -> None:
        """
        Valide les paramètres d'entrée.

        Args:
            revenu_mensuel_net: Revenu mensuel net en euros
            apport: Apport personnel en euros
            taux_interet: Taux d'intérêt annuel en %
            duree_ans: Durée du prêt en années
            taux_assurance: Taux d'assurance annuel en %

        Raises:
            SimulateurPretError: Si une valeur est invalide
        """

        if revenu_mensuel_net <= 0:
            raise SimulateurPretError(
                f"Revenu mensuel net doit être > 0 (reçu: {revenu_mensuel_net})"
            )

        if apport < 0:
            raise SimulateurPretError(
                f"Apport doit être >= 0 (reçu: {apport})"
            )

        if taux_interet < 0:
            raise SimulateurPretError(
                f"Taux d'intérêt doit être >= 0 (reçu: {taux_interet})"
            )

        if taux_interet > CalculatricePret.TAUX_USURE_MAX:
            raise SimulateurPretError(
                f"Taux d'intérêt dépasse le taux d'usure ({CalculatricePret.TAUX_USURE_MAX}%)"
            )

        if duree_ans <= 0 or duree_ans > 30:
            raise SimulateurPretError(
                f"Durée doit être entre 1 et 30 ans (reçu: {duree_ans})"
            )

        if taux_assurance < 0:
            raise SimulateurPretError(
                f"Taux d'assurance doit être >= 0 (reçu: {taux_assurance})"
            )

    @staticmethod
    def calculer_pret(
        revenu_mensuel_net: float,
        apport: float = 0,
        taux_interet: float = TAUX_INTERET_DEFAUT,
        duree_ans: int = DUREE_ANS_DEFAUT,
        taux_assurance: float = TAUX_ASSURANCE_DEFAUT,
    ) -> Dict:
        """
        Calcule les paramètres d'un prêt immobilier.

        Args:
            revenu_mensuel_net: Revenu mensuel net en euros
            apport: Apport personnel en euros (défaut: 0)
            taux_interet: Taux d'intérêt annuel en % (défaut: 3.5)
            duree_ans: Durée du prêt en années (défaut: 20)
            taux_assurance: Taux d'assurance annuel en % (défaut: 0.3)

        Returns:
            Dict contenant:
            - capacite_emprunt: Montant max empruntable (euros)
            - mensualite: Mensualité (euros)
            - cout_total_credit: Coût total du crédit (euros)
            - tableau_amortissement: Liste des 12 premières lignes (optionnel)
            - detail: Dict avec détails des calculs (pour déboguer)

        Raises:
            SimulateurPretError: Si les paramètres sont invalides

        Formules utilisées:

        1. Mensualité maximale (règle des 35%)
           mensualite_max = revenu_mensuel_net * 0.35

        2. Capacité d'emprunt
           taux_mensuel = (taux_interet / 100) / 12
           duree_mois = duree_ans * 12
           capacite_emprunt = (mensualite_max * (1 - (1 + taux_mensuel)^(-duree_mois))) / taux_mensuel

           Cas spécial: si taux_interet = 0
           capacite_emprunt = mensualite_max * duree_mois

        3. Assurance totale
           assurance_totale = (capacite_emprunt * (taux_assurance / 100)) * duree_ans

        4. Coût total du crédit
           cout_total = (mensualite * duree_mois) + assurance_totale

        Example:
            >>> result = CalculatricePret.calculer_pret(3000, 50000, 3.5, 20, 0.3)
            >>> print(f"Emprunt max: {result['capacite_emprunt']}€")
            >>> print(f"Mensualité: {result['mensualite']}€")
        """

        # 1️⃣ VALIDATION
        CalculatricePret.valider_entrees(
            revenu_mensuel_net, apport, taux_interet, duree_ans, taux_assurance
        )

        # 2️⃣ CALCUL DES VARIABLES INTERMÉDIAIRES
        taux_mensuel = (taux_interet / 100) / 12
        duree_mois = duree_ans * 12
        mensualite_max = revenu_mensuel_net * CalculatricePret.RATIO_CAPACITE

        # 3️⃣ CAPACITÉ D'EMPRUNT
        # Formule du crédit amortissable inverse
        if taux_mensuel == 0:
            # Cas spécial: taux = 0%
            capacite_emprunt = mensualite_max * duree_mois
        else:
            # Formule standard
            coefficient = (1 - (1 + taux_mensuel) ** (-duree_mois)) / taux_mensuel
            capacite_emprunt = mensualite_max * coefficient

        # 4️⃣ ASSURANCE TOTALE
        # Assurance = taux_assurance % du capital emprunté par an
        assurance_annuelle = capacite_emprunt * (taux_assurance / 100)
        assurance_totale = assurance_annuelle * duree_ans

        # 5️⃣ MENSUALITÉ COMPLÈTE (avec assurance)
        assurance_mensuelle = assurance_totale / duree_mois
        mensualite = mensualite_max + assurance_mensuelle

        # 6️⃣ COÛT TOTAL DU CRÉDIT
        cout_total_credit = (mensualite * duree_mois)

        # 7️⃣ TABLEAU D'AMORTISSEMENT (12 premières lignes)
        tableau_amortissement = CalculatricePret._calculer_tableau_amortissement(
            capacite_emprunt,
            taux_mensuel,
            assurance_mensuelle,
            mensualite,
            duree_mois,
            nb_lignes=12,
        )

        # 8️⃣ RETOUR
        return {
            "capacite_emprunt": round(capacite_emprunt, 2),
            "mensualite": round(mensualite, 2),
            "cout_total_credit": round(cout_total_credit, 2),
            "tableau_amortissement": tableau_amortissement,
            # Détails pour déboguer
            "detail": {
                "revenu_mensuel_net": revenu_mensuel_net,
                "apport": apport,
                "taux_interet": taux_interet,
                "duree_ans": duree_ans,
                "taux_assurance": taux_assurance,
                "duree_mois": duree_mois,
                "taux_mensuel": round(taux_mensuel * 100, 4),  # % mensuel
                "mensualite_max": round(mensualite_max, 2),
                "assurance_mensuelle": round(assurance_mensuelle, 2),
                "assurance_totale": round(assurance_totale, 2),
                "interets_totaux": round(
                    (mensualite * duree_mois) - capacite_emprunt - assurance_totale, 2
                ),
            }
        }

    @staticmethod
    def _calculer_tableau_amortissement(
        capital_initial: float,
        taux_mensuel: float,
        assurance_mensuelle: float,
        mensualite: float,
        duree_mois: int,
        nb_lignes: int = 12,
    ) -> List[Dict]:
        """
        Calcule le tableau d'amortissement.

        Args:
            capital_initial: Capital emprunté
            taux_mensuel: Taux d'intérêt mensuel (décimal, ex: 0.0029)
            assurance_mensuelle: Montant mensuel d'assurance
            mensualite: Mensualité totale
            duree_mois: Durée totale en mois
            nb_lignes: Nombre de lignes à retourner (défaut: 12 pour 1 an)

        Returns:
            Liste de dicts avec colonnes: mois, capital_restant, interets, assurance, mensualite
        """
        tableau = []
        capital_restant = capital_initial

        # Limiter au nombre de mois disponibles
        mois_a_afficher = min(nb_lignes, duree_mois)

        for mois in range(1, mois_a_afficher + 1):
            # Intérêts du mois = capital restant * taux mensuel
            interets = capital_restant * taux_mensuel

            # Portion de capital remboursée = mensualité - intérêts - assurance
            capital_rembourse = mensualite - interets - assurance_mensuelle

            # Nouveau capital restant
            capital_restant -= capital_rembourse

            # Éviter les arrondis négatifs
            if capital_restant < 0:
                capital_restant = 0

            tableau.append({
                "mois": mois,
                "capital_restant": round(capital_restant, 2),
                "interets": round(interets, 2),
                "assurance": round(assurance_mensuelle, 2),
                "mensualite": round(mensualite, 2),
            })

        return tableau
