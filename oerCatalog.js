export const catalog=[
{id:'activation-eoi',name:'Activation EOI',price:29,description:'Activation de l’identité conventionnelle EOI après validation du greffe, numéro IOE et certificat numérique. Ne crée pas une entreprise au regard du droit national.',requiresApproval:true},
{id:'activation-eos',name:'Activation EOS',price:59,description:'Activation de l’identité conventionnelle EOS d’une société déjà légalement constituée, numéro IOE et certificat numérique après validation.',requiresApproval:true},
{id:'page-vitrine',name:'Page vitrine professionnelle',price:49,description:'Une page web responsive de présentation, coordonnées et appel à action. Nom de domaine et hébergement tiers non inclus.'},
{id:'site-5-pages',name:'Site vitrine 5 pages',price:249,description:'Site responsive jusqu’à cinq pages avec formulaire de contact. Textes et visuels fournis par le client. Domaine et hébergement non inclus.'},
{id:'catalogue-whatsapp',name:'Catalogue WhatsApp',price:79,description:'Catalogue numérique jusqu’à 20 références avec boutons de contact WhatsApp. Photos et prix fournis par le client.'},
{id:'sourcing-5',name:'Sourcing 5 fournisseurs',price:69,description:'Recherche et transmission de cinq pistes fournisseurs avec coordonnées publiques et synthèse. Disponibilité et fiabilité non garanties.'},
{id:'sourcing-10',name:'Sourcing 10 fournisseurs',price:119,description:'Recherche et transmission de dix pistes fournisseurs avec coordonnées publiques et synthèse. Disponibilité et fiabilité non garanties.'},
{id:'verification-fournisseur',name:'Vérification fournisseur',price:59,description:'Contrôle documentaire à distance d’un fournisseur à partir de sources accessibles et rapport des limites. Ni audit sur place ni garantie de solvabilité.'},
{id:'comparaison-devis',name:'Comparaison de devis',price:79,description:'Analyse comparative de trois devis maximum : prix, conditions commerciales, transport et risques identifiables.'},
{id:'business-plan',name:'Business plan simplifié',price:99,description:'Document synthétique présentant activité, marché, offre, hypothèses financières et risques à partir des informations du client.'},
{id:'consultation-60',name:'Consultation 60 minutes',price:59,description:'Entretien à distance de 60 minutes sur la stratégie commerciale ou le sourcing, sur rendez-vous.'},
{id:'assistant-ia',name:'Assistant IA simple',price:99,description:'Configuration initiale d’un assistant FAQ sur une plateforme compatible, jusqu’à 20 questions. Abonnements et API tiers exclus.'}
];
export const findProduct=id=>catalog.find(p=>p.id===id);
