/**
 * Navbar Component Loader
 * Loads and injects the navbar component based on user role
 * - navbar-visiteur.html: Not authenticated
 * - navbar-utilisateur.html: Regular users (role: 'user')
 * - navbar-administrateur.html: Admins (role: 'admin')
 * - navbar-notaire.html: Notaries (role: 'notaire')
 * Ensures consistent navbar placement across all pages
 */

document.addEventListener('DOMContentLoaded', function() {
  // Remove any existing navbars (Bootstrap, custom, etc.)
  var oldNavbars = document.querySelectorAll('nav, nav.navbar, nav[class*="navbar"]');
  oldNavbars.forEach(function(nav) {
    nav.remove();
  });

  // Determine which navbar to load based on user role
  var navbarFile = determineNavbarFile();

  // Fetch and inject the navbar component
  fetch('/static/components/' + navbarFile)
    .then(response => response.text())
    .then(html => {
      // Insert navbar at the beginning of body
      document.body.insertAdjacentHTML('afterbegin', html);
    })
    .catch(err => {
      console.error('Erreur lors du chargement de la navbar:', err);
      // Fallback: inject inline navbar if file not found
      injectFallbackNavbar();
    });
});

/**
 * Determines which navbar file to load based on user authentication and role
 * @returns {string} The navbar filename to load
 */
function determineNavbarFile() {
  // Check if user is authenticated
  var authToken = localStorage.getItem('auth_token');
  var userRole = localStorage.getItem('user_role');

  // If no token or role, show visitor navbar
  if (!authToken || !userRole) {
    return 'navbar-visiteur.html';
  }

  // Load navbar based on role
  switch(userRole) {
    case 'user':
      return 'navbar-utilisateur.html';
    case 'admin':
      return 'navbar-administrateur.html';
    case 'notaire':
      return 'navbar-notaire.html';
    default:
      return 'navbar-visiteur.html';
  }
}

/**
 * Fallback navbar injection in case component file is not available
 * Injects the visitor navbar by default
 */
function injectFallbackNavbar() {
  var fallbackNavbar = '<nav style="background-color: #1976d2; padding: 0; position: sticky; top: 0; z-index: 1100; box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);"><div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; max-width: 1400px; margin: 0 auto; height: 64px; width: 100%;"><a href="/" style="color: white; text-decoration: none; font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; opacity: 1; transition: opacity 0.2s;" onmouseover="this.style.opacity=\'0.8\'" onmouseout="this.style.opacity=\'1\'">🏠 Immo2000</a><div style="display: flex; gap: 4px; align-items: center;"><a href="/search" style="color: white; text-decoration: none; font-size: 14px; font-weight: 500; padding: 6px 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; opacity: 0.7; transition: opacity 0.2s;" onmouseover="this.style.opacity=\'1\'" onmouseout="this.style.opacity=\'0.7\'">🔍 ANNONCES</a><a href="/simulateur-pret" style="color: white; text-decoration: none; font-size: 14px; font-weight: 500; padding: 6px 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; opacity: 0.7; transition: opacity 0.2s;" onmouseover="this.style.opacity=\'1\'" onmouseout="this.style.opacity=\'0.7\'">📈 SIMULATEUR</a></div><div style="display: flex; gap: 8px;"><a href="http://localhost:5000/login.html" style="color: white; text-decoration: none; font-size: 14px; font-weight: 500; padding: 6px 12px; cursor: pointer; border: none; background: transparent; display: flex; align-items: center; opacity: 0.7; transition: opacity 0.2s;" onmouseover="this.style.opacity=\'1\'" onmouseout="this.style.opacity=\'0.7\'">SE CONNECTER</a><a href="http://localhost:5000/register.html" style="color: white; background-color: #d32f2f; text-decoration: none; font-size: 14px; font-weight: 700; padding: 6px 24px; cursor: pointer; border: none; border-radius: 4px; display: flex; align-items: center; gap: 4px; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor=\'#c62828\'" onmouseout="this.style.backgroundColor=\'#d32f2f\'">S\'INSCRIRE</a></div></div></nav>';
  document.body.insertAdjacentHTML('afterbegin', fallbackNavbar);
}
