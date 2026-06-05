/**
 * Lazy Load Utility
 * Wrapper pour charger des composants de manière asynchrone
 */

import React from 'react'

/**
 * Charge un composant de manière lazy avec gestion des erreurs
 * @param {Function} importFunc - Fonction d'import dynamique
 * @returns {React.LazyExoticComponent} Composant lazy
 */
export const lazyLoadComponent = (importFunc) => {
  return React.lazy(() =>
    importFunc()
      .then(module => ({ default: module.default }))
      .catch(err => {
        console.error('Failed to load component:', err)
        // Retourner un composant d'erreur
        return {
          default: () => (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
              textAlign: 'center'
            }}>
              <h2>Erreur de chargement</h2>
              <p>Impossible de charger cette page. Veuillez rafraîchir.</p>
              <button onClick={() => window.location.reload()}>
                Rafraîchir
              </button>
            </div>
          )
        }
      })
  )
}

/**
 * Charge plusieurs composants à la fois
 * @param {Object} imports - Objet avec clés = noms, valeurs = imports
 * @returns {Object} Objet avec composants lazy
 */
export const lazyLoadComponents = (imports) => {
  const result = {}
  Object.keys(imports).forEach(key => {
    result[key] = lazyLoadComponent(imports[key])
  })
  return result
}

export default lazyLoadComponent
