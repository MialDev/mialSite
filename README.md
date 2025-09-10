
# mial — Static site (Netlify-ready)

Dossiers/fichiers inclus :
- `index.html` — page d'accueil avec toutes les sections
- `style.css` — styles (thème bleu/rose, responsive)
- `main.js` — logique (header headroom, animation du logo limitée au HERO)
- `assets/logos/` — place ton SVG/logo ici (déjà un `logo-mial.svg` présent)
- `assets/images/` — tes photos ici

## Déployer sur Netlify via GitHub
1. Crée un repo sur GitHub & pousse ces fichiers.
2. Sur Netlify : **Add new site** → **Import an existing project** → choisis le repo.
3. Build command : *(vide, c’est un site statique)* ; Publish directory : `/` (racine).
   - Ou laisse par défaut, Netlify détecte et publie à la racine.
4. Le formulaire `#contact` utilise **Netlify Forms** (soumissions visibles dans le dashboard Netlify).

## Changer de domaine
Tu peux ajouter/changer ton domaine custom à tout moment dans **Domain settings** sur Netlify.
