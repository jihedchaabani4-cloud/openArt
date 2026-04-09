# Guide des Composants Studio (Pure UI)

Ce document récapitule la structure des composants du Studio après le refactoring. Tous ces composants sont désormais **Pure UI**, ce qui signifie qu'ils reçoivent leurs données via des **Props** et ne dépendent plus directement de l'état global (Zustand) ou des APIs (React Query).

---

## 1. GenerationsStudio
**Rôle :** Layout principal de la galerie et gestion de la vue détaillée.
- **Fichier :** `src/widgets/StudioLayout/GenerationsStudio/GenerationsStudio.jsx`
- **Props :**
    - `workflows` (Array) : Liste des objets Workflow à afficher.
    - `isLoading` (Boolean) : Affiche l'état de chargement.
    - `gridSize` (String) : Taille de la grille (`"sm"`, `"md"`, `"lg"`).
    - `isDetailView` (Boolean) : Active l'affichage de la vue détaillée (overlay).
    - `selectedMediaId` (String) : ID du média sélectionné pour le focus.
    - `onSelectMedia` (Function) : Callback quand un média est cliqué.
    - `onCloseDetail` (Function) : Callback pour fermer la vue détaillée.
    - `emptyMessage` (String) : Message à afficher si la liste est vide.

---

---

## 2. MediaGridItem
**Rôle :** L'unité de base (Image ou Vidéo) affichée dans la grille.
- **Fichier :** `src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx`
- **Sous-composants :** `ActionBtn.jsx`, `constants.js`
- **Props :**
    - `workflow` (Object) : L'objet workflow individuel.
    - `onClick` (Function) : Action au clic simple.
    - `onLike` (Function) : Action de favoris.
    - `onDelete` (Function) : Suppression de cet item précis.
    - `onDownload` (Function) : Téléchargement du fichier brut.
    - `onDragStart` / `onDragEnd` (Functions) : Gestion du Drag & Drop vers la barre de prompt.

---

## 3. UploadedMediaBlock
**Rôle :** Représente un bloc de médias importés (Uploads).
- **Fichier :** `src/widgets/StudioLayout/GenerationsStudio/UploadedMediaBlock/UploadedMediaBlock.jsx`
- **Props :**
    - `assetGroup` (Object) : Groupe d'assets importés.
    - `gridSize` (String) : Taille de la grille.
    - `onDragStart` / `onDragEnd` (Functions) : Gestion du Drag & Drop.

---

## Flux de Données (Architecture)
Pour utiliser ces composants, le parent (généralement la **Page** ou un **Controller**) doit :
1. Récupérer les données via `useProjectData`.
2. Transformer les données si nécessaire.
3. Passer les états et les fonctions de callback (depuis les stores ou mutations) aux composants UI.

*Note : Les alias de compatibilité (ex: `useGenerationsStore`) sont maintenus pour ne pas casser l'existant.*
