/**
 * Générateur de Picture Elements pour images responsives.
 *
 * Supporte:
 * - WebP pour les navigateurs modernes
 * - JPEG fallback
 * - Lazy loading
 * - Srcset pour différentes résolutions
 * - Différentes tailles (mobile, desktop, etc.)
 */

class ResponsiveImageBuilder {
    /**
     * Configuration des tailles d'image par breakpoint.
     */
    static SIZES = {
        desktop: {
            sizes: '(min-width: 992px) 600px, (min-width: 768px) 500px, 100vw',
            resolution: '1200x800'
        },
        mobile: {
            sizes: '(max-width: 767px) 100vw, 600px',
            resolution: '600x400'
        },
        thumbnail: {
            sizes: '(max-width: 767px) 50vw, 300px',
            resolution: '200x150'
        }
    };

    /**
     * Génère un picture element avec WebP et fallback JPEG.
     *
     * @param {Object} options - Configuration
     *        - imageUrl: URL de base de l'image (sans extension)
     *        - alt: Texte alternatif
     *        - width: Largeur (optionnel)
     *        - height: Hauteur (optionnel)
     *        - lazy: Activer lazy loading (défaut: true)
     *        - quality: Qualité JPEG (optionnel)
     *        - className: Classes CSS additionnelles
     *        - sizes: Custom sizes attribute
     *
     * @returns {string} HTML du picture element
     */
    static generatePicture(options = {}) {
        const {
            imageUrl,
            alt = 'Image immobilière',
            width = null,
            height = null,
            lazy = true,
            className = '',
            sizes = ResponsiveImageBuilder.SIZES.desktop.sizes
        } = options;

        if (!imageUrl) {
            throw new Error('imageUrl est requis');
        }

        // Déterminer l'extension
        const ext = imageUrl.split('.').pop() || 'jpg';
        const baseName = imageUrl.substring(0, imageUrl.lastIndexOf('.'));

        // URLs des variantes
        const webpUrl = `${baseName}.webp`;
        const jpegUrl = imageUrl.includes('.jpg') || imageUrl.includes('.jpeg') ? imageUrl : `${baseName}.jpg`;

        // Placeholder pour lazy loading
        const placeholderUrl = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E';

        const imgSrc = lazy ? placeholderUrl : jpegUrl;
        const imgDataSrc = lazy ? jpegUrl : null;

        // Construire les attributs
        const widthAttr = width ? ` width="${width}"` : '';
        const heightAttr = height ? ` height="${height}"` : '';
        const lazyClass = lazy ? 'lazy' : '';
        const dataSrc = imgDataSrc ? ` data-src="${imgDataSrc}"` : '';
        const dataWebP = lazy ? ` data-webp="${webpUrl}"` : '';

        return `
<picture>
    <source type="image/webp" srcset="${lazy ? `data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7` : webpUrl}" ${lazy ? `data-srcset="${webpUrl}"` : ''} sizes="${sizes}">
    <img
        src="${imgSrc}"
        alt="${alt}"
        class="responsive-image ${lazyClass} ${className}"${widthAttr}${heightAttr}${dataSrc}${dataWebP}
    >
</picture>`;
    }

    /**
     * Génère un srcset pour multiples résolutions.
     *
     * Format: image-{size}.webp 1200w, image-mobile.webp 600w
     */
    static generateSrcSet(baseName, format = 'webp', sizes = ['desktop', 'mobile', 'thumbnail']) {
        return sizes.map(size => {
            const ext = format === 'webp' ? 'webp' : 'jpg';
            const width = ResponsiveImageBuilder.SIZES[size]?.resolution?.split('x')[0] || '600';
            return `${baseName}-${size}.${ext} ${width}w`;
        }).join(', ');
    }

    /**
     * Génère le HTML pour une galerie responsives.
     * Chaque image avec WebP et JPEG.
     */
    static generateGallery(images, options = {}) {
        const {
            columns = 3,
            lazy = true,
            className = 'img-gallery'
        } = options;

        return `
<div class="${className}" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
    ${images.map((img, idx) => `
    <div class="gallery-item">
        ${ResponsiveImageBuilder.generatePicture({
            ...img,
            lazy,
            className: 'gallery-image'
        })}
    </div>
    `).join('')}
</div>`;
    }
}

/**
 * Helper fonction pour générer picture element facilement.
 */
function createResponsiveImage(imageUrl, alt, options = {}) {
    return ResponsiveImageBuilder.generatePicture({
        imageUrl,
        alt,
        ...options
    });
}

/**
 * Classe pour gérer le chargement des images WebP.
 * Détecte le support WebP et charge la version appropriée.
 */
class WebPLoader {
    static supportsWebP() {
        const canvas = document.createElement('canvas');
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    static supportsWebPAlpha() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    static supports() {
        return {
            webp: this.supportsWebP(),
            webpAlpha: this.supportsWebPAlpha()
        };
    }

    /**
     * Charge l'image WebP ou JPEG selon le support navigateur.
     */
    static loadImage(jpegUrl, webpUrl) {
        if (this.supportsWebP()) {
            return webpUrl;
        }
        return jpegUrl;
    }

    /**
     * Remplace toutes les images pour utiliser WebP si possible.
     */
    static enhanceImages(container = document) {
        if (!this.supportsWebP()) return;

        // Remplacer les sources picture
        container.querySelectorAll('picture source[type="image/webp"]').forEach(source => {
            const srcset = source.getAttribute('data-srcset');
            if (srcset) {
                source.srcset = srcset;
            }
        });

        // Remplacer les images simples
        container.querySelectorAll('img[data-webp]').forEach(img => {
            const webp = img.getAttribute('data-webp');
            if (webp && !img.src.includes('.webp')) {
                img.src = webp;
            }
        });
    }
}

// Initialiser la détection WebP au chargement
document.addEventListener('DOMContentLoaded', () => {
    const supports = WebPLoader.supports();
    document.documentElement.setAttribute('data-webp-support', supports.webp ? 'yes' : 'no');
    console.log('WebP Support:', supports);
});

// Exposer les classes au scope global pour utilisation externe
window.WebPLoader = WebPLoader;
window.ResponsiveImageBuilder = ResponsiveImageBuilder;
