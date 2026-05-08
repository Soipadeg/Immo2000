# Guide d'optimisation des images - Immo2000

## 📋 Vue d'ensemble

Ce guide explique le système complet d'optimisation des images pour le site immobilier Immo2000. Le système inclut :

1. **Compression automatique** avec Pillow
2. **Génération de miniatures** (thumbnails, mobile, desktop, detail)
3. **Lazy loading** avec Intersection Observer
4. **WebP avec fallback JPEG** pour les navigateurs modernes

---

## 🖼️ Architecture des images

### Structure des répertoires

```
/static/images/
├── /annonces/
│   ├── /1/  (annonce_id = 1)
│   │   ├── photo-1-thumbnail.jpg    (200x150)
│   │   ├── photo-1-mobile.jpg       (600x400)
│   │   ├── photo-1-desktop.jpg      (1200x800)
│   │   ├── photo-1-detail.jpg       (1920x1280)
│   │   ├── photo-1-desktop.webp     (format moderne)
│   │   ├── photo-2-thumbnail.jpg
│   │   └── ...
│   ├── /2/
│   └── ...
└── /default/
    └── placeholder.jpg
```

### Tailles d'image standard

| Format | Dimensions | Cas d'usage | Compression |
|--------|-----------|-----------|-------------|
| **thumbnail** | 200x150 | Listes, galeries miniatures | 60% JPEG |
| **mobile** | 600x400 | Carousel mobile, preview | 80% JPEG |
| **desktop** | 1200x800 | Carousel, page principale | 80% JPEG + WebP |
| **detail** | 1920x1280 | Page détail haute résolution | 80% JPEG |

---

## 🚀 Utilisation

### 1. Upload et traitement d'images

#### Via API

```bash
# Upload une image
curl -X POST \
  "http://localhost:5000/api/v1/images/upload?annonce_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@photo.jpg"

# Réponse
{
    "message": "Image traitée avec succès",
    "annonce_id": "1",
    "variants": {
        "thumbnail": "/static/images/annonces/1/photo-thumbnail.jpg",
        "mobile": "/static/images/annonces/1/photo-mobile.jpg",
        "desktop": "/static/images/annonces/1/photo-desktop.jpg",
        "detail": "/static/images/annonces/1/photo-detail.jpg",
        "webp_desktop": "/static/images/annonces/1/photo-desktop.webp"
    }
}
```

#### Via Python

```python
from src.services.image_processor import get_image_processor

processor = get_image_processor()

# Traiter une image
with open('photo.jpg', 'rb') as f:
    image_data = f.read()

result = processor.process_image(
    image_data=image_data,
    annonce_id=1,
    filename='photo.jpg',
    generate_webp=True
)

print(result)
# {
#     'thumbnail': '/static/images/annonces/1/photo-thumbnail.jpg',
#     'mobile': '/static/images/annonces/1/photo-mobile.jpg',
#     'desktop': '/static/images/annonces/1/photo-desktop.jpg',
#     ...
# }
```

### 2. Lazy Loading dans le HTML

#### Image simple avec lazy loading

```html
<!-- Placeholder visible, données réelles chargées à la demande -->
<img
    src="/static/images/default-house.jpg"
    data-src="/static/images/annonces/1/photo-desktop.jpg"
    alt="Vue de la maison"
    class="lazy"
>
```

#### Picture element avec WebP

```html
<picture>
    <!-- WebP pour navigateurs modernes -->
    <source
        type="image/webp"
        srcset="/static/images/annonces/1/photo-desktop.webp"
    >
    <!-- Fallback JPEG -->
    <img
        src="/static/images/annonces/1/photo-desktop.jpg"
        alt="Vue de la maison"
        class="responsive-image"
    >
</picture>
```

#### Lazy loading avec WebP

```html
<picture>
    <source
        type="image/webp"
        data-srcset="/static/images/annonces/1/photo-desktop.webp"
    >
    <img
        src="/static/images/default-house.jpg"
        data-src="/static/images/annonces/1/photo-desktop.jpg"
        alt="Vue de la maison"
        class="lazy"
    >
</picture>
```

### 3. Utiliser ResponsiveImageBuilder

```javascript
// Générer un picture element avec WebP et lazy loading
const html = ResponsiveImageBuilder.generatePicture({
    imageUrl: '/static/images/annonces/1/photo-desktop.jpg',
    alt: 'Vue de la maison',
    lazy: true,
    className: 'carousel-image'
});

// Injecter dans le DOM
container.innerHTML = html;
```

### 4. Regénérer les miniatures

#### Via API

