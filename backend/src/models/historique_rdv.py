"""
Modèle SQLAlchemy pour l'historique des rendez-vous.

Enregistre chaque changement de statut/date/message pour chaque RDV.
Permet de créer une timeline des négociations.
"""

from datetime import datetime
from sqlalchemy import Index, ForeignKey
from src.auth.models import db


class HistoriqueRDV(db.Model):
    """
    Modèle historique RDV mappé à la table 'historique_rdv' de SQLite.

    Attributes:
        historique_id (int): Identifiant unique (PK).
        rdv_id (int): FK vers rendez_vous.rdv_id.
        utilisateur_id (int): FK vers utilisateurs.utilisateur_id (qui a fait l'action).

        action (str): Type d'action
            - 'creation': RDV créé
            - 'acceptation': Date acceptée
            - 'refus': RDV refusé
            - 'contre_proposition': Nouvelle date proposée

        date_proposée (datetime): Date proposée pour cette action (peut être NULL).
        message (str): Message accompagnant l'action (peut être NULL).

        date_action (datetime): Quand l'action a eu lieu.
    """

    __tablename__ = "historique_rdv"

    historique_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    rdv_id = db.Column(
        db.Integer,
        ForeignKey("rendez_vous.rdv_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    utilisateur_id = db.Column(
        db.Integer,
        ForeignKey("utilisateurs.utilisateur_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    action = db.Column(
        db.String(50),
        nullable=False,
        # Valeurs: 'creation', 'acceptation', 'refus', 'contre_proposition'
        index=True
    )

    date_proposée = db.Column(db.DateTime(timezone=True), nullable=True)
    message = db.Column(db.Text, nullable=True)
    date_action = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)

    # Indexes
    __table_args__ = (
        Index('idx_rdv_date', 'rdv_id', 'date_action'),
    )

    def to_dict(self):
        """Convertir en dictionnaire pour la sérialisation JSON"""
        return {
            'historique_id': self.historique_id,
            'rdv_id': self.rdv_id,
            'utilisateur_id': self.utilisateur_id,
            'action': self.action,
            'date_proposée': self.date_proposée.isoformat() if self.date_proposée else None,
            'message': self.message,
            'date_action': self.date_action.isoformat() if self.date_action else None,
        }

    def __repr__(self):
        return f"<HistoriqueRDV {self.historique_id} - RDV{self.rdv_id} - {self.action}>"
