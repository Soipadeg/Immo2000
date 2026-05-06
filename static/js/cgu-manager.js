/**
 * CGU Manager - Gère l'acceptation des CGU et les notifications de mise à jour
 */

class CGUManager {
    constructor() {
        this.cguDate = '05/05/2026';
        this.privacyDate = '05/05/2026';
    }

    /**
     * Accepter les CGU
     */
    acceptCGU() {
        const acceptance = {
            cgu: {
                accepted: true,
                date: new Date().toISOString(),
                version: this.cguDate
            },
            privacy: {
                accepted: true,
                date: new Date().toISOString(),
                version: this.privacyDate
            }
        };

        localStorage.setItem('cgu_acceptance', JSON.stringify(acceptance));
        localStorage.setItem('cgu_last_accepted_date', this.cguDate);
        localStorage.setItem('privacy_last_accepted_date', this.privacyDate);

        console.log('✅ CGU acceptées');
        return true;
    }

    /**
     * Vérifier si l'utilisateur a accepté les CGU
     */
    hasAcceptedCGU() {
        return localStorage.getItem('cgu_acceptance') !== null;
    }

    /**
     * Vérifier si les CGU ont été mises à jour depuis l'acceptation
     */
    hasCGUBeenUpdated() {
        const lastAccepted = localStorage.getItem('cgu_last_accepted_date');
        return lastAccepted !== null && lastAccepted !== this.cguDate;
    }

    /**
     * Afficher une notification de mise à jour
     */
    showUpdateNotification(container = null) {
        const notification = document.createElement('div');
        notification.className = 'alert alert-warning alert-dismissible fade show';
        notification.setAttribute('role', 'alert');
        notification.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <strong>Mise à jour importante !</strong>
            Les Conditions Générales d'Utilisation ont été mises à jour. Veuillez les <a href="legal/cgu.html" class="alert-link">consulter</a> et les accepter à nouveau.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        if (container) {
            container.appendChild(notification);
        } else if (document.querySelector('main')) {
            document.querySelector('main').insertBefore(notification, document.querySelector('main').firstChild);
        }
    }

    /**
     * Valider l'acceptation des CGU au signup
     */
    validateCGUCheckbox() {
        const checkbox = document.getElementById('acceptCGU');
        if (checkbox && !checkbox.checked) {
            alert('Vous devez accepter les Conditions Générales et la Politique de Confidentialité');
            return false;
        }
        return true;
    }

    /**
     * Initialiser le manager
     */
    init() {
        // Valider checkbox au submit si présente
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                if (!this.validateCGUCheckbox()) {
                    e.preventDefault();
                    return false;
                }
                // Si le formulaire est valide, accepter les CGU
                this.acceptCGU();
            });
        }

        // Vérifier les mises à jour au chargement
        if (this.hasAcceptedCGU() && this.hasCGUBeenUpdated()) {
            this.showUpdateNotification();
        }

        console.log('✅ CGU Manager initialisé');
    }
}

// Initialiser au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    const manager = new CGUManager();
    manager.init();
    window.cguManager = manager; // Exposer globalement
});
