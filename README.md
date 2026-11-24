# Carnet Zeller sur GitHub Pages et Firebase

Deux comptes, une bibliothèque commune. Les cours et dossiers s’actualisent
toutes les dix secondes hors de l’éditeur. Si un cours a changé depuis son
ouverture, l’éditeur propose d’enregistrer le brouillon comme copie.
La bibliothèque démarre vide. Les anciens cours ne sont pas importés automatiquement.

## 1. Configurer Firebase

1. Dans https://console.firebase.google.com/, crée un projet et ajoute une
   application Web. Copie son objet firebaseConfig dans firebase-config.js.
2. Dans Authentication → Sign-in method, active E-mail/Mot de passe.
   Dans Authentication → Users, ajoute les deux comptes avec leurs e-mails
   et leurs mots de passe. Copie leurs e-mails et UID dans firebase-config.js.
   Les identifiants à saisir sur le site restent les clés thomas et ami.
   Utilise deux UID distincts. Chaque mot de passe reste dans Firebase.
3. Crée une base Cloud Firestore. Dans firestore.rules, remplace UID_THOMAS
   et UID_AMI par les UID correspondants. Colle le résultat dans
   Firestore → Règles et clique sur Publier. Garde la même correspondance
   entre comptes et UID dans le fichier JS et dans les règles.

Thomas voit le bouton Administration et peut enregistrer ses notes privées.
Les règles Firestore refusent aussi l’accès à ces notes au deuxième compte,
même si celui-ci ouvre directement #admin ou appelle Firestore autrement.
La gestion des e-mails et mots de passe se fait dans Firebase Authentication.

## 2. Activer les pièces jointes si nécessaire

Les cours, dossiers et images intégrées fonctionnent avec Firestore.
Les pièces jointes sont désactivées par défaut. Pour les activer, Cloud
Storage for Firebase nécessite le forfait Blaze (facturation à l’usage).

1. Crée le bucket dans Firebase Storage et vérifie storageBucket dans la configuration.
2. Remplace les deux UID dans storage.rules et publie ces règles dans Storage → Règles.
3. Configure le CORS du bucket pour autoriser GET depuis l’origine exacte de
   ton site, par exemple https://monpseudo.github.io. Enregistre le JSON dans
   cors.json et applique-le avec Google Cloud CLI :

   ```json
   [{"origin":["https://monpseudo.github.io"],"method":["GET"],"maxAgeSeconds":3600}]
   ```

   ```sh
   gcloud storage buckets update gs://NOM_DU_BUCKET --cors-file=cors.json
   ```

4. Passe attachmentsEnabled à true dans firebase-config.js. La limite est de 20 Mo par fichier.

## 3. Publier sur GitHub Pages

Copie index.html, firebase-api.js, firebase-config.js et .nojekyll à la racine
de la branche main du dépôt. Dans Settings → Pages, sélectionne
Deploy from a branch, main, / (root), puis Save.

Ouvre le lien GitHub Pages depuis deux navigateurs ou profils. Connecte Thomas
sur l’un et le deuxième compte sur l’autre. Crée un dossier chez Thomas et
vérifie qu’il apparaît chez l’autre. Essaie aussi d’ouvrir #admin avec les deux
comptes. Le dépôt contient la configuration Web publique et aucun mot de passe.
