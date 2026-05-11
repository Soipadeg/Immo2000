// Injecter la navbar simple Immo2000
document.addEventListener('DOMContentLoaded', function() {
  const navbar = `
    <nav style="
      background-color: #1976d2;
      padding: 0;
      position: sticky;
      top: 0;
      z-index: 1100;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
      margin: 0;
    ">
      <div style="
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 16px;
        height: 64px;
      ">
        <!-- Logo -->
        <a href="/" style="
          display: flex;
          align-items: center;
          gap: 8px;
          color: white;
          text-decoration: none;
          font-size: 20px;
          font-weight: 500;
        ">
          <span style="font-size: 24px;">🏠</span>
          <span>Immo2000</span>
        </a>

        <!-- Menu Items -->
        <div style="
          display: flex;
          gap: 24px;
          margin-left: auto;
          margin-right: 24px;
        ">
          <a href="/" style="
            color: white;
            text-decoration: none;
            font-size: 14px;
            display: flex;
            align-items: center;
            transition: opacity 0.2s;
          " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">Accueil</a>
          <a href="/search" style="
            color: white;
            text-decoration: none;
            font-size: 14px;
            display: flex;
            align-items: center;
            transition: opacity 0.2s;
          " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">Annonces</a>
          <a href="/simulateur-pret" style="
            color: white;
            text-decoration: none;
            font-size: 14px;
            display: flex;
            align-items: center;
            transition: opacity 0.2s;
          " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">Simulateur</a>
        </div>

        <!-- Auth Buttons -->
        <div style="
          display: flex;
          gap: 8px;
        ">
          <a href="/login" style="
            color: white;
            text-decoration: none;
            padding: 8px 16px;
            font-size: 14px;
            border-radius: 4px;
            transition: opacity 0.2s;
          " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">Se connecter</a>
          <a href="/register" style="
            color: white;
            text-decoration: none;
            padding: 8px 16px;
            font-size: 14px;
            border-radius: 4px;
            transition: opacity 0.2s;
          " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">S'inscrire</a>
        </div>
      </div>
    </nav>
  `;

  // Injecter la navbar au début du body
  document.body.insertAdjacentHTML('afterbegin', navbar);

  // Optionnel: Enlever l'ancienne navbar Bootstrap si elle existe
  const oldNavbar = document.querySelector('nav.navbar');
  if (oldNavbar && oldNavbar !== document.querySelector('nav')) {
    oldNavbar.remove();
  }
});
