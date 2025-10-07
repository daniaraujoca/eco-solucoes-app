// /src/pages/api/createLocal.js

import { db } from '../../firebase-admin-config';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido.' });
  }

  if (!db) {
    return res.status(500).json({ message: 'Erro interno: A conexão com o banco de dados falhou.' });
  }

  const { nome, endereco, cep, estado, responsavelLocal, telefoneLocal, empresaId } = req.body;

  if (!nome || !endereco || !empresaId) {
    return res.status(400).json({ message: 'Nome do local, endereço e empresa cliente são obrigatórios.' });
  }

  try {
    await db.collection('locais').add({
      nome,
      endereco,
      cep,
      estado,
      responsavelLocal,
      telefoneLocal,
      empresaId, // Armazena a referência à empresa-mãe
    });
    res.status(200).json({ message: 'Local de serviço cadastrado com sucesso!' });
  } catch (error) {
    console.error("Erro ao criar local no Firestore:", error);
    res.status(500).json({ message: 'Erro interno ao criar o local de serviço.' });
  }
}