-- Migration 010: Créer la table messages pour la messagerie P2P
-- Cette migration crée la table messages pour permettre aux utilisateurs
-- de se contacter à propos des annonces immobilières.

CREATE TABLE IF NOT EXISTS messages (
    message_id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE,
    annonce_id INTEGER NOT NULL REFERENCES annonces(annonce_id) ON DELETE CASCADE,
    contenu VARCHAR(2000) NOT NULL,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    lu BOOLEAN DEFAULT FALSE,
    date_lecture TIMESTAMP WITH TIME ZONE,
    supprime_par_expediteur BOOLEAN DEFAULT FALSE,
    supprime_par_destinataire BOOLEAN DEFAULT FALSE,
    CONSTRAINT messages_content_not_empty CHECK (LENGTH(TRIM(contenu)) > 0),
    CONSTRAINT messages_max_length CHECK (LENGTH(contenu) <= 2000)
);

-- Index pour les requêtes courantes
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_annonce_id ON messages(annonce_id);
CREATE INDEX idx_messages_date_creation ON messages(date_creation DESC);
CREATE INDEX idx_messages_lu ON messages(lu);

-- Index composite pour les recherches de conversation
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id, annonce_id);

-- Aide à la migration
-- Pour exécuter cette migration :
-- psql -U postgres -d immo2000 -f 010_create_messages_table.sql
