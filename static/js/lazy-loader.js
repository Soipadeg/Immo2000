/**
 * Gestion du lazy loading des images.
 *
 * Utilise l'Intersection Observer API pour charger les images
 * uniquement quand elles deviennent visibles.
 *
 * Supporte:
 * - Images avec attribut data-src
 * - Éléments picture avec sources WebP
 * - Fallback JPEG
 * - Gestion des erreurs de chargement
 */

class LazyImageLoader {
    constructor(options = {}) {
        this.threshold = options.threshold || 0.1;
        this.rootMargin = options.rootMargin || '50px';
        this.placeholderSrc = options.placeholderSrc || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext x="50%" y="50%" font-size="18" fill="%23999" text-anchor="middle" dominant-baseline="middle"%3EChargement...%3C/text%3E%3C/svg%3E';

        this.observer = new IntersectionObserver(
            (entries) => this.onIntersection(entries),
            {
                threshold: this.threshold,
                rootMargin: this.rootMargin
            }
        );

        this.loadedImages = new Set();
    }

    /**
     * Observe une image pour lazy loading.
     *
     * Format HTML:
     * <img src="placeholder.jpg" data-src="image.jpg" data-webp="image.webp" class="lazy">
     *
     * Ou avec picture element:
     * <picture>
     *     <source data-srcset="image.webp" type="image/webp">
     *     <img data-src="image.jpg" class="lazy">
     * </picture>
     */
    observe(element) {
        if (element.tagName === 'IMG') {
            // Image simple
            this.observer.observe(element);
        } else if (element.tagName === 'PICTURE') {
            // Picture element
            const img = element.querySelector('img');
            if (img) {
                this.observer.observe(img);
            }
        } else if (element.classList && element.classList.contains('lazy')) {
            this.observer.observe(element);
        }
    }

    /**
     * Observe tous les éléments lazy d'un conteneur.
     */
    observeAll(container = document) {
        // Images simples
        container.querySelectorAll('img.lazy[data-src]').forEach(img => {
            this.observe(img);
        });

        // Picture elements
        container.querySelectorAll('picture').forEach(pic => {
            if (pic.querySelector('img[data-src]')) {
                this.observe(pic);
            }
        });
    }

    /**
     * Callback pour Intersection Observer.
     */
    onIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadImage(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    }

    /**
     * Charge une image.
     */
    loadImage(element) {
        if (this.loadedImages.has(element)) return;

        try {
            if (element.tagName === 'IMG') {
                this.loadImageElement(element);
            } else if (element.tagName === 'PICTURE') {
                this.loadPictureElement(element);
            }
            this.loadedImages.add(element);
        } catch (error) {
            console.error('Erreur chargement image:', error);
            this.handleImageError(element);
        }
    }

    /**
     * Charge une img simple avec data-src.
     */
    loadImageElement(img) {
        const src = img.getAttribute('data-src');
        if (!src) return;

        // Ajouter classe loading
        img.classList.add('lazy-loading');

        // Créer nouvelle image pour précharger
        const newImg = new Image();

        newImg.onload = () => {
            img.src = src;
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-loaded');

            // Déclencher callback si existe
            if (img.dataset.onload) {
                window[img.dataset.onload]?.(img);
            }
        };

        newImg.onerror = () => {
            this.handleImageError(img);
        };

        newImg.src = src;
    }

    /**
     * Charge un picture element avec sources WebP.
     */
    loadPictureElement(picture) {
        const img = picture.querySelector('img');
        const sources = picture.querySelectorAll('source[data-srcset]');

        img.classList.add('lazy-loading');

        // Charger les sources
        sources.forEach(source => {
            const srcset = source.getAttribute('data-srcset');
            if (srcset) {
                source.srcset = srcset;
                source.removeAttribute('data-srcset');
            }
        });

        // Charger l'image fallback
        if (img.hasAttribute('data-src')) {
            const src = img.getAttribute('data-src');

            const newImg = new Image();
            newImg.onload = () => {
                img.src = src;
                img.classList.remove('lazy-loading');
                img.classList.add('lazy-loaded');
            };
            newImg.onerror = () => {
                this.handleImageError(img);
            };
            newImg.src = src;
        }
    }

    /**
     * Gère les erreurs de chargement.
     */
    handleImageError(element) {
        console.warn(`Erreur chargement image: ${element.src || element.dataset.src}`);

        if (element.tagName === 'IMG') {
            element.classList.remove('lazy-loading');
            element.classList.add('lazy-error');
            element.src = this.placeholderSrc;
        }
    }

    /**
     * Force le chargement immédiat d'une image.
     */
    loadImageImmediately(element) {
        this.loadImage(element);
    }

    /**
     * Arrête l'observation d'une image.
     */
    unobserve(element) {
        this.observer.unobserve(element);
    }

    /**
     * Nettoie l'observer.
     */
    disconnect() {
        this.observer.disconnect();
    }
}

/**
 * Instance globale du lazy loader.
 * Utilisée par défaut pour toutes les pages.
 */
let globalLazyLoader = null;

/**
 * Initialise le lazy loader global.
 */
function initGlobalLazyLoader(options = {}) {
    if (!globalLazyLoader) {
        globalLazyLoader = new LazyImageLoader(options);
    }
    return globalLazyLoader;
}

/**
 * Observe une image ou un conteneur avec le loader global.
 */
function observeLazyImages(container = document) {
    if (!globalLazyLoader) {
        initGlobalLazyLoader();
    }
    globalLazyLoader.observeAll(container);
}

// Initialiser au chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        observeLazyImages();
    });
} else {
    observeLazyImages();
}

// Exposer les classes au scope global pour utilisation externe
window.LazyImageLoader = LazyImageLoader;
window.globalLazyLoader = globalLazyLoader;
