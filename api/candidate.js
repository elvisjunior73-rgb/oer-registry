import {localize} from './oer-language.js';
import {list,get,put} from '@vercel/blob';
import {createHmac,timingSafeEqual,randomBytes} from 'node:crypto';
const secret=()=>process.env.OER_ADMIN_TOKEN||'';
const sign=s=>createHmac('sha256',secret()).update(s).digest('hex');
const read=async path=>{const {blobs}=await list({prefix:path,limit:1});const b=blobs.find(x=>x.pathname===path);if(!b)return null;const r=await get(b.url,{access:'private'});return r?new Response(r.stream).json():null};
const clean=(s,n=1000)=>String(s??'').trim().slice(0,n);
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const d=req.body||{},action=clean(d.action,30),ref=clean(d.reference,50).toUpperCase(),email=clean(d.email,254).toLowerCase();
 if(req.method==='POST'&&action==='request'){
 if(!/^OER-REQ-[A-F0-9]{12}$/.test(ref)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json({error:'Référence et e-mail requis'});
 try{const application=await read('applications/'+ref+'.json');if(application?.email?.toLowerCase()===email){
 const exp=Date.now()+48*60*60*1000,nonce=randomBytes(12).toString('hex'),payload=Buffer.from(JSON.stringify({ref,email,exp,nonce})).toString('base64url'),token=payload+'.'+sign(payload);
 const url='https://www.oer-registry.online/candidat.html?token='+encodeURIComponent(token);
 const key=process.env.OPENSEND_API_KEY||process.env.RESEND_API_KEY;
 if(key){const r=await fetch((process.env.OPENSEND_API_URL||'https://api.resend.com')+'/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.OER_EMAIL_FROM,to:[email],subject:'OER — '+localize(application.language,'login')[0],html:'<p>'+localize(application.language,'login')[1]+'</p><p><a href="'+url+'">'+localize(application.language,'login')[2]+'</a></p>'})});if(!r.ok)throw Error('Service email indisponible')}
 }
 return res.status(200).json({ok:true,message:'Si les informations correspondent à un dossier, un lien de connexion a été envoyé.'})}catch{return res.status(503).json({error:'Service momentanément indisponible'})}
 }
 const token=clean(req.method==='GET'?req.query.token:d.token,2000),parts=token.split('.');
 if(parts.length!==2||!secret()||!/^[a-f0-9]{64}$/.test(parts[1]))return res.status(401).json({error:'Lien de connexion requis'});
 const a=Buffer.from(parts[1],'hex'),b=Buffer.from(sign(parts[0]),'hex');if(a.length!==b.length||!timingSafeEqual(a,b))return res.status(401).json({error:'Lien invalide'});
 let claim;try{claim=JSON.parse(Buffer.from(parts[0],'base64url').toString())}catch{return res.status(401).json({error:'Lien invalide'})}
 if(claim.exp<Date.now())return res.status(401).json({error:'Lien expiré : demandez-en un nouveau'});
 try{
 const application=await read('applications/'+claim.ref+'.json');if(!application||application.email.toLowerCase()!==claim.email)return res.status(404).json({error:'Dossier introuvable'});
 const decision=await read('decisions/'+claim.ref+'.json'),profilePath='profiles/'+claim.ref+'.json';
 if(req.method==='POST'&&action==='save'){
 const profile={representative:clean(d.representative,150),experience:clean(d.experience,4000),background:clean(d.background,4000),objectives:clean(d.objectives,2500),website:clean(d.companyWebsite,250),country:clean(d.country,100),phone:clean(d.phone,60),updatedAt:new Date().toISOString()};
 await put(profilePath,JSON.stringify(profile),{access:'private',addRandomSuffix:false,allowOverwrite:true});
 return res.status(200).json({ok:true,profile});
 }
 if(req.method!=='GET')return res.status(405).json({error:'Méthode non autorisée'});
 const profile=await read(profilePath);
 return res.status(200).json({reference:claim.ref,business:application.business,category:application.category,activity:application.activity,createdAt:application.createdAt,status:decision?.status||'pending',ioe:decision?.ioe||null,approvedAt:decision?.approvedAt||null,profile:profile||{}});
 }catch{return res.status(503).json({error:'Dossier temporairement inaccessible'})}
}