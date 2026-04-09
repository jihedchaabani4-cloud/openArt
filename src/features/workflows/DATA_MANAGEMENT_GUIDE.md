# Guide du Data Management (Stores & Hooks)

Ce document explique comment les données circulent dans l'application, en se concentrant sur les **Stores (Zustand)** pour l'état de l'interface et les **Hooks API (React Query)** pour les données serveur.

---

## 1. Stores (État Global UI)

### `useWorkflowsStore` (Zustand)
**Rôle :** Gère l'état de l'interface pour tout ce qui concerne les workflows, les filtres et les sélections.
- **Fichier :** `src/features/workflows/model/useWorkflowsStore.js`
- **États Clés :**
    - `selectedProjectId` / `activeSessionId` : Identifiants du projet et de la session en cours.
    - `filters` : Objet contenant les filtres actifs (types, modèles, recherche par prompt, favoris).
    - `gridSize` : Taille de la grille (`"sm"`, `"md"`, `"lg"`).
    - `isDetailView` / `selectedMediaId` : État de la vue focus (zoom).
    - `referenceImages` : Liste des images utilisées comme références pour la génération.
- **Actions Clés :**
    - `setFilter(key, value)` : Met à jour un filtre spécifique.
    - `addReference(asset)` : Ajoute une image de référence.
    - `setWorkflowMode(mode)` : Change le mode de génération (image, vidéo, etc.).

---

## 2. API Hooks (Données Serveur)

### `workflowsApi` (React Query)
**Rôle :** Gère la communication avec le backend pour les workflows et les médias.
- **Fichier :** `src/features/workflows/api/workflowsApi.js`
- **Hooks de Lecture :**
    - `useProjectData(projectId, sessionId)` : **Source unique de vérité.** Récupère tout le contenu d'un projet (sessions, workflows, media).
    - `useProjectSessions(projectId)` : Retourne uniquement la liste des sessions.
- **Hooks d'Action (Mutations) :**
    - `useGenerateMutation()` : Lance une nouvelle génération (Image ou Vidéo).
    - `useRemoveWorkflow()` : Supprime un workflow complet.
    - `useToggleLike()` : Alterne l'état "Favoris" d'un média.

### `projectsApi` (React Query)
**Rôle :** Gère la liste des projets et la création de nouveaux projets.
- **Fichier :** `src/features/projects/api/projectsApi.js`
- **Hooks :**
    - `useProjects()` : Liste tous les projets de l'utilisateur.
    - `useCreateProject()` : Crée un nouveau projet.

---

## 3. Hooks de Transformation (Logic)

### `useFilteredWorkflows`
**Rôle :** Prend les données brutes du serveur et applique les filtres locaux du store.
- **Fichier :** `src/features/workflows/model/useFilteredWorkflows.js`
- **Fonctionnement :** 
    1. Appelle `useProjectData`.
    2. Récupère les `filters` depuis `useWorkflowsStore`.
    3. Retourne une liste de `filteredWorkflows` prête à être affichée.

### `useMediaActions`
**Rôle :** Encapsule toutes les actions possibles sur un média (Like, Delete, Reuse, Download).
- **Fichier :** `src/features/workflows/model/useMediaActions.js`
- **Utilité :** Permet de centraliser la logique pour que les composants UI (comme `MediaGridItem`) n'aient qu'à appeler des fonctions simples comme `handleLike()` ou `handleDelete()`.

---

## Flux de Données (Data Flow)

1. **Fetch :** Les données arrivent du backend via `useProjectData` (React Query).
2. **Store :** L'utilisateur change un filtre dans `useWorkflowsStore` (Zustand).
3. **Compute :** `useFilteredWorkflows` recalcule automatiquement la liste des workflows à afficher en combinant les deux sources.
4. **Render :** La page passe la liste finale au composant `GenerationsStudio`.
5. **Action :** Quand l'utilisateur clique sur "Like", `useMediaActions` appelle une mutation dans `workflowsApi`, ce qui invalide le cache et relance le cycle.

*Note : Les alias comme `useGenerationsStore` et `generationsApi` pointent vers ces nouveaux fichiers pour assurer la compatibilité.*
