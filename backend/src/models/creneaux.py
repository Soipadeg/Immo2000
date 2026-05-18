"""
Modèle CreneauDisponible pour la gestion des créneaux de disponibilité des vendeurs.

Un créneauDisponible représente une plage horaire où un vendeur est disponible pour une visite.
Les acheteurs peuvent choisir parmi ces créneaux pour envoyer une demande de RDV.
"""

from sqlalchemy import Column, Integer, DateTime, String, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from src.auth.models import db
from datetime import datetime


class CreneauDisponible(db.Model):
        est_disponible (bool): True si le créneau est encore disponible, False s'il est réservé.
        date_creation (datetime): Quand le créneau a été créé.
        utilisateur (relationship): Relation vers le vendeur.
    """

    __tablename__ = "creneaux_disponibles"

    id = Column(Integer, primary_key=True)
    utilisateur_id = Column(Integer, ForeignKey("utilisateurs.utilisateur_id", ondelete="CASCADE"), nullable=False)
    jour = Column(DateTime, nullable=False)  # Date du créneau
    heure_debut = Column(String(5), nullable=False)  # Format "HH:MM"
    heure_fin = Column(String(5), nullable=False)  # Format "HH:MM"
    est_disponible = Column(Boolean, default=True)
    date_creation = Column(DateTime, default=datetime.utcnow)

    # Relations
    utilisateur = relationship("User", back_populates="creneaux_disponibles")
    rendez_vous = relationship("RendezVous", back_populates="creneau")

    # Index pour optimiser les requêtes par utilisateur et date
    __table_args__ = (
        Index("idx_creneau_utilisateur_jour", "utilisateur_id", "jour"),
        Index("idx_creneau_disponible", "est_disponible"),
    )

    def to_dict(self) -> dict:
        """
        Convertit le créneau en dictionnaire JSON.

        Returns:
            dict: Dictionnaire contenant les informations du créneau.
        """
        return {
            "id": self.id,
            "utilisateur_id": self.utilisateur_id,
            "jour": self.jour.isoformat() if self.jour else None,
            "heure_debut": self.heure_debut,
            "heure_fin": self.heure_fin,
            "est_disponible": self.est_disponible,
            "date_creation": self.date_creation.isoformat() if self.date_creation else None,
        }

    def __repr__(self) -> str:
        return f"<CreneauDisponible {self.id} - {self.jour.date()} {self.heure_debut}-{self.heure_fin}>"
