// /src/firebase-admin-config.js

import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Garante que a inicialização ocorra apenas uma vez.
if (!admin.apps.length) {
  try {
    // Constrói o caminho absoluto para o serviceAccountKey.json na raiz do projeto.
    // process.cwd() retorna o diretório onde o comando 'npm run dev' foi executado.
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    
    // Lê o conteúdo do arquivo.
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK inicializado com sucesso a partir do arquivo JSON.");

  } catch (error) {
    console.error('Falha CRÍTICA na inicialização do Firebase Admin SDK:', error);
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth };