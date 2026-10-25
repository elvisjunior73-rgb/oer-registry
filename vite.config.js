import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({build:{rollupOptions:{input:{main:resolve(process.cwd(),'index.html'),admin:resolve(process.cwd(),'admin.html'),candidate:resolve(process.cwd(),'candidat.html'),services:resolve(process.cwd(),'services.html'),payment:resolve(process.cwd(),'paiement.html')}}}});
