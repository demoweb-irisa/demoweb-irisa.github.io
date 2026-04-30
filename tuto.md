# Tutoriel : Créer un CMS sur mesure avec Astro, VueJS, DecapCMS et booster son développement avec l'IA


[TOC]

---

La création d'un site web performant, facilement éditable par des non-techniciens et rapide à développer est le Saint Graal du développement web moderne. 

Dans ce tutoriel, nous allons voir comment mettre en place une architecture **Jamstack** redoutable en utilisant **Astro, VueJS, TypeScript, Tailwind CSS et DecapCMS**. Mieux encore, nous allons découvrir une méthodologie pour **utiliser les LLMs (ChatGPT, Claude, etc.)** afin d'automatiser la génération de nos modèles de données et de nos composants.

Une présentation associée à ce tutoriel est disponible [ici](https://olivier.barais.fr/wpkiller/).

---

## 1. Rappel : Pourquoi choisir l'approche Jamstack ?

Utiliser un CMS basé sur Git avec un workflow DevOps (approche Jamstack) présente des avantages majeurs par rapport aux CMS traditionnels (comme WordPress) :

*   **Sécurité maximale :** Il n'y a pas de base de données ou de serveur d'application exposé en production. Le site n'est composé que de fichiers statiques (HTML, CSS, JS), ce qui réduit drastiquement la surface d'attaque. Dans un monde où les IAs sont capables de trouver aisément des vulnérabilités dans le code, le secret est de réduire la surface d'attaque au maximum en fournissant des architectures sécurisées au design. 
*   **Performances inégalées :** Les pages étant pré-générées lors du build, elles sont servies quasi instantanément par un CDN. Les [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals?hl=fr) s'en trouvent grandement améliorés.
*   **Versionning complet (Git comme source de vérité) :** Le code ET le contenu vivent dans le même dépôt Git. Chaque modification de contenu est un commit. On peut facilement revenir en arrière, travailler sur des branches, et faire des revues (Pull Requests) sur des articles.
*   **Expérience développeur (DX) et hébergement :** L'écosystème s'intègre parfaitement avec les pipelines CI/CD. L'hébergement de fichiers statiques est souvent gratuit ou très peu coûteux.


:warning: Le principal problème généralement pour ce type d'approche est l'absence de connaissance sur git et/ou Markdown pour les utilisateurs finaux ayant en charge l'édition du contenu. C'est la que [DecapCMS](https://decapcms.org/) vient à la rescousse. 


---

## 2. La Stack Technique : L'équipe de choc

Pour ce projet, nous utilisons des outils modernes qui se complètent parfaitement :

*   **Astro :** Le framework au cœur du projet. Il excelle dans la création de sites riches en contenu. Il génère du HTML statique par défaut tout en permettant d'injecter des composants interactifs ("[Astro Islands](https://docs.astro.build/fr/concepts/islands/)").
*   **TypeScript :** Apporte la sécurité du typage, réduisant les bugs et améliorant l'autocomplétion (crucial quand on manipule des modèles de données complexes).
*   **VueJS :** Utilisé pour les composants nécessitant de la réactivité côté client (lecteur vidéo complexe, recherche, filtrage). Avec son modèle de développement élégant pour les composants Web et son support de Typescript, il permet de créer des composants maintenables et testables.
*   **Tailwind CSS :** Un framework CSS utilitaire pour styliser nos composants extrêmement rapidement sans quitter nos fichiers de structure.
*   **DecapCMS :** Un CMS open-source qui se branche directement sur notre dépôt Git. Il offre une interface d'administration claire pour les rédacteurs (sans besoin d'avoir des connaissances en Markdown ou Git), tout en sauvegardant le contenu en fichiers Markdown/MDX.

---

## 3. Initialisation du projet (Quick Start)

Lancez la commande suivante dans votre terminal pour créer le squelette du projet. L'assistant d'Astro va configurer automatiquement les intégrations dont nous avons besoin :

```bash
# N'hésitez pas à remplacer 'my-project' par le nom de votre projet
npm create astro@latest my-project -- --add vue --add mdx --add tailwind --add partytown
cd my-project
```

*(Note : Astro vous demandera si vous souhaitez installer les dépendances et initialiser un dépôt Git. Acceptez. Et prenez le template par défaut.)*

---

## 4. Configuration et ajustements

Une fois le projet créé, quelques ajustements sont nécessaires pour faire cohabiter parfaitement nos outils.

### Configuration d'Astro

Dans le fichier `astro.config.mjs`, ajoutez la rétrocompatibilité pour les collections (utile pour certaines intégrations en particulier quand on utilise les LLMs pour la génération des modèles de données. En effet, Astro a changé la façon de définir son modèle de données depuis la version 6 mais la plupart des LLMs du marché ont été entraînés sur l'ancienne documentation.) :

```javascript
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [mdx(), vue()],
  // c'est ici que l'on ajoute le code
  legacy: {
    collectionsBackwardsCompat: true,
  },
  ///
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

Ajoutez ceci dans votre fichier `src/styles/global.css` :

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

### 5. Connecter DecapCMS pour les éditeurs de contenu "non-informaticiens" (Sans connaissance git ou MD)


DecapCMS (anciennement NetlifyCMS) va nous permettre de modifier notre contenu Markdown via une interface d'administration claire, sans avoir à toucher au code source.

Tout d'abord, installez le package :
```bash
npm install decap-cms-app
```

La mise en place se fait généralement en créant un dossier `public/admin/` contenant un fichier `index.html` (qui charge l'application) et un fichier `config.yml` (qui définit vos champs).
*(Voir la [documentation officielle d'Astro sur DecapCMS](https://docs.astro.build/fr/guides/cms/decap-cms/)).*



Pour que le CMS fonctionne, nous devons créer une interface d'administration statique. Dans votre dossier `public`, créez un sous-dossier `admin/` et ajoutez-y les deux fichiers suivants :

**1. Le fichier `public/admin/index.html`**
C'est le point d'entrée du CMS. Il va charger l'interface React de DecapCMS.
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>Administration - DecapCMS</title>
  </head>
  <body>
    <!-- Script qui charge l'application DecapCMS -->
    <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
  </body>
</html>
```

**2. Le fichier `public/admin/config.yml`**
C'est ici que nous définissons comment le CMS interagit avec notre dépôt Git et la structure de nos données.
```yaml
backend:
  name: git-gateway # Permet la connexion avec GitHub via Netlify/Decap
  branch: main      # Branche sur laquelle les commits seront poussés

# Active le flux de travail brouillon / en relecture / prêt
publish_mode: editorial_workflow

# Dossier où seront stockées les images uploadées depuis le CMS
media_folder: "public/images/uploads"
public_folder: "/images/uploads"

collections:
  # C'est ici que vous définirez vos modèles de données (voir la règle des 3 fichiers ci-dessous)
  - name: "blog"
    label: "Articles de Blog"
    folder: "src/content/blog"
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    fields:
      - { label: "Titre", name: "title", widget: "string" }
      - { label: "Date", name: "date", widget: "datetime" }
      - { label: "Corps du texte", name: "body", widget: "markdown" }
```
Une fois votre site déployé, vous pourrez accéder à l'interface en tapant `votresite.com/admin/`.


**Astuce :** Pour utiliser l'authentification DecapCMS depuis un CMS comme githubpage, vous pouvez utiliser un proxy sous forme de FaaS comme [decap-proxy](https://github.com/sterlingwes/decap-proxy).


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

Une fois vos données structurées, demandez à l'IA de construire vos maquettes et vos composants. Assurez-vous d'avoir bien compris le concept de l'architecture "[Astro Islands](https://docs.astro.build/fr/concepts/islands/)" pour guider l'IA correctement et que vous avez de bonnes bases sur la notion de [composant Web](https://www.ionos.fr/digitalguide/sites-internet/developpement-web/web-components/) et l'utilisation de [VueJS](https://vuejs.org/) ou autre framework de composants Web.

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

### 8. Rendu Markdown ou MDX dynamique avec VueJS

**Pourquoi utiliser VueJS pour le Markdown ?**
Astro gère nativement et brillamment le Markdown et le MDX grâce à son composant natif `<Content />`. C'est la méthode recommandée pour afficher les articles générés dans `src/content/`. 

Cependant, dans des architectures headless ou dynamiques, il arrive souvent que l'on récupère du contenu Markdown **brut** sous forme de chaîne de caractères (par exemple via un champ texte spécifique d'une API externe, ou une donnée injectée dynamiquement côté client). Dans ce cas précis, le `<Content />` d'Astro, qui fonctionne à la compilation, ne suffit plus.

Pour palier à cela, nous pouvons créer un composant Vue dédié qui utilisera la librairie `markdown-it` pour parser ce texte brut à la volée.

```bash
npm install markdown-it highlight.js @types/markdown-it
```

*Exemple d'utilisation dans Astro :* Si vous créez un composant [MdxContentEnhanced.vue](https://github.com/demoweb-irisa/demoweb-irisa.github.io/blob/main/src/components/MdxContentEnhanced.vue), vous pourrez l'utiliser ainsi dans vos fichiers `.astro` :

**Comment l'utiliser dans un fichier Astro ?**
Si vous récupérez une chaîne de caractères Markdown brute depuis votre CMS, vous pouvez l'afficher ainsi :

```astro
---
import MdxContentEnhanced from '../components/MdxContentEnhanced.vue';
const rawMarkdownString = "**Bonjour**, ceci est un *test* récupéré dynamiquement !";
---

<!-- Utilisation du composant client Vue -->
<MdxContentEnhanced content={rawMarkdownString} client:load />
```


*(Le paramètre `client:load` indique à Astro de charger l'interactivité VueJS dans le navigateur).*



## Conclusion

En associant la robustesse et les performances de la **Jamstack** (Astro, Vue, Tailwind) avec l'autonomie éditoriale de **DecapCMS**, vous obtenez une base de projet solide et ultra-rapide. L'intégration des **LLMs** comme assistants de développement (pour garantir la cohérence entre le config.ts, le config.yml et les types) transforme des heures de configuration laborieuse en quelques minutes de supervision, décuplant ainsi votre productivité !


# Quelques slides de cours pour aller plus loin


- [**Introduction à la notion de Web Engineering**](https://olivier.barais.fr/web.intro)
- [js](https://olivier.barais.fr/web.javascript)
- [nodejs](https://olivier.barais.fr/web.nodejs/)
- [**dev tooling**](https://olivier.barais.fr/web.tooling/)
- [**Typescript**](https://olivier.barais.fr/web.typescript)
- [**Web component and angular**](https://olivier.barais.fr/web.angular/)
- [react](https://olivier.barais.fr/web.react/)
- [**vuejs**](https://olivier.barais.fr/web.vuejs/)
- [test](https://olivier.barais.fr/web.test/)
- [**Jamstack**](https://olivier.barais.fr/jamstack/)
- [advanced feature](https://olivier.barais.fr/web.advanced/)
- [conclusion](https://olivier.barais.fr/web.conclusion/)