```bash
# Regénérer toutes les miniatures d'une annonce
curl -X POST \
  "http://localhost:5000/api/v1/images/1/regenerate" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Réponse
{
    "message": "Regénération terminée",
    "annonce_id": 1,
    "status": "success",
    "images_processed": 5,
    "variants_generated": 5
}
```

#### Via Python

```python
from src.services.thumbnail_generator import ThumbnailGenerator

generator = ThumbnailGenerator()

# Regénérer une annonce
result = generator.regenerate_annonce(annonce_id=1, force_webp=True)
print(result)

# Regénérer toutes les annonces
results = generator.regenerate_all(limit=100)
for result in results:
    print(f"Annonce {result['annonce_id']}: {result['status']}")
```

#### Via CLI

```bash
# Regénérer une annonce spécifique
python -m backend.src.services.thumbnail_generator --annonce-id 1

# Regénérer toutes les annonces
python -m backend.src.services.thumbnail_generator --batch
```

---

## ⚡ Performance

### Métriques cibles

- **Page carousel**: < 2 secondes de chargement
- **Galerie détail**: < 3 secondes
- **Taille page**: < 500KB initial (lazy load le reste)
- **Core Web Vitals**: > 90

### Optimisations appliquées

1. **Lazy Loading**
   - Images chargées seulement quand visibles
   - Sauvegarde bande passante mobile
   - Améliore le temps de chargement initial

2. **WebP**
   - -30% de taille vs JPEG
   - Support dans 96% des navigateurs modernes
   - Fallback automatique à JPEG

3. **Compression JPEG**
   - Qualité 80% (optimal pour immobilier)
   - Compression progressive
   - -50% à -70% de taille

4. **Responsive Images**
   - Différentes tailles par breakpoint mobile/desktop
   - Srcset pour différentes résolutions
   - Optimisation du ratio bandwidth/quality

---

## 🔧 Configuration

### Paramètres modifiables

File: `/backend/src/services/image_processor.py`

```python
class ImageProcessor:
    # Tailles d'image personnalisées
    SIZES = {
        'thumbnail': (200, 150),
        'mobile': (600, 400),
        'desktop': (1200, 800),
        'detail': (1920, 1280),
    }

    # Qualité de compression
    JPEG_QUALITY = 80      # 0-100
    WEBP_QUALITY = 80      # 0-100

    # Taille max upload
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
```

### Support WebP

Le système détecte automatiquement le support WebP:

```javascript
const supports = WebPLoader.supports();
console.log(supports.webp);        // true/false
console.log(supports.webpAlpha);   // true/false
```

---

## 📊 Gestion des images existantes

### Exemple : Traiter les images par défaut

```python
from src.services.image_processor import get_image_processor
from pathlib import Path

processor = get_image_processor()

# Charger l'image par défaut
default_image_path = Path('/static/images/default-house.jpg')
with open(default_image_path, 'rb') as f:
    image_data = f.read()

# Traiter pour l'annonce de test
result = processor.process_image(
    image_data=image_data,
    annonce_id=1,
    filename='default-house.jpg',
    generate_webp=True
)

print(f"Images générées pour annonce 1:")
for size, url in result.items():
    print(f"  {size}: {url}")
```

---

## 🐛 Dépannage

### Images ne s'affichent pas

1. Vérifier que le fichier existe
```bash
ls -la /static/images/annonces/1/
```

2. Vérifier les logs Flask
```bash
tail -f /path/to/flask.log
```

3. Vérifier la console navigateur (F12)
   - Erreurs 404 pour images
   - Erreurs CORS

### Lazy loading ne fonctionne pas

Vérifier que `lazy-loader.js` est chargé:
```javascript
console.log(typeof LazyImageLoader);  // Doit être "function"
```

### WebP ne se charge pas

Vérifier le support navigateur:
```javascript
const supports = WebPLoader.supports();
console.log(supports);
```

---

## 📈 Bonnes pratiques

✅ **À FAIRE:**
- Compresser les images avant upload
- Utiliser lazy loading pour toutes les images non-critical
- Servir WebP avec fallback JPEG
- Générer miniatures pour galeries
- Monitorer Core Web Vitals

❌ **À ÉVITER:**
- Uploder images non compressées (> 5MB)
- Servir images haute résolution en miniature
- Utiliser load() au lieu de lazy loading
- Ignorer le fallback JPEG
- Servir les mêmes images partout (pas de responsive)

---

## 📚 Ressources

- [MDN: Picture Element](https://developer.mozilla.org/fr/docs/Web/HTML/Element/picture)
- [WebP Format](https://developers.google.com/speed/webp)
- [Intersection Observer API](https://developer.mozilla.org/fr/docs/Web/API/Intersection_Observer_API)
- [Core Web Vitals](https://web.dev/vitals/)

---

**Dernière mise à jour**: Mai 2026
