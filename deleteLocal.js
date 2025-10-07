// /src/pages/api/deleteLocal.js

import { db } from '../../firebase-admin-config';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Método não permitido.' });
  }

  if (!db) {
    return res.status(500).json({ message: 'Erro interno: A conexão com o banco de dados falhou.' });
  }

  const { localId } = req.body;

  if (!localId) {
    return res.status(400).json({ message: 'ID do local é obrigatório.' });
  }

  try {
    await db.collection('locais').doc(localId).delete();
    res.status(200).json({ message: 'Local excluído com sucesso!' });
  } catch (error) {
    console.error("Erro ao excluir local:", error);
    res.status(500).json({ message: 'Erro interno ao excluir o local.' });
  }
}