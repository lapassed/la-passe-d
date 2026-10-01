# 🏀 COURT-BACKGROUND.md — La Passe D — Terrain en filigrane

## Concept

Un demi-terrain de basket 3×3 (proportions FIBA) est dessiné en filigrane derrière le contenu du site.
Il se trace progressivement au scroll comme un schéma tactique à la craie.
En bas de page, le terrain est complet.

---

## Schéma du terrain (vue du dessus, arc vers le bas)

```
         ┌──────────────────────────────────────┐
         │                                      │
         │                                      │
         │           ╭────────────╮             │  ← Arc 3 points
         │          ╱              ╲            │    (ordre 4)
         │         ╱                ╲           │
         │        │                  │          │
         │        │   ┌──────────┐   │          │
         │        │   │          │   │          │  ← Raquette
         │        │   │  ( ○ )   │   │          │    (ordre 2)
         │        │   │  FT circ │   │          │  ← Cercle LF
         │        │   │          │   │          │    (ordre 3)
         │        │   │   ╭──╮   │   │          │  ← Non-charge
         │        │   │   │••│   │   │          │    (ordre 5)
         │        │   │   ╰──╯   │   │          │
         │        │   │  ┌━━━┐   │   │          │  ← Planche
         │        │   │  │ ○ │   │   │          │  ← Cercle panier
         │        │   │  └───┘   │   │          │    (ordre 6)
         ╘════════╧═══╧══════════╧═══╧══════════╛  ← Ligne de fond
                                                      (ordre 1)
```

---

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | SVG `#courtBg` en `position: fixed`, juste après `<body>`. Attributs `data-court` sur les sections. |
| `styles.css` | Styles `.court-bg`, `.court-halo`, réduction de mouvement, mobile, no-JS. |
| `script.js` | `COURT_CONFIG` + IIFE de tracé progressif au scroll. |

---

## COURT_CONFIG (en tête de `script.js`)

```js
const COURT_CONFIG = {
    strokeOpacity: 0.10,       // Opacité des traits (mode clair)
    strokeOpacityDark: 0.08,   // Opacité des traits (mode sombre)
    drawOrder: {
        1: { start: 0.00, end: 0.15 },  // Ligne de fond
        2: { start: 0.10, end: 0.35 },  // Raquette (côtés + haut)
        3: { start: 0.25, end: 0.50 },  // Cercle lancer franc
        4: { start: 0.35, end: 0.65 },  // Arc 3 points
        5: { start: 0.55, end: 0.78 },  // Demi-cercle non-charge
        6: { start: 0.75, end: 0.95 },  // Panier (planche + cercle)
    },
    lerpFactor: 0.05,          // Lissage du scroll (plus bas = plus lent)
    parallaxAmount: 0.03,      // Déplacement max en Y (3 % du viewport)
    enableHalo: true,          // Halo lumineux suivant la souris (desktop)
    mobileBreakpoint: 1024,    // En dessous : terrain affiché statique
};
```

---

## Ordre de tracé au scroll

| Ordre | Élément | Progression scroll |
|---|---|---|
| 1 | Ligne de fond (`#court-baseline`) | 0 % → 15 % |
| 2 | Raquette (`#court-lane-*`, `#court-lane-top`) | 10 % → 35 % |
| 3 | Cercle de lancer franc (`#court-ft-circle`) | 25 % → 50 % |
| 4 | Arc à 3 points (`#court-3pt-arc`) | 35 % → 65 % |
| 5 | Demi-cercle non-charge (`#court-no-charge`) | 55 % → 78 % |
| 6 | Panier (`#court-backboard`, `#court-rim`) | 75 % → 95 % |
| — | Point d'accent (`#court-accent`) | Apparaît à 95 % |

---

## Comment désactiver chaque partie

### Supprimer tout le terrain
Retirer le `<svg id="courtBg">` dans `index.html` et les styles `.court-bg` dans `styles.css`.
Supprimer le code `COURT_CONFIG` + IIFE dans `script.js`.

### Désactiver le tracé progressif (garder le terrain statique)
Dans `COURT_CONFIG`, mettre tous les `start` à 0 et tous les `end` à 0.01.

### Désactiver le filtre craie
Dans `index.html`, retirer l'attribut `filter="url(#chalk)"` du `<g id="courtLines">`.

### Désactiver le halo lumineux
Dans `COURT_CONFIG`, mettre `enableHalo: false`.

### Désactiver la parallaxe
Dans `COURT_CONFIG`, mettre `parallaxAmount: 0`.

### Désactiver le point d'accent
Retirer `<circle id="court-accent">` du SVG.

### Changer l'opacité des traits
Modifier `stroke-opacity` dans `.court-bg line, .court-bg circle, .court-bg path` dans `styles.css`.
Ou modifier `COURT_CONFIG.strokeOpacity`.

---

## Accessibilité & fallbacks

| Scénario | Comportement |
|---|---|
| `prefers-reduced-motion: reduce` | Terrain complet affiché statiquement, aucune animation. Halo désactivé. |
| JavaScript désactivé | `html` n'a pas la classe `.js-enabled` → CSS affiche le terrain complet statiquement. |
| Mobile (< 1024 px) | Terrain complet statique en filigrane, pas de tracé progressif, pas de parallaxe, pas de halo. |
| Remontée rapide | Lerp à 0.05 assure un retour fluide — les traits se « dé-dessinent » progressivement. |

---

## Performances

- `requestAnimationFrame` unique (pas de `setInterval`)
- Seules propriétés modifiées : `stroke-dashoffset`, `transform` (translate3d), `opacity` → composition GPU
- Le filtre `#chalk` (`feTurbulence`) est un filtre SVG statique (pas recalculé à chaque frame)
- Le halo utilise `--halo-x` / `--halo-y` en CSS custom properties → repaint minimal
- z-index 0 : derrière tout le contenu, aucune interaction avec cartes/boutons

---

## Fichiers supprimés (pour référence par rapport à la version d'origine)

| Fichier | Raison |
|---|---|
| `ball-animation.js` | Remplacé par le terrain en filigrane |
| `ball-animation.css` | Remplacé par le terrain en filigrane |
