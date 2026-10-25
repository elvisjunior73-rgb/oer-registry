const clean=(v,n=2000)=>String(v??'').trim().slice(0,n);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'Méthode non autorisée'});
 const d=req.body||{},name=clean(d.name,150),email=clean(d.email,254),subject=clean(d.subject,100),message=clean(d.message,4000),company=clean(d.company,200);
 if(d.website)return res.status(400).json({error:'Requête refusée'});
 if(!name||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!message||!['Partenariat','Précisions sur OER','Inscription EOI / EOS','Vérification IOE','Assistance technique','Réclamation','Données personnelles / RGPD','Presse et communication','Autre demande'].includes(subject))return res.status(400).json({error:'Complétez tous les champs obligatoires.'});
 const key=process.env.OPENSEND_API_KEY||process.env.RESEND_API_KEY;
 if(!key||!process.env.OER_EMAIL_FROM)return res.status(503).json({error:'Messagerie temporairement indisponible'});
 const send=async p=>{const r=await fetch((process.env.OPENSEND_API_URL||'https://api.resend.com')+'/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(p)});if(!r.ok)throw Error('Email '+r.status)};
 const ref='OER-CON-'+crypto.randomUUID().slice(0,10).toUpperCase();
 try{
 await send({from:process.env.OER_EMAIL_FROM,to:['contact@nelvis-france.com'],reply_to:email,subject:'[OER CONTACT] '+subject+' — '+ref,html:'<h2>Contact OER</h2><p><b>Référence :</b> '+ref+'</p><p><b>Objet :</b> '+escape(subject)+'</p><p><b>Nom :</b> '+escape(name)+'</p><p><b>Organisation :</b> '+escape(company)+'</p><p><b>Email :</b> '+escape(email)+'</p><p style="white-space:pre-wrap">'+escape(message)+'</p>'});
 try{await send({from:process.env.OER_EMAIL_FROM,to:[email],reply_to:'contact@nelvis-france.com',subject:'OER — Confirmation de votre message '+ref,html:'<p>Bonjour '+escape(name)+',</p><p>Nous avons reçu votre demande : <b>'+escape(subject)+'</b>.</p><p>Référence : <b>'+ref+'</b>.</p><p>Notre équipe vous répondra après examen.</p><p>OER — contact@nelvis-france.com</p>'})}catch{}
 return res.status(200).json({ok:true,reference:ref});
 }catch{return res.status(502).json({error:"Le message n'a pas pu être envoyé. Réessayez."})}
}