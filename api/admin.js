import {list,get,put} from '@vercel/blob';
const load=async pathname=>{const {blobs}=await list({prefix:pathname,limit:1});const b=blobs.find(x=>x.pathname===pathname);if(!b)return null;const r=await get(b.url,{access:'private'});return r?await new Response(r.stream).json():null};
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.headers.authorization!=='Bearer '+process.env.OER_ADMIN_TOKEN||!process.env.OER_ADMIN_TOKEN)return res.status(401).json({error:'Accès réservé au greffe'});
 if(req.method==='GET'){
 try{
 const all=async prefix=>{let cursor,blobs=[];do{const p=await list({prefix,limit:100,cursor});blobs.push(...p.blobs);cursor=p.hasMore?p.cursor:undefined}while(cursor&&blobs.length<1000);return blobs};
 const [apps,decs]=await Promise.all([all('applications/'),all('decisions/')]);
 const read=async b=>{try{const r=await get(b.url,{access:'private'});return r?await new Response(r.stream).json():null}catch{return null}};
 const [entries,decisions]=await Promise.all([Promise.all(apps.map(read)),Promise.all(decs.map(read))]);
 const byRef=new Map(decisions.filter(Boolean).map(d=>[d.ref,d]));
 const applications=entries.filter(Boolean).map(d=>{const v=byRef.get(d.ref);return {ref:d.ref,business:d.business,name:d.name,category:d.category,email:d.email,activity:d.activity,sector:d.sector,nationalId:d.nationalId,createdAt:d.createdAt,status:v?.status||'pending',ioe:v?.ioe||null,approvedAt:v?.approvedAt||null,decidedAt:v?.decidedAt||null}}).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
 return res.status(200).json({applications,stats:{total:applications.length,pending:applications.filter(x=>x.status==='pending').length,approved:applications.filter(x=>x.status==='approved').length,rejected:applications.filter(x=>x.status==='rejected').length},truncated:apps.length>=1000});
 }catch(e){return res.status(503).json({error:'Lecture du registre indisponible.'})}
 }
 if(req.method!=='POST')return res.status(405).json({error:'Méthode non autorisée'});
 const ref=String(req.body?.reference||'').trim().toUpperCase(),decision=req.body?.decision;
 if(!/^OER-REQ-[A-F0-9]{12}$/.test(ref)||!['approve','reject'].includes(decision))return res.status(400).json({error:'Décision ou référence invalide'});
 try{
 const d=await load('applications/'+ref+'.json');if(!d)return res.status(404).json({error:'Dossier introuvable'});
 const existing=await load('decisions/'+ref+'.json');if(existing)return res.status(409).json({error:'Dossier déjà traité',decision:existing});
 if(decision==='reject'){await put('decisions/'+ref+'.json',JSON.stringify({ref,status:'rejected',decidedAt:new Date().toISOString()}),{access:'private',addRandomSuffix:false,allowOverwrite:false});return res.status(200).json({ok:true,status:'rejected'})}
 const ioe='IOE-'+d.category+'-'+crypto.randomUUID().replace(/-/g,'').slice(0,12).toUpperCase(),approvedAt=new Date().toISOString(),url='https://www.oer-registry.online/#verify?ioe='+ioe;
 const [{PDFDocument,StandardFonts,rgb},{default:QRCode}]=await Promise.all([import('pdf-lib'),import('qrcode')]);
 const pdf=await PDFDocument.create(),page=pdf.addPage([595,842]),font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const line=(str,y,size=13,heavy=false)=>page.drawText(String(str).replace(/[^\x20-\x7EÀ-ÿ]/g,' '),{x:55,y,size,font:heavy?bold:font,color:rgb(.04,.14,.23),maxWidth:485});
 line('OER — OCEAN ENTERPRISE REGISTRY',760,21,true);line('CERTIFICAT D INSCRIPTION CONVENTIONNELLE',715,17,true);
 line('Entreprise : '+d.business,660,14,true);line('Identifiant IOE : '+ioe,628,14,true);line('Categorie : '+d.category,596);line('Activite : '+d.activity,564);line('Date de validation : '+approvedAt.slice(0,10),532);line('Statut : ACTIF',500,14,true);
 line('OER est un registre contractuel prive.',260,11);line('Ce certificat ne remplace pas une immatriculation publique.',242,11);
 line('Verifier : www.oer-registry.online',210,11);
 const png=await QRCode.toDataURL(url,{margin:1,width:220});const img=await pdf.embedPng(Buffer.from(png.split(',')[1],'base64'));page.drawImage(img,{x:55,y:290,width:145,height:145});
 const bytes=await pdf.save();
 await put('public/'+ioe+'.json',JSON.stringify({ioe,ref,business:d.business,category:d.category,activity:d.activity,status:'active',approvedAt}),{access:'private',addRandomSuffix:false,allowOverwrite:false});
 const cert=await put('certificates/'+ioe+'.pdf',Buffer.from(bytes),{access:'private',addRandomSuffix:false,contentType:'application/pdf'});
 await put('decisions/'+ref+'.json',JSON.stringify({ref,ioe,status:'approved',approvedAt,certificate:cert.url}),{access:'private',addRandomSuffix:false,allowOverwrite:false});
 const key=process.env.OPENSEND_API_KEY||process.env.RESEND_API_KEY;
 let notified=false;if(key){try{const r=await fetch((process.env.OPENSEND_API_URL||'https://api.resend.com')+'/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.OER_EMAIL_FROM,to:[d.email],subject:'OER — Inscription validée '+ioe,html:'<p>Votre inscription OER a été validée.</p><p>Identifiant : <strong>'+ioe+'</strong></p><p>Vérification : <a href="'+url+'">'+url+'</a></p><p>Le certificat PDF est joint. Ce document est une attestation conventionnelle privée.</p>',attachments:[{filename:'Certificat-'+ioe+'.pdf',content:Buffer.from(bytes).toString('base64')}]})});notified=r.ok}catch{}}
 return res.status(200).json({ok:true,ioe,notified});
 }catch(e){return res.status(500).json({error:'Opération interrompue : '+e.message})}
}