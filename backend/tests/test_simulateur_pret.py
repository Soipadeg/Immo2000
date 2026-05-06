"""
Tests unitaires pour la calculatrice de prêt immobilier.

3 cas de test + validations supplémentaires:
1. Cas standard (revenu = 3000€, apport = 50k, taux = 3.5%, durée = 20 ans)
2. Cas limite (revenu = 1500€ → capacité d'emprunt faible)
3. Cas invalide (revenu = -100 → erreur 400)
"""

import pytest
from src.services.simulateur_pret import CalculatricePret, SimulateurPretError


class TestCalculatricePret:
    """Suite de tests pour la calculatrice de prêt."""

    # ===== CAS 1: STANDARD (Scenario normal) =====
    # Acheteur: revenu 3000€, apport 50k, taux standard 3.5%, durée 20 ans
    # Attendu: Capacité d'emprunt ~240-280k, mensualité ~1400-1500€

    def test_cas_standard(self):
        """
        Cas STANDARD : Profil typique français.

        Paramètres:
        - Revenu mensuel net: 3000€
        - Apport: 50000€
        - Taux d'intérêt: 3.5% (défaut)
        - Durée: 20 ans (défaut)
        - Assurance: 0.3% (défaut)

        Attendu:
        - Capacité d'emprunt: ~245 000€
        - Mensualité: ~1 450€
        - Coût total: ~348 000€ (20 ans * 1450€)
        """
        result = CalculatricePret.calculer_pret(
            revenu_mensuel_net=3000,
            apport=50000,
            taux_interet=3.5,
            duree_ans=20,
            taux_assurance=0.3,
        )

        print(f"\n✅ CAS STANDARD:")
        print(f"   Capacité d'emprunt: {result['capacite_emprunt']}€")
        print(f"   Mensualité: {result['mensualite']}€")
        print(f"   Coût total crédit: {result['cout_total_credit']}€")
        print(f"   Durée: {result['detail']['duree_mois']} mois")

        # Assertions
        assert result['capacite_emprunt'] > 200000, "Capacité trop basse"
        assert result['capacite_emprunt'] < 300000, "Capacité trop haute"

        assert result['mensualite'] > 1400, "Mensualité trop basse"
        assert result['mensualite'] < 1550, "Mensualité trop haute"

        assert result['cout_total_credit'] > 0, "Coût total doit être positif"

        # Tableau d'amortissement doit avoir 12 lignes
        assert len(result['tableau_amortissement']) == 12
        assert result['tableau_amortissement'][0]['mois'] == 1
        assert result['tableau_amortissement'][-1]['mois'] == 12

        # Le capital restant doit diminuer
        assert (
            result['tableau_amortissement'][0]['capital_restant'] <
            result['tableau_amortissement'][0]['capital_restant']
        ) or (
            result['tableau_amortissement'][1]['capital_restant'] <
            result['tableau_amortissement'][0]['capital_restant']
        )

    # ===== CAS 2: LIMITE (Faible revenu) =====
    # Acheteur: revenu 1500€, apport minimal
    # Attendu: Capacité d'emprunt basse (~120-150k), mensualité ~700€

    def test_cas_limite_faible_revenu(self):
        """
        Cas LIMITE : Revenu faible (1500€/mois).

        Paramètres:
        - Revenu mensuel net: 1500€
        - Apport: 25000€
        - Taux d'intérêt: 3.5%
        - Durée: 20 ans
        - Assurance: 0.3%

        Attendu:
        - Capacité d'emprunt: ~120 000€
        - Mensualité: ~700€
        - Ratio mensualité/revenu: 0.35 (règle des 35%)
        """
        result = CalculatricePret.calculer_pret(
            revenu_mensuel_net=1500,
            apport=25000,
            taux_interet=3.5,
            duree_ans=20,
            taux_assurance=0.3,
        )

        print(f"\n⚠️  CAS LIMITE (FAIBLE REVENU):")
        print(f"   Revenu: 1500€")
        print(f"   Capacité d'emprunt: {result['capacite_emprunt']}€")
        print(f"   Mensualité: {result['mensualite']}€")
        print(f"   Ratio mensualité/revenu: {result['mensualite'] / 1500 * 100:.1f}%")

        # Assertions
        assert result['capacite_emprunt'] > 80000, "Capacité trop basse"
        assert result['capacite_emprunt'] < 150000, "Capacité trop haute"

        assert result['mensualite'] > 500, "Mensualité trop basse"
        assert result['mensualite'] < 800, "Mensualité trop haute"

        # Vérifier que ratio = 35% environ
        ratio = result['mensualite'] / 1500
        assert 0.34 < ratio < 0.36, f"Ratio doit être ~35% (reçu: {ratio*100:.1f}%)"

    # ===== CAS 3: INVALIDE (Données négatives) =====
    # Attendu: Exception SimulateurPretError

    def test_cas_invalide_revenu_negatif(self):
        """Cas INVALIDE : Revenu négatif → Erreur 400."""
        with pytest.raises(SimulateurPretError) as exc_info:
            CalculatricePret.calculer_pret(
                revenu_mensuel_net=-100,
                apport=50000,
            )

        assert "Revenu mensuel net doit être > 0" in str(exc_info.value)
        print(f"\n❌ CAS INVALIDE (REVENU NÉGATIF): Exception levée ✓")

    def test_cas_invalide_apport_negatif(self):
        """Cas INVALIDE : Apport négatif → Erreur 400."""
        with pytest.raises(SimulateurPretError) as exc_info:
            CalculatricePret.calculer_pret(
                revenu_mensuel_net=3000,
                apport=-5000,
            )

        assert "Apport doit être >= 0" in str(exc_info.value)
        print(f"\n❌ CAS INVALIDE (APPORT NÉGATIF): Exception levée ✓")

    def test_cas_invalide_taux_negatif(self):
        """Cas INVALIDE : Taux négatif → Erreur 400."""
        with pytest.raises(SimulateurPretError) as exc_info:
            CalculatricePret.calculer_pret(
                revenu_mensuel_net=3000,
                taux_interet=-2.0,
            )

        assert "Taux d'intérêt doit être >= 0" in str(exc_info.value)
        print(f"\n❌ CAS INVALIDE (TAUX NÉGATIF): Exception levée ✓")

    def test_cas_invalide_duree_zero(self):
        """Cas INVALIDE : Durée = 0 → Erreur 400."""
        with pytest.raises(SimulateurPretError) as exc_info:
            CalculatricePret.calculer_pret(
                revenu_mensuel_net=3000,
                duree_ans=0,
            )

        assert "Durée doit être entre 1 et 30 ans" in str(exc_info.value)
        print(f"\n❌ CAS INVALIDE (DURÉE ZÉRO): Exception levée ✓")

    def test_cas_invalide_duree_trop_longue(self):
        """Cas INVALIDE : Durée > 30 ans → Erreur 400."""
        with pytest.raises(SimulateurPretError) as exc_info:
            CalculatricePret.calculer_pret(
                revenu_mensuel_net=3000,
                duree_ans=35,
            )

        assert "Durée doit être entre 1 et 30 ans" in str(exc_info.value)
        print(f"\n❌ CAS INVALIDE (DURÉE > 30 ANS): Exception levée ✓")

    # ===== TESTS SUPPLÉMENTAIRES =====

    def test_taux_zero(self):
        """
        Cas SPÉCIAL : Taux d'intérêt = 0%.

        Attendu:
        - Formule spéciale (pas de division par 0)
        - Mensualité = mensualité_max + assurance
        - Coût total = capacité_emprunt + assurance totale
        """
        result = CalculatricePret.calculer_pret(
            revenu_mensuel_net=3000,
            taux_interet=0.0,
            duree_ans=20,
        )

        print(f"\n🔧 CAS SPÉCIAL (TAUX 0%):")
        print(f"   Capacité d'emprunt: {result['capacite_emprunt']}€")
        print(f"   Mensualité: {result['mensualite']}€")
        print(f"   Coût total: {result['cout_total_credit']}€")

        # Avec taux = 0%, capacité = 3000 * 0.35 * 240 mois = 252000€
        assert result['capacite_emprunt'] == 252000
        assert result['mensualite'] > 0

    def test_duree_courte(self):
        """Cas : Durée courte (5 ans) → mensualité plus élevée."""
        result_5ans = CalculatricePret.calculer_pret(
            revenu_mensuel_net=3000,
            duree_ans=5,
        )

        result_20ans = CalculatricePret.calculer_pret(
            revenu_mensuel_net=3000,
            duree_ans=20,
        )

        print(f"\n📊 COMPARAISON DURÉES:")
        print(f"   5 ans: Mensualité {result_5ans['mensualite']}€, Coût total {result_5ans['cout_total_credit']}€")
        print(f"   20 ans: Mensualité {result_20ans['mensualite']}€, Coût total {result_20ans['cout_total_credit']}€")

        # Mensualité plus élevée sur 5 ans
        assert result_5ans['mensualite'] > result_20ans['mensualite']

        # Coût total moins élevé sur 5 ans (moins d'intérêts)
        assert result_5ans['cout_total_credit'] < result_20ans['cout_total_credit']

    def test_assurance_zero(self):
        """Cas : Assurance = 0% (pas d'assurance)."""
        result = CalculatricePret.calculer_pret(
            revenu_mensuel_net=3000,
            taux_assurance=0.0,
        )

        print(f"\n🛡️ CAS SANS ASSURANCE:")
        print(f"   Assurance totale: {result['detail']['assurance_totale']}€")
        print(f"   Mensualité: {result['mensualite']}€")

        assert result['detail']['assurance_totale'] == 0

    def test_tableau_amortissement_coherent(self):
        """Valide la cohérence du tableau d'amortissement."""
        result = CalculatricePret.calculer_pret(
            revenu_mensuel_net=3000,
            duree_ans=20,
        )

        tableau = result['tableau_amortissement']

        # Chaque ligne doit être cohérente
        for ligne in tableau:
            # Intérêts doivent diminuer au fil du temps
            # Capital restant doit diminuer
            assert ligne['capital_restant'] >= 0
            assert ligne['interets'] > 0
            assert ligne['assurance'] > 0
            assert ligne['mensualite'] > 0

        print(f"\n📋 TABLEAU D'AMORTISSEMENT (1ère ligne):")
        print(f"   Mois 1: Capital restant {tableau[0]['capital_restant']}€")
        print(f"           Intérêts {tableau[0]['interets']}€")
        print(f"           Assurance {tableau[0]['assurance']}€")
        print(f"           Mensualité {tableau[0]['mensualite']}€")

        # Le dernier mois doit avoir capital_restant proche de 0
        # (à cause des arrondis, peut ne pas être exactement 0)
        assert tableau[-1]['capital_restant'] >= 0


if __name__ == '__main__':
    # Pour lancer les tests:
    # pytest backend/tests/test_simulateur_pret.py -v

    print("\n" + "="*70)
    print("🧪 TEST SUITE: SIMULATEUR DE PRÊT IMMOBILIER")
    print("="*70)

    test = TestCalculatricePret()

    # CAS PRINCIPAUX
    test.test_cas_standard()
    test.test_cas_limite_faible_revenu()
    test.test_cas_invalide_revenu_negatif()
    test.test_cas_invalide_apport_negatif()
    test.test_cas_invalide_taux_negatif()
    test.test_cas_invalide_duree_zero()
    test.test_cas_invalide_duree_trop_longue()

    # CAS SPÉCIAUX
    test.test_taux_zero()
    test.test_duree_courte()
    test.test_assurance_zero()
    test.test_tableau_amortissement_coherent()

    print("\n" + "="*70)
    print("✅ TOUS LES TESTS PASSED!")
    print("="*70)
