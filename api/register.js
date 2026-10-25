const headers={'Content-Type':'application/json','Cache-Control':'no-store'};
const clean=(v,max=300)=>String(v??'').trim().slice(0,max);
const htmlEscape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Méthode non autorisée'});
 const d=req.body||{};const email=clean(d.email,254),name=clean(d.name),business=clean(d.business),activity=clean(d.activity),category=clean(d.category,3),sector=clean(d.sector),details=clean(d.details),nationalId=clean(d.nationalId),code=clean(d.code);
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!name||!business||!activity||!['EOI','EOS'].includes(category)||!d.accepted)return res.status(400).json({error:'Dossier incomplet ou conditions non acceptées.'});
 if(d.website) return res.status(400).json({error:'Demande refusée.'});
 if(!(process.env.OPENSEND_API_KEY||process.env.RESEND_API_KEY)||!process.env.OER_EMAIL_FROM)return res.status(503).json({error:"Le service d'envoi n'est pas encore configuré. Contactez contact@nelvis-france.com."});
 const ref='OER-REQ-'+crypto.randomUUID().slice(0,12).toUpperCase();
 const fields={Référence:ref,Catégorie:category,'Nom commercial':business,'Titulaire / représentant':name,'Email':email,Secteur:sector,Activité:activity,'Activités complémentaires':details,'Code OER déclaré':code,'Immatriculation territoriale':nationalId};
 const detail=Object.entries(fields).map(([k,v])=>'<p><b>'+htmlEscape(k)+'</b> : '+htmlEscape(v)+'</p>').join('');
 const sender=process.env.OER_EMAIL_FROM;
 const send=async payload=>{const r=await fetch((process.env.OPENSEND_API_URL||'https://api.resend.com')+'/emails',{method:'POST',headers:{Authorization:'Bearer '+(process.env.OPENSEND_API_KEY||process.env.RESEND_API_KEY),'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)throw Error('Service email '+r.status);return r.json()};
 try{
 await send({from:sender,to:['contact@nelvis-france.com'],reply_to:email,subject:'[OER] Nouvelle demande '+ref+' — '+business,html:'<h2>Nouvelle demande OER</h2>'+detail+'<p>Statut : en attente de vérification. Aucun IOE attribué.</p>'});
 let receiptSent=true;
 try{await send({from:sender,to:[email],reply_to:'contact@nelvis-france.com',subject:'OER — Accusé de réception '+ref,html:'<p>Bonjour '+htmlEscape(name)+',</p><p>Nous confirmons la réception de votre demande d’inscription pour <b>'+htmlEscape(business)+'</b>.</p><p>Référence : <b>'+ref+'</b>.</p><p>Votre dossier est en cours d’examen. Cette confirmation ne constitue pas une validation d’inscription et aucun identifiant IOE n’a encore été attribué.</p><p>NELVIS FRANCE — contact@nelvis-france.com</p>'})}catch(e){receiptSent=false}
 return res.status(200).json({ok:true,reference:ref,receiptSent});
 }catch(e){return res.status(502).json({error:"L'envoi de votre dossier a échoué. Veuillez réessayer ou écrire à contact@nelvis-france.com."})}
}