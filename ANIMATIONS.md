# 🏀 ANIMATIONS.md — La Passe D — Guide des animations

## Architecture

Toutes les animations sont dans **2 fichiers séparés** du code existant :
- [`animations.css`](file:///Users/mrltadrien/Desktop/PRO/LA%20PASSE%20D/SITE%20la-passe-d/animations.css) — Styles, keyframes, transitions
- [`animations.js`](file:///Users/mrltadrien/Desktop/PRO/LA%20PASSE%20D/SITE%20la-passe-d/animations.js) — Logique, IntersectionObserver, RAF, Web Audio

L'`index.html` n'a été modifié que de **2 lignes** (ajout des `<link>` et `<script>`).

---

## ⚡ Contrôle Global

### Vitesse globale
```css
:root {
    --anim-speed: 1;    /* 1 = normal, 0.5 = 2x plus rapide, 2 = 2x plus lent */
}
```

### Mouvement réduit
Toutes les animations sont automatiquement désactivées si l'utilisateur a activé `prefers-reduced-motion: reduce` dans son OS.

---

## 📋 Liste des animations

| # | Animation | Fichier(s) | Classe de désactivation | Description |
|---|-----------|------------|------------------------|-------------|
| 1 | **Preloader Tip-Off** | CSS + JS | `.no-preloader` | Ballon SVG qui rebondit avec squash & stretch, puis révèle le logo. Max 1.5s, une seule fois par session (`sessionStorage`). |
| 2 | **Court Lines** | CSS + JS | `.no-court-lines` | Lignes de terrain (raquette, arc 3pts, cercle central) en SVG blanc, tracées en `stroke-dashoffset`. Opacité 8%. |
| 3 | **Parallax Ball** | CSS + JS | `.no-parallax` | Ballon SVG flottant dans le hero : réagit à la souris (desktop) et tourne avec le scroll. |
| 4 | **Shot Clock Text** | CSS + JS | `.no-shot-clock` | Le paragraphe hero apparaît lettre par lettre avec des chiffres défilants style tableau de score. |
| 5 | **Bounce-In Scroll** | CSS + JS | `.no-bounce-scroll` | Sections entrent avec un ease rebond (`cubic-bezier(.34,1.56,.64,1)`). |
| 6 | **Cascade Cards** | CSS + JS | `.no-bounce-scroll` | Cartes arrivent en cascade : rotation + translation depuis la gauche. |
| 7 | **Scoreboard LED** | CSS + JS | `.no-scoreboard` | Chiffres (dates, countdown) défilent style LED avant de se figer. |
| 8 | **Midcourt Lines** | CSS + JS | `.no-midcourt` | Ligne médiane + cercle central dessinés entre les sections au scroll. |
| 9 | **Parquet 3D Tilt** | CSS + JS | `.no-parquet` | Cartes : tilt 3D suivant la souris + reflet lumineux (desktop only). |
| 10 | **Custom Cursor** | CSS + JS | `.no-cursor` | Cercle qui grossit au survol des éléments cliquables (desktop only). |
| 11 | **Footer Bounce Ball** | CSS + JS | `.no-footer-ball` | Ballon qui rebondit en boucle infinie dans le footer avec ombre. |
| 12 | **CTA Arc Shot** | CSS + JS | `.no-cta-arc` | Hover sur "Voir les Tournois" : ballon décrit un arc vers un mini-panier avec filet qui ondule. Clic = flash buzzer. |
| 13 | **Nav Bounce Underline** | CSS | `.no-nav-bounce` | Soulignement des liens nav avec overshoot au hover. |
| 14 | **Logo Spin Dribble** | CSS | `.no-logo-spin` | Le logo tourne 360° au hover. |
| 15 | **Ball Trail** | CSS + JS | `.no-ball-trail` | Traînée de mini-ballons quand on scrolle vite. |
| 16 | **Visibility Change** | JS | *(toujours actif)* | Titre de l'onglet → « 🏀 Reviens jouer ! » au retour. |
| 17 | **Easter Egg 3x3** | JS | *(toujours actif)* | Taper "3x3" → pluie de ballons pendant 3 secondes. |
| 18 | **Son Swish** | JS | Bouton 🔇/🔊 | Son réaliste de filet (pink noise + bandpass sweep via Web Audio). Désactivé par défaut. |
| 19 | **Scroll Progress Bar** | CSS + JS | `.no-scroll-progress` | Barre de progression en haut de page, gradient bleu avec glow. |
| 20 | **Gallery Stagger** | CSS + JS | `.no-gallery-stagger` | Images de galerie apparaissent en cascade avec scale-up et bounce. |
| 21 | **FAQ Bounce Open** | CSS + JS | `.no-faq-bounce` | Le contenu FAQ rebondit en apparaissant à l'ouverture. |
| 22 | **Social Dribble** | CSS + JS | `.no-social-dribble` | Icônes sociales dribblent (rebond) au hover (desktop). |
| 23 | **Countdown Flip** | CSS + JS | `.no-countdown-flip` | Chiffres du countdown font un flip 3D à chaque changement. |
| 24 | **Hero Grain** | CSS + JS | `.no-grain` | Texture grain film subtile sur le hero (desktop only). |
| 25 | **Magnetic Buttons** | CSS + JS | `.no-magnetic` | CTA suivent légèrement la souris (attraction magnétique, desktop). |

---

## 🔧 Comment désactiver une animation

### Méthode 1 : Classe CSS sur `<html>`
Ajouter la classe correspondante sur l'élément `<html>` :
```html
<html lang="fr" class="no-parallax no-cursor">
```

### Méthode 2 : JavaScript
```js
document.documentElement.classList.add('no-parquet');
```

### Méthode 3 : Tout désactiver
```html
<html lang="fr" class="no-preloader no-court-lines no-parallax no-shot-clock no-bounce-scroll no-scoreboard no-midcourt no-parquet no-cursor no-footer-ball no-cta-arc no-nav-bounce no-logo-spin no-ball-trail">
```

### Méthode 4 : Supprimer les fichiers
Retirer les 2 lignes ajoutées dans `index.html` pour revenir au site original.

---

## 📱 Compromis Performance / Mobile

| Optimisation | Détail |
|---|---|
| **Parallax ball** | Réduite à 80px et opacité 8% sous 768px. Mouse parallax désactivé sur mobile. |
| **Custom cursor** | Complètement désactivé sur mobile et appareils sans hover. |
| **Ball trail** | Throttle de 100ms entre les particules. Auto-nettoyées après 600ms. |
| **Parquet tilt 3D** | Desktop only (`hover: hover` media query). |
| **Preloader** | sessionStorage → une seule exécution par session navigateur. |
| **Scoreboard LED** | 12 frames max, rAF pour le timing. |
| **Easter egg** | 15 ballons sur mobile vs 30 sur desktop. |
| **Court lines SVG** | `pointer-events: none`, opacité 8%, pas de rAF. |
| **`will-change`** | Appliqué uniquement sur `transform` du parallax ball. |
| **Toutes les animations** | Utilisent `transform`/`opacity` uniquement → composition GPU. |
| **`prefers-reduced-motion`** | Tout est désactivé si l'utilisateur le demande. |

---

## 🎵 Son

Le son de "swish" est **généré en temps réel** par la Web Audio API — aucun fichier audio n'est chargé. Il est :
- **Désactivé par défaut** (bouton 🔇 en bas à gauche)
- Joué **uniquement** sur clic du CTA principal (jamais automatiquement)
- Volume à 30%

---

## 🗂 Fichiers modifiés

| Fichier | Modification |
|---|---|
| `index.html` | +2 lignes (`<link>` animations.css + `<script>` animations.js) |
| `styles.css` | ❌ Aucune modification |
| `script.js` | ❌ Aucune modification |
| `animations.css` | ✅ Nouveau fichier |
| `animations.js` | ✅ Nouveau fichier |
| `ANIMATIONS.md` | ✅ Nouveau fichier (ce document) |
