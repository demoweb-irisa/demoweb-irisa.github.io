# Tutoriel : Créer un CMS sur mesure avec Astro, VueJS, DecapCMS et booster son développement avec l'IA

La création d'un site web performant, facilement éditable par des non-techniciens et rapide à développer est le Saint Graal du développement web moderne. 

Dans ce tutoriel, nous allons voir comment mettre en place une architecture **Jamstack** redoutable en utilisant **Astro, VueJS, TypeScript, Tailwind CSS et DecapCMS**. Mieux encore, nous allons découvrir une méthodologie pour **utiliser les LLMs (ChatGPT, Claude, etc.)** afin d'automatiser la génération de nos modèles de données et de nos composants.

Une présentation associée à ce tutoriel est disponible [ici](https://olivier.barais.fr/wpkiller/).

---

## 1. Rappel : Pourquoi choisir l'approche Jamstack ?

Utiliser un CMS basé sur Git avec un workflow DevOps (approche Jamstack) présente des avantages majeurs par rapport aux CMS traditionnels (comme WordPress) :

*   **Sécurité maximale :** Il n'y a pas de base de données ou de serveur d'application exposé en production. Le site n'est composé que de fichiers statiques (HTML, CSS, JS), ce qui réduit drastiquement la surface d'attaque.
*   **Performances inégalées :** Les pages étant pré-générées lors du build, elles sont servies quasi instantanément par un CDN. Les Core Web Vitals s'en trouvent grandement améliorés.
*   **Versionning complet (Git comme source de vérité) :** Le code ET le contenu vivent dans le même dépôt Git. Chaque modification de contenu est un commit. On peut facilement revenir en arrière, travailler sur des branches, et faire des revues (Pull Requests) sur des articles.
*   **Expérience développeur (DX) et hébergement :** L'écosystème s'intègre parfaitement avec les pipelines CI/CD. L'hébergement de fichiers statiques est souvent gratuit ou très peu coûteux.

---

## 2. La Stack Technique : L'équipe de choc

Pour ce projet, nous utilisons des outils modernes qui se complètent parfaitement :

*   **Astro :** Le framework au cœur du projet. Il excelle dans la création de sites riches en contenu. Il génère du HTML statique par défaut tout en permettant d'injecter des composants interactifs ("Astro Islands").
*   **VueJS :** Utilisé pour les composants nécessitant de la réactivité côté client (lecteur vidéo complexe, recherche, filtrage).
*   **Tailwind CSS :** Un framework CSS utilitaire pour styliser nos composants extrêmement rapidement sans quitter nos fichiers de structure.
*   **TypeScript :** Apporte la sécurité du typage, réduisant les bugs et améliorant l'autocomplétion (crucial quand on manipule des modèles de données complexes).
*   **DecapCMS :** Un CMS open-source qui se branche directement sur notre dépôt Git. Il offre une interface d'administration claire pour les rédacteurs, tout en sauvegardant le contenu en fichiers Markdown/MDX.

---

## 3. Initialisation du projet (Quick Start)

Lancez la commande suivante dans votre terminal pour créer le squelette du projet. L'assistant d'Astro va configurer automatiquement les intégrations dont nous avons besoin :

```bash
# N'hésitez pas à remplacer 'my-project' par le nom de votre projet
npm create astro@latest my-project -- --add vue --add mdx --add tailwind --add partytown
cd my-project
```

*(Note : Astro vous demandera si vous souhaitez installer les dépendances et initialiser un dépôt Git. Acceptez.)*

---

## 4. Configuration et ajustements

Une fois le projet créé, quelques ajustements sont nécessaires pour faire cohabiter parfaitement nos outils.

### Configuration d'Astro

Dans le fichier `astro.config.mjs`, ajoutez la rétrocompatibilité pour les collections (utile pour certaines intégrations) :

```javascript
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [mdx(), vue()],
  legacy: {
    collectionsBackwardsCompat: true,
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
```

### Configuration de Tailwind pour le typographie

Pour styliser facilement le contenu Markdown généré par notre CMS, nous utilisons le plugin de typographie de Tailwind.

```bash
npm install -D @tailwindcss/typography
```

Si vous utilisez Tailwind v4 (avec Vite), ajoutez ceci dans votre fichier `src/styles/global.css` :

```css
@import "tailwindcss";
@plugin '@tailwindcss/typography';
```

Puis, assurez-vous que ce fichier CSS est chargé dans votre layout principal (ex: `src/layouts/Layout.astro`) :

```astro
---
import "../styles/global.css";
---
```

---

## 5. Gestion du contenu : MDX et DecapCMS

### Permettre le rendu MDX avancé avec Vue

Parfois, vous aurez besoin de rendre dynamiquement du contenu Markdown ou MDX stocké dans des champs texte. Pour cela, nous pouvons créer un composant Vue dédié.

```bash
npm install markdown-it highlight.js @types/markdown-it
```

*Exemple d'utilisation dans Astro :* Si vous créez un composant [MdxContentEnhanced.vue](https://github.com/demoweb-irisa/demoweb-irisa.github.io/blob/main/src/components/MdxContentEnhanced.vue), vous pourrez l'utiliser ainsi dans vos fichiers `.astro` :

```astro
<MdxContentEnhanced 
  content={video.body} 
  enableCopy={true}
  enableAnchors={true}
  enableHighlight={true}
  client:load
/>
```
*(Le paramètre `client:load` indique à Astro de charger l'interactivité VueJS dans le navigateur).*

### Connecter DecapCMS pour les non-informaticiens

Pour permettre à vos utilisateurs de modifier le contenu sans toucher au code, installez DecapCMS :

```bash
npm install decap-cms-app
```

La mise en place se fait généralement en créant un dossier `public/admin/` contenant un fichier `index.html` (qui charge l'application) et un fichier `config.yml` (qui définit vos champs).
*(Voir la [documentation officielle d'Astro sur DecapCMS](https://docs.astro.build/fr/guides/cms/decap-cms/)).*

**Astuce :** Pour tester l'authentification DecapCMS en local sans déployer, vous pouvez utiliser un proxy local comme [decap-proxy](https://github.com/sterlingwes/decap-proxy).

---

## 6. La Méthodologie "IA" : Générer son architecture avec les LLMs

C'est ici que l'approche devient redoutablement efficace. Dans cette stack, le modèle de données doit être défini à trois endroits pour être cohérent. C'est répétitif pour un humain, mais parfait pour un LLM (comme ChatGPT ou Claude) :

1.  **`src/content/config.ts` :** Le schéma Astro (Zod) pour valider le contenu lors du build.
2.  **`public/admin/config.yml` :** La définition des formulaires pour l'interface de DecapCMS.
3.  **`src/types/types.ts` (Optionnel mais recommandé) :** Les interfaces TypeScript de votre métier.

### Étape A : Modéliser la donnée

Plutôt que d'écrire ces trois fichiers à la main, utilisez ce prompt :

> **Prompt :**
> *"Je développe un site avec Astro + VueJS (en TS) + DecapCMS. L'application doit permettre de lister des vidéos. Je voudrais un modèle de données cohérent pour cette collection de vidéos. Chaque vidéo a une date, une liste de tags, une catégorie, un titre, une description, et un slug.*
> *Peux-tu me générer le contenu des 3 fichiers suivants :*
> *1. `src/content/config.ts` (avec Zod)*
> *2. `public/admin/config.yml` (pour DecapCMS)*
> *3. `src/types/video.ts` (l'interface TypeScript)"*

### Étape B : Générer la partie visuelle

Une fois vos données structurées, demandez à l'IA de construire vos maquettes et vos composants. Assurez-vous d'avoir bien compris le concept de l'architecture "Astro Islands" pour guider l'IA correctement.

> **Prompt :**
> *"J'utilise Tailwind CSS. Peux-tu me proposer un joli layout principal `src/layouts/Layout.astro` et une page `src/pages/index.astro` qui intègre un composant de listing de vidéos `VideoCard.vue`. Donne-moi le code de ces 3 fichiers. L'interface doit être moderne, avec un mode sombre. Donne-moi aussi un exemple concret d'un fichier Markdown de vidéo (`.md`) correspondant au modèle de données."*

### Étape C : Générer les composants techniques complexes

Vous pouvez ensuite enchaîner sur les fonctionnalités plus avancées.

> **Prompt :**
> *"Il faudrait maintenant ajouter la page de détail d'une vidéo (`src/pages/videos/[slug].astro`). Peux-tu me générer ce fichier avec la gestion des routes dynamiques (getStaticPaths) d'Astro ? Ajoute également un composant `VideoPlayer.vue` utilisant Tailwind CSS pour encapsuler la lecture de la vidéo."*

Grâce à cette méthode, l'IA s'occupe du "boilerplate" et de la plomberie, vous laissant le temps de vous concentrer sur l'UX, les règles métier spécifiques et le raffinement de l'interface.

---

## 7. Déploiement automatisé sur GitHub Pages

Puisque tout réside dans Git, le déploiement s'automatise parfaitement via une CI/CD. Voici comment déployer gratuitement votre CMS et votre site sur GitHub Pages.

Créez le fichier `.github/workflows/deploy.yml` à la racine de votre projet :

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:[main] # Se déclenche à chaque push sur main
  workflow_dispatch: # Permet de lancer le déploiement manuellement

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Install, build, and upload your site output
        uses: withastro/action@v3
        # L'action withastro s'occupe automatiquement de npm install et npm run build
        # en détectant votre package manager.

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Important :** Dans les paramètres de votre dépôt GitHub (Settings > Pages), assurez-vous que la source de construction ("Build and deployment") est réglée sur **"GitHub Actions"**.

## Conclusion

En associant la robustesse et les performances de la **Jamstack** (Astro, Vue, Tailwind) avec l'autonomie éditoriale de **DecapCMS**, vous obtenez une base de projet solide et ultra-rapide. L'intégration des **LLMs** comme assistants de développement (pour garantir la cohérence entre le config.ts, le config.yml et les types) transforme des heures de configuration laborieuse en quelques minutes de supervision, décuplant ainsi votre productivité !