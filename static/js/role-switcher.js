/**
 * Composant de sélecteur de rôle pour Immo2000
 * À intégrer dans le header/navbar pour permettre le switcher rapide de rôle
 */

class RoleSwitcher {
    constructor() {
        this.currentRole = null;
        this.availableRoles = [];
        this.token = localStorage.getItem('access_token');
        this.authUrl = 'http://localhost:5000/auth';
    }

    /**
     * Initialise le sélecteur de rôle
     */
    async init(containerId = 'roleSwitcherContainer') {
        if (!this.token) {
            return;
        }

        try {
            await this.loadRoles();
            this.render(containerId);
        } catch (error) {
            console.error('Error initializing role switcher:', error);
        }
    }

    /**
     * Charge les rôles disponibles
     */
    async loadRoles() {
        const response = await axios.get(`${this.authUrl}/profile/roles`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });

        this.currentRole = response.data.role_actif;
        this.availableRoles = response.data.roles_disponibles;
    }

    /**
     * Rend le sélecteur de rôle
     */
    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (this.availableRoles.length <= 1) {
            // Pas besoin d'afficher si un seul rôle
            return;
        }

        const html = `
            <div class="role-switcher">
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                        <i class="fas fa-${this.currentRole === 'vendeur' ? 'building' : 'search'}"></i>
                        ${this.currentRole === 'vendeur' ? 'Vendeur' : 'Acheteur'}
                    </button>
                    <ul class="dropdown-menu">
                        ${this.availableRoles.map(role => `
                            <li>
                                <a class="dropdown-item ${this.currentRole === role ? 'active' : ''}"
                                   href="#" onclick="roleSwitcher.switchRole('${role}'); return false;">
                                    <i class="fas fa-${role === 'vendeur' ? 'building' : 'search'}"></i>
                                    ${role === 'vendeur' ? 'Vendeur' : 'Acheteur'}
                                    ${this.currentRole === role ? '<i class="fas fa-check ms-2"></i>' : ''}
                                </a>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Switche le rôle
     */
    async switchRole(newRole) {
        if (newRole === this.currentRole) {
            return;
        }

        try {
            const response = await axios.post(`${this.authUrl}/profile/switch-role`,
                { role: newRole },
                { headers: { 'Authorization': `Bearer ${this.token}` } }
            );

            // Mettre à jour le token
            localStorage.setItem('access_token', response.data.access_token);
            this.token = response.data.access_token;

            // Recharger et re-render
            await this.loadRoles();
            this.render();

            // Émettre un événement personnalisé
            window.dispatchEvent(new CustomEvent('roleChanged', { detail: { role: newRole } }));

        } catch (error) {
            console.error('Error switching role:', error);
            alert(error.response?.data?.error || 'Erreur lors du basculement du rôle');
        }
    }
}

// Initialiser le sélecteur au chargement de la page
let roleSwitcher = null;

document.addEventListener('DOMContentLoaded', function() {
    roleSwitcher = new RoleSwitcher();
    roleSwitcher.init('roleSwitcherContainer');

    // Écouter les changements de rôle
    window.addEventListener('roleChanged', function(e) {
        console.log('Role changed to:', e.detail.role);
        // Vous pouvez ajouter une logique pour rafraîchir le contenu selon le rôle
    });
});
