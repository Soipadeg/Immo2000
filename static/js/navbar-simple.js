document.addEventListener('DOMContentLoaded', function() {
  console.log('Navbar simple script loaded');
  var oldNavbars = document.querySelectorAll('nav.navbar');
  console.log('Found ' + oldNavbars.length + ' old navbars');
  oldNavbars.forEach(function(nav) { nav.remove(); });
  
  var navbar = '<nav style="background-color: #1976d2; padding: 0; position: sticky; top: 0; z-index: 1100; box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24); margin: 0;"><div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 16px; height: 64px;"><a href="/" style="display: flex; align-items: center; gap: 8px; color: white; text-decoration: none; font-size: 20px; font-weight: 500;"><span style="font-size: 24px;">🏠</span><span>Immo2000</span></a><div style="display: flex; gap: 24px; margin-left: auto; margin-right: 24px;"><a href="/" style="color: white; text-decoration: none; font-size: 14px;">Accueil</a><a href="/search" style="color: white; text-decoration: none; font-size: 14px;">Annonces</a><a href="/simulateur-pret" style="color: white; text-decoration: none; font-size: 14px;">Simulateur</a></div><div style="display: flex; gap: 8px;"><a href="/login" style="color: white; text-decoration: none; padding: 8px 16px; font-size: 14px; border-radius: 4px;">Se connecter</a><a href="/register" style="color: white; text-decoration: none; padding: 8px 16px; font-size: 14px; border-radius: 4px;">S\'inscrire</a></div></div></nav>';
  
  document.body.insertAdjacentHTML('afterbegin', navbar);
  console.log('Navbar simple injected');
});
