// /src/pages/api/updateLocal.js

import { db } from '../../firebase-admin-config';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método não permitido.' });
  }

  if (!db) {
    return res.status(500).json({ message: 'Erro interno: A conexão com o banco de dados falhou.' });
  }

  const { localId, updates } = req.body;

  if (!localId || !updates) {
    return res.status(400).json({ message: 'ID do local e dados de atualização são obrigatórios.' });
  }

  try {
    await db.collection('locais').doc(localId).update(updates);
    res.status(200).json({ message: 'Local atualizado com sucesso!' });
  } catch (error) {
    console.error("Erro ao atualizar local:", error);
    res.status(500).json({ message: 'Erro interno ao atualizar o local.' });
  }
}