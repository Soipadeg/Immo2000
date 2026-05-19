"""
Modèles SQLAlchemy pour les notaires partenaires et transactions.

Structure:
- Notaire: Profil notaire partenaire
- NotaireSpecialisation: Spécialisations du notaire
- TransactionNotaire: Lien entre offre/compromis et notaire
- DocumentNotaire: Documents validés par notaire
- HistoriqueNotaire: Audit trail des actions notaire
"""

from datetime import datetime
from sqlalchemy import Index, ForeignKey, CheckConstraint, Text, JSON
from src.auth.models import db


class Notaire(db.Model):
    """Modèle pour un profil notaire partenaire."""

    __tablename__ = "notaires"

    # Clé primaire
    notaire_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # FK vers utilisateur (pour authentification)
    utilisateur_id = db.Column(
        db.Integer,
        ForeignKey("utilisateurs.utilisateur_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Infos professionnelles
    etude_notariale = db.Column(db.String(255), nullable=False)
    numero_rpps = db.Column(db.String(20), nullable=False, unique=True, index=True)
    adresse_etude = db.Column(db.String(500), nullable=False)
    code_postal_etude = db.Column(db.String(10), nullable=False, index=True)
    ville_etude = db.Column(db.String(100), nullable=False, index=True)
    latitude = db.Column(db.Float, nullable=True)  # Pour carte interactive
    longitude = db.Column(db.Float, nullable=True)

    # Contact
    telephone = db.Column(db.String(20), nullable=False)
    email_professionnel = db.Column(db.String(255), nullable=False, unique=True, index=True)

    # Zone de couverture (JSON pour flexibilité)
    zone_geographique = db.Column(JSON, nullable=False)  # {"villes": [...], "codes_postaux": [...]}

    # Spécialisations (relation)
    # spécialisations = db.relationship('NotaireSpecialisation', backref='notaire', cascade='all, delete-orphan')

    # Disponibilités (JSON: {'lundi': '09:00-17:00', ...})
    disponibilites = db.Column(JSON, nullable=True)

    # Statut partenaire
    partenaire_actif = db.Column(db.Boolean, default=True, index=True)
    date_activation_partenaire = db.Column(db.DateTime, default=datetime.utcnow)
    date_desactivation_partenaire = db.Column(db.DateTime, nullable=True)

    # Capacité dossiers
    max_dossiers_simultanees = db.Column(db.Integer, default=10)
    delai_traitement_jours = db.Column(db.Integer, default=5)  # SLA

    # Métadonnées
    note_moyenne = db.Column(db.Float, default=0.0)  # 0-5 stars
    dossiers_traites = db.Column(db.Integer, default=0)

    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    date_modification = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    transactions = db.relationship('TransactionNotaire', backref='notaire', cascade='all, delete-orphan')
    historique = db.relationship('HistoriqueNotaire', backref='notaire', cascade='all, delete-orphan')

    # Indices
    __table_args__ = (
        Index('ix_notaire_partenaire_active', 'partenaire_actif', 'ville_etude'),
        Index('ix_notaire_zone', 'ville_etude', 'code_postal_etude'),
    )

    def __repr__(self):
        return f"<Notaire {self.numero_rpps} - {self.etude_notariale}>"

    def est_disponible(self):
        """Vérifie si le notaire peut accepter de nouveaux dossiers."""
        dossiers_actifs = db.session.query(TransactionNotaire).filter(
            TransactionNotaire.notaire_id == self.notaire_id,
            TransactionNotaire.statut.in_(['en_attente_validation', 'modifications_demandees'])
        ).count()
        return self.partenaire_actif and dossiers_actifs < self.max_dossiers_simultanees

    def to_dict(self):
        """Sérialisation pour API."""
        return {
            'notaire_id': self.notaire_id,
            'etude_notariale': self.etude_notariale,
            'numero_rpps': self.numero_rpps,
            'adresse_etude': self.adresse_etude,
            'ville_etude': self.ville_etude,
            'telephone': self.telephone,
            'email_professionnel': self.email_professionnel,
            'partenaire_actif': self.partenaire_actif,
            'note_moyenne': self.note_moyenne,
            'dossiers_traites': self.dossiers_traites,
            'delai_traitement_jours': self.delai_traitement_jours,
        }


class NotaireSpecialisation(db.Model):
    """Spécialisations d'un notaire."""

    __tablename__ = "notaire_specialisations"

    specialisation_id = db.Column(db.Integer, primary_key=True)
    notaire_id = db.Column(
        db.Integer,
        ForeignKey("notaires.notaire_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Types: vente, succession, donation, divorce, etc.
    type_specialisation = db.Column(db.String(50), nullable=False)

    date_ajout = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index('ix_notaire_spec', 'notaire_id', 'type_specialisation'),
    )


class TransactionNotaire(db.Model):
    """Association entre une transaction/offre et un notaire."""

    __tablename__ = "transaction_notaire"

    transaction_notaire_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # FK vers offre (depuis module offres)
    offre_id = db.Column(
        db.Integer,
        ForeignKey("offres.offre_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # FK vers notaire
    notaire_id = db.Column(
        db.Integer,
        ForeignKey("notaires.notaire_id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # FK vers annonce (pour contexte bien)
    annonce_id = db.Column(
        db.Integer,
        ForeignKey("annonces.annonce_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # FK vers vendeur
    vendeur_id = db.Column(
        db.Integer,
        ForeignKey("utilisateurs.utilisateur_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # FK vers acheteur
    acheteur_id = db.Column(
        db.Integer,
        ForeignKey("utilisateurs.utilisateur_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Statuts: en_attente_selection, en_attente_validation, modifications_demandees,
    #          validee, refusee, rejetee, finalisee
    statut = db.Column(
        db.String(50),
        nullable=False,
        default='en_attente_selection',
        index=True
    )

    # Prix compromis
    prix_compromis = db.Column(db.Numeric(12, 2), nullable=False)

    # Frais Phase 6f.notaire
    frais_notaire = db.Column(db.Numeric(12, 2), nullable=True)
    frais_immo2000 = db.Column(db.Numeric(12, 2), nullable=True)

    # Compromis de vente Phase 6f.notaire
    compromis_url = db.Column(db.String(500), nullable=True)
    docusign_envelope_id = db.Column(db.String(100), nullable=True)

    # Dates clés
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    date_assignation_notaire = db.Column(db.DateTime, nullable=True)
    date_envoi_notification = db.Column(db.DateTime, nullable=True)
    date_validation = db.Column(db.DateTime, nullable=True)
    date_completion = db.Column(db.DateTime, nullable=True)
    date_validation_frais = db.Column(db.DateTime, nullable=True)
    compromis_genere_le = db.Column(db.DateTime, nullable=True)
    date_envoi_signature = db.Column(db.DateTime, nullable=True)

    # SLA
    delai_demande = db.Column(db.DateTime, nullable=True)  # Deadline pour répondre
    delai_validation = db.Column(db.DateTime, nullable=True)  # Deadline pour valider

    # Commentaires/Raisons
    raison_refus = db.Column(Text, nullable=True)
    modifications_demandees = db.Column(Text, nullable=True)
    notes_internes = db.Column(Text, nullable=True)

    # Relations
    documents = db.relationship('DocumentNotaire', backref='transaction', cascade='all, delete-orphan')
    historique = db.relationship('HistoriqueNotaire', backref='transaction', cascade='all, delete-orphan')

    # Note: Indices sont créés dans les migrations (migration 018)
    # __table_args__ = (
    #     Index('ix_transaction_notaire_statut', 'statut'),
    #     Index('ix_transaction_notaire_dates', 'date_creation', 'date_assignation_notaire'),
    # )

    def __repr__(self):
        return f"<TransactionNotaire {self.transaction_notaire_id} - {self.statut}>"

    def to_dict(self):
        """Sérialisation pour API."""
        return {
            'transaction_notaire_id': self.transaction_notaire_id,
            'offre_id': self.offre_id,
            'annonce_id': self.annonce_id,
            'notaire_id': self.notaire_id,
            'vendeur_id': self.vendeur_id,
            'acheteur_id': self.acheteur_id,
            'statut': self.statut,
            'prix_compromis': float(self.prix_compromis) if self.prix_compromis else 0,
            'date_creation': self.date_creation.isoformat() if self.date_creation else None,
            'date_validation': self.date_validation.isoformat() if self.date_validation else None,
        }


class DocumentNotaire(db.Model):
    """Documents associés à une transaction notaire."""

    __tablename__ = "document_notaire"

    document_notaire_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # FK vers transaction
    transaction_notaire_id = db.Column(
        db.Integer,
        ForeignKey("transaction_notaire.transaction_notaire_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Types: compromis, dpe, diagnostics, etat_parasitaire, identite_vendeur, identite_acheteur, etc.
    type_document = db.Column(db.String(50), nullable=False, index=True)
    nom_original = db.Column(db.String(255), nullable=False)
    url_fichier = db.Column(db.String(500), nullable=False)
    taille_bytes = db.Column(db.Integer, nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)

    # Validation
    validé_par_notaire = db.Column(db.Boolean, default=False)
    date_validation = db.Column(db.DateTime, nullable=True)
    commentaires_notaire = db.Column(Text, nullable=True)

    # Chiffrement (flag)
    chiffre = db.Column(db.Boolean, default=False)

    date_upload = db.Column(db.DateTime, default=datetime.utcnow)
    date_modification = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Sérialisation pour API."""
        return {
            'document_notaire_id': self.document_notaire_id,
            'type_document': self.type_document,
            'nom_original': self.nom_original,
            'taille_bytes': self.taille_bytes,
            'validé_par_notaire': self.validé_par_notaire,
            'date_upload': self.date_upload.isoformat() if self.date_upload else None,
        }


class HistoriqueNotaire(db.Model):
    """Audit trail pour les actions des notaires."""

    __tablename__ = "historique_notaire"

    historique_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # FK vers transaction
    transaction_notaire_id = db.Column(
        db.Integer,
        ForeignKey("transaction_notaire.transaction_notaire_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # FK vers notaire
    notaire_id = db.Column(
        db.Integer,
        ForeignKey("notaires.notaire_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Types d'action: creation, assignment, view, validate, request_modifications, reject, complete
    type_action = db.Column(db.String(50), nullable=False)
    description = db.Column(Text, nullable=False)

    # Métadonnées
    ancien_statut = db.Column(db.String(50), nullable=True)
    nouveau_statut = db.Column(db.String(50), nullable=True)

    # IP et user agent (audit)
    ip_address = db.Column(db.String(50), nullable=True)
    user_agent = db.Column(db.String(500), nullable=True)

    date_action = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        Index('ix_historique_transaction', 'transaction_notaire_id', 'date_action'),
    )

    def to_dict(self):
        """Sérialisation pour API."""
        return {
            'historique_id': self.historique_id,
            'type_action': self.type_action,
            'description': self.description,
            'ancien_statut': self.ancien_statut,
            'nouveau_statut': self.nouveau_statut,
            'date_action': self.date_action.isoformat() if self.date_action else None,
        }


class DisponibiliteNotaire(db.Model):
    """Créneaux de disponibilité pour les notaires (bonus: calendrier)."""

    __tablename__ = "disponibilite_notaire"

    disponibilite_id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # FK vers notaire
    notaire_id = db.Column(
        db.Integer,
        ForeignKey("notaires.notaire_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Créneau bloqué/disponible
    date_debut = db.Column(db.DateTime, nullable=False)
    date_fin = db.Column(db.DateTime, nullable=False)

    # Type: disponible, indisponible, conge, formation
    type_creneau = db.Column(db.String(50), default='disponible')

    # Description (ex: "Congé été 2026")
    description = db.Column(db.String(255), nullable=True)

    date_creation = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index('ix_disponibilite_notaire_dates', 'notaire_id', 'date_debut', 'date_fin'),
    )
