/**
 * Tests pour les pages du tunnel de création d'annonce
 * npm test -- CreerAnnonce
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

import CreerAnnonceEtape1 from '../pages/CreerAnnonceEtape1';
import CreerAnnonceEtape2 from '../pages/CreerAnnonceEtape2';
import CreerAnnonceEtape3 from '../pages/CreerAnnonceEtape3';
import CreerAnnonceEtape4 from '../pages/CreerAnnonceEtape4';

// Mock les fonctions API
vi.mock('../services/api', () => ({
  createBrouillonAnnonce: vi.fn(),
  register: vi.fn(),
  signContratExclusivite: vi.fn(),
  completerAnnonce: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CreerAnnonceEtape1 - Adresse et Photos', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('Affiche le formulaire d\'étape 1', () => {
    render(
      <BrowserRouter>
        <CreerAnnonceEtape1 />
      </BrowserRouter>
    );

    expect(screen.getByText(/Adresse et photos/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Titre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Adresse/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Code postal/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ville/i)).toBeInTheDocument();
  });

  it('Valide que le code postal doit être 5 chiffres', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <CreerAnnonceEtape1 />
      </BrowserRouter>
    );

    const codePotalInput = screen.getByLabelText(/Code postal/i);
    await user.type(codePotalInput, '750');

    const submitButton = screen.getByRole('button', { name: /Continuer/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/5 chiffres/i)).toBeInTheDocument();
    });
  });

  it('Valide que au moins 1 photo est requise', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <CreerAnnonceEtape1 />
      </BrowserRouter>
    );

    // Remplir le formulaire sans photo
    await user.type(screen.getByLabelText(/Titre/i), 'Bel appart');
    await user.type(screen.getByLabelText(/Adresse/i), '123 Rue');
    await user.type(screen.getByLabelText(/Code postal/i), '75001');
    await user.type(screen.getByLabelText(/Ville/i), 'Paris');

    const submitButton = screen.getByRole('button', { name: /Continuer/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Au moins 1 photo/i)).toBeInTheDocument();
    });
  });

  it('Affiche un message d\'erreur si fichier trop gros', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <CreerAnnonceEtape1 />
      </BrowserRouter>
    );

    // Créer un fichier fictif très gros
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });

    const fileInput = screen.getByLabelText(/Ajouter des photos/i);
    await user.upload(fileInput, largeFile);

    await waitFor(() => {
      expect(screen.getByText(/maximum 10 MB/i)).toBeInTheDocument();
    });
  });

  it('Affiche un message d\'erreur pour format invalide', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <CreerAnnonceEtape1 />
      </BrowserRouter>
    );

    // Créer un fichier avec mauvais format
    const invalidFile = new File(['content'], 'invalid.txt', {
      type: 'text/plain',
    });

    const fileInput = screen.getByLabelText(/Ajouter des photos/i);
    await user.upload(fileInput, invalidFile);

    await waitFor(() => {
      expect(screen.getByText(/Format non autorisé/i)).toBeInTheDocument();
    });
  });

  it('Permet supprimer une photo', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <CreerAnnonceEtape1 />
      </BrowserRouter>
    );

    // Ajouter une photo
    const validFile = new File(['content'], 'photo.jpg', {
      type: 'image/jpeg',
    });

    const fileInput = screen.getByLabelText(/Ajouter des photos/i);
    await user.upload(fileInput, validFile);

    await waitFor(() => {
      expect(screen.getByText(/photo.jpg/i)).toBeInTheDocument();
    });

    // Supprimer la photo
    const deleteButton = screen.getByRole('button', { name: /Supprimer/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText(/photo.jpg/i)).not.toBeInTheDocument();
    });
  });
});

describe('CreerAnnonceEtape2 - Création de Compte', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('Affiche le formulaire d\'étape 2', () => {
    render(
      <BrowserRouter>
        <CreerAnnonceEtape2 />
      </BrowserRouter>
    );

    expect(screen.getByText(/Création de compte/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument();
  });

  it('Affiche la force du mot de passe en temps réel', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <CreerAnnonceEtape2 />
      </BrowserRouter>
    );

    const passwordInput = screen.getByLabelText(/Mot de passe/i);

    // Tape un mot de passe faible
    await user.type(passwordInput, 'weak');
    await waitFor(() => {
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    // Clear et tape un mot de passe fort
    await user.clear(passwordInput);
    await user.type(passwordInput, 'SecurePass123!');

    await waitFor(() => {
      const progressBar = screen.getByRole('progressbar');
      expect(parseInt(progressBar.getAttribute('aria-valuenow'))).toBeGreaterThan(50);
    });
  });

  it('Valide que les mots de passe correspondent', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <CreerAnnonceEtape2 />
      </BrowserRouter>
    );

    const passwordInput = screen.getByLabelText(/^Mot de passe$/i);
    const confirmInput = screen.getByLabelText(/Confirmer/i);

    await user.type(passwordInput, 'SecurePass123!');
    await user.type(confirmInput, 'DifferentPass456!');

    const submitButton = screen.getByRole('button', { name: /Continuer/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/correspond pas/i)).toBeInTheDocument();
    });
  });

  it('Requiert l\'acceptation des CGU', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <CreerAnnonceEtape2 />
      </BrowserRouter>
    );

    // Remplir tous les champs sauf CGU
    await user.type(screen.getByLabelText(/Email/i), 'test@immo2000.com');
    await user.type(screen.getByLabelText(/^Mot de passe$/i), 'SecurePass123!');
    await user.type(screen.getByLabelText(/Confirmer/i), 'SecurePass123!');

    const submitButton = screen.getByRole('button', { name: /Continuer/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/accepter les conditions/i)).toBeInTheDocument();
    });
  });
});

describe('CreerAnnonceEtape3 - Contrat d\'Exclusivité', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('Affiche les deux options', () => {
    render(
      <BrowserRouter>
        <CreerAnnonceEtape3 />
      </BrowserRouter>
    );

    expect(screen.getByText(/Signer le contrat/i)).toBeInTheDocument();
    expect(screen.getByText(/Publier sans contrat/i)).toBeInTheDocument();
  });

  it('Affiche les avantages du contrat', () => {
    render(
      <BrowserRouter>
        <CreerAnnonceEtape3 />
      </BrowserRouter>
    );

    expect(screen.getByText(/Matching intelligent/i)).toBeInTheDocument();
    expect(screen.getByText(/Estimation de prix/i)).toBeInTheDocument();
    expect(screen.getByText(/Commission: 1.5%/i)).toBeInTheDocument();
  });

  it('Désactive le bouton "Signer" si case non cochée', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <CreerAnnonceEtape3 />
      </BrowserRouter>
    );

    // Sélectionner l'option "Signer"
    const signerCard = screen.getByText(/Signer le contrat/i).closest('div');
    await user.click(signerCard);

    // Le bouton est d'abord désactivé
    const signerButton = screen.getByRole('button', { name: /Signer et continuer/i });
    expect(signerButton).toBeDisabled();

    // Cocher la case
    const acceptCheckbox = screen.getByRole('checkbox');
    await user.click(acceptCheckbox);

    // Le bouton est maintenant activé
    expect(signerButton).not.toBeDisabled();
  });

  it('Permet publier sans contrat', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <CreerAnnonceEtape3 />
      </BrowserRouter>
    );

    // Sélectionner l'option "Publier sans contrat"
    const publishCard = screen.getByText(/Publier sans contrat/i).closest('div');
    await user.click(publishCard);

    const publishButton = screen.getByRole('button', { name: /Publier sans contrat/i });
    await user.click(publishButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/creer-annonce/etape4'),
        expect.any(Object)
      );
    });
  });
});

describe('CreerAnnonceEtape4 - Informations Complémentaires', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('Affiche tous les champs du formulaire', () => {
    render(
      <BrowserRouter>
        <CreerAnnonceEtape4 />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Prix/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Surface/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre de pièces/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Type de bien/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/DPE/i)).toBeInTheDocument();
  });

  it('Affiche les caractéristiques comme checkboxes', () => {
    render(
      <BrowserRouter>
        <CreerAnnonceEtape4 />
      </BrowserRouter>
    );

    expect(screen.getByRole('checkbox', { name: /Ascenseur/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Balcon/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Terrasse/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Jardin/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Piscine/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Parking/i })).toBeInTheDocument();
  });

  it('Valide que la description est requise', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <CreerAnnonceEtape4 />
      </BrowserRouter>
    );

    // Remplir tous les champs sauf description
    await user.type(screen.getByLabelText(/Prix/i), '350000');
    await user.type(screen.getByLabelText(/Surface/i), '85');
    await user.type(screen.getByLabelText(/Nombre de pièces/i), '3');

    const submitButton = screen.getByRole('button', { name: /Publier/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Description est requise/i)).toBeInTheDocument();
    });
  });

  it('Valide que le prix est > 0', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <CreerAnnonceEtape4 />
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText(/Description/i), 'Beau bien');
    await user.type(screen.getByLabelText(/Prix/i), '-100');
    await user.type(screen.getByLabelText(/Surface/i), '85');
    await user.type(screen.getByLabelText(/Nombre de pièces/i), '3');

    const submitButton = screen.getByRole('button', { name: /Publier/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Prix doit être/i)).toBeInTheDocument();
    });
  });

  it('Affiche 100% de progression', () => {
    render(
      <BrowserRouter>
        <CreerAnnonceEtape4 />
      </BrowserRouter>
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });
});
