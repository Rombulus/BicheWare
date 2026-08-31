# Le jeu de la biche

Jeu web tactile composé de mini-jeux, jouable sur ordinateur, iPad et autres appareils mobiles modernes.

## Jouer sur iPad

Le jeu doit être servi par une adresse web (`https://...`). L’ouverture directe du fichier `index.html` depuis l’app Fichiers ne permet pas toujours de charger les modules JavaScript.

Dans Safari sur iPad :

1. Ouvrir l’adresse publiée.
2. Toucher **Partager**, puis **Sur l’écran d’accueil**.
3. Lancer le jeu depuis l’icône ajoutée pour une expérience plein écran.

Les jeux tactiles utilisent le doigt pour cliquer, glisser, gratter ou déplacer les objets. Les mini-jeux de vol et de course affichent automatiquement leurs contrôles à l’écran.

## Mettre à jour le jeu

Le workflow `.github/workflows/deploy-pages.yml` republie automatiquement le contenu à chaque `push` sur `main`.

```powershell
git add .
git commit -m "Mise à jour du jeu"
git push origin main
```

Après quelques instants, recharger Safari. Si le jeu est installé sur l’écran d’accueil, fermer complètement le jeu puis le relancer pour récupérer la nouvelle version.

## Première activation de GitHub Pages

Dans GitHub : **Settings → Pages → Source : GitHub Actions**. Une fois activé, l’URL publique sera affichée dans l’exécution du workflow et dans la section Pages du dépôt.

Pour conserver les outils développeur sur ordinateur, ajouter `?dev=1` à l’URL. Ils sont masqués automatiquement sur les appareils tactiles.
