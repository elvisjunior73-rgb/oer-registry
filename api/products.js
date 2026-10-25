import {catalog} from '../oerCatalog.js';
export default function handler(req,res){res.setHeader('Cache-Control','public, max-age=300');if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});return res.status(200).json({currency:'EUR',products:catalog,checkoutEnabled:!!process.env.MOLLIE_API_KEY})}
