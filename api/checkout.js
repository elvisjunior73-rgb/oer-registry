import {put,list,get} from '@vercel/blob';
import {createHmac,timingSafeEqual,randomUUID} from 'node:crypto';
import {findProduct} from '../oerCatalog.js';
const read=async path=>{const r=await list({prefix:path,limit:1});const b=r.blobs.find(x=>x.pathname===path);if(!b)return null;const v=await get(b.url,{access:'private'});return v?new Response(v.stream).json():null};
const clean=(s,n=200)=>String(s??'').trim().slice(0,n);
export default async function handler(req,res){
res.setHeader('Cache-Control','no-store');if(req.method!=='POST')return res.status(405).json({error:'Méthode non autorisée'});
if(!(process.env.MOLLIE_API_KEY||process.env.MOLLIE)||!process.env.BLOB_READ_WRITE_TOKEN)return res.status(503).json({error:'Paiement Mollie indisponible : configuration marchande nécessaire'});
const p=findProduct(clean(req.body?.productId,60));if(!p)return res.status(400).json({error:'Produit inconnu'});
const email=clean(req.body?.email,254).toLowerCase(),name=clean(req.body?.name,150),reference=clean(req.body?.reference,60).toUpperCase();
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!name)return res.status(400).json({error:'Nom et e-mail requis'});
if(p.requiresApproval){
 const token=clean(req.body?.token,2500),parts=token.split('.'),secret=process.env.OER_ADMIN_TOKEN;
 if(!secret||parts.length!==2||!/^[a-f0-9]{64}$/.test(parts[1]))return res.status(403).json({error:'Connectez-vous à votre espace candidat pour activer votre dossier'});
 const mac=createHmac('sha256',secret).update(parts[0]).digest('hex');if(!timingSafeEqual(Buffer.from(mac),Buffer.from(parts[1])))return res.status(403).json({error:'Lien de connexion invalide'});
 let claim;try{claim=JSON.parse(Buffer.from(parts[0],'base64url').toString())}catch{return res.status(403).json({error:'Accès invalide'})}
 if(claim.exp<Date.now()||claim.ref!==reference||claim.email!==email)return res.status(403).json({error:'Session expirée ou dossier différent'});
 const application=await read('applications/'+reference+'.json'),decision=await read('decisions/'+reference+'.json');
 if(!application||!decision||decision.status!=='approved'||application.category!==(p.id==='activation-eoi'?'EOI':'EOS'))return res.status(403).json({error:'Activation disponible uniquement après validation du greffe'});
}
const orderId=randomUUID(),origin='https://www.oer-registry.online';
const order={id:orderId,productId:p.id,productName:p.name,amount:p.price,currency:'EUR',email,name,reference:p.requiresApproval?reference:null,status:'created',createdAt:new Date().toISOString()};
try{
 await put('orders/'+orderId+'.json',JSON.stringify(order),{access:'private',addRandomSuffix:false,contentType:'application/json'});
 const response=await fetch('https://api.mollie.com/v2/payments',{method:'POST',headers:{Authorization:'Bearer '+(process.env.MOLLIE_API_KEY||process.env.MOLLIE),'Content-Type':'application/json'},body:JSON.stringify({amount:{currency:'EUR',value:p.price.toFixed(2)},description:'OER — '+p.name,redirectUrl:origin+'/paiement.html?order='+encodeURIComponent(orderId),webhookUrl:origin+'/api/mollie-webhook',metadata:{orderId,productId:p.id}})});
 const payment=await response.json();if(!response.ok||!payment.id||!payment._links?.checkout?.href)return res.status(502).json({error:'Création du paiement indisponible'});
 order.paymentId=payment.id;order.status='open';await put('orders/'+orderId+'.json',JSON.stringify(order),{access:'private',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json'});
 return res.status(200).json({orderId,checkoutUrl:payment._links.checkout.href});
}catch{return res.status(503).json({error:'Impossible de démarrer le paiement. Veuillez réessayer.'})}
}
