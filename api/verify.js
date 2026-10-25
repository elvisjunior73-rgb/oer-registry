import {list,get} from '@vercel/blob';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Méthode non autorisée'});
 const ioe=String(req.query.ioe||'').trim().toUpperCase();
 if(!/^IOE-(EOI|EOS)-[A-F0-9]{12}$/.test(ioe))return res.status(400).json({error:'Format IOE invalide.'});
 try{
 const {blobs}=await list({prefix:'public/'+ioe+'.json',limit:1});
 if(!blobs.length||!blobs[0].pathname.endsWith(ioe+'.json'))return res.status(404).json({error:'Aucune inscription validée trouvée pour ce numéro.'});
 const result=await get(blobs[0].url,{access:'private'});
 if(!result)return res.status(404).json({error:'Identifiant introuvable'});
 const d=await new Response(result.stream).json();
 if(d.status!=='active')return res.status(404).json({error:'Inscription non active'});
 return res.status(200).json({ioe:d.ioe,business:d.business,category:d.category,activity:d.activity,status:'Actif',approvedAt:d.approvedAt});
 }catch{return res.status(503).json({error:'Le service de vérification est momentanément indisponible.'})}
}