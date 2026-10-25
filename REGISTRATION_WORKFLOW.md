# OER — Parcours de validation des inscriptions

1. Le demandeur remplit le formulaire, accepte les conditions et clique sur « Envoyer ma demande ».
2. L'API `/api/register` transmet le dossier à contact@nelvis-france.com. Si la transmission échoue, elle affiche une erreur et ne prétend pas avoir enregistré la demande.
3. Après l'envoi du dossier, le demandeur reçoit automatiquement un accusé de réception portant une référence OER-REQ. L'accusé ne vaut pas immatriculation.
4. NELVIS FRANCE examine l'identité, la catégorie EOI/EOS, l'activité et les éventuelles pièces complémentaires.
5. Après validation, NELVIS FRANCE attribue un IOE unique depuis un registre persistant, génère un certificat vérifiable, puis envoie le message de validation ci-dessous.
6. OER VERIFY doit permettre de retrouver le numéro IOE et son statut. Les étapes 4 à 6 exigent encore une base de données et un espace d'administration sécurisé.

## Message de validation à envoyer après activation du registre

**Objet : OER — Votre enregistrement est validé | IOE [NUMÉRO]**

Bonjour [NOM],

Nous vous confirmons la validation de l'inscription de [ENTREPRISE] dans Ocean Enterprise Registry (OER).

- Catégorie : [EOI/EOS]
- Identifiant IOE : [NUMÉRO UNIQUE]
- Date de validation : [DATE]
- Statut : Actif
- Vérification publique : [LIEN VÉRIFIABLE]
- Certificat OER : [LIEN DU CERTIFICAT]

Votre fiche OER est désormais consultable à l'adresse indiquée.

Cordialement,

Service des inscriptions OER
NELVIS FRANCE
contact@nelvis-france.com

## Configuration obligatoire

Variables Vercel `RESEND_API_KEY` et `OER_EMAIL_FROM` (adresse expéditrice d'un domaine vérifié par le fournisseur). Aucun secret ne doit être ajouté au dépôt GitHub. L'envoi depuis contact@nelvis-france.com exige la validation du domaine auprès du prestataire.

Le dispositif actuel utilise la messagerie comme canal de réception. Il ne comporte pas encore de base de données, d'interface de validation, de génération IOE, de certificat ni de registre public actif. Ne pas envoyer de confirmation de validation avant ces installations.
