// /src/pages/api/updateEmpresa.js

// CORREÇÃO: O caminho da importação foi ajustado
import { db } from '../../firebase-admin-config';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método não permitido.' });
  }

  const { empresaId, updates } = req.body;

  if (!empresaId || !updates) {
    return res.status(400).json({ message: 'ID da empresa e dados de atualização são obrigatórios.' });
  }

  try {
    await db.collection('empresas').doc(empresaId).update(updates);
    res.status(200).json({ message: 'Empresa atualizada com sucesso!' });
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error);
    res.status(500).json({ message: 'Erro interno ao atualizar a empresa.' });
  }
}