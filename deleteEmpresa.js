// /src/pages/api/deleteEmpresa.js

// CORREÇÃO: O caminho da importação foi ajustado
import { db } from '../../firebase-admin-config';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Método não permitido.' });
  }

  const { empresaId } = req.body;

  if (!empresaId) {
    return res.status(400).json({ message: 'ID da empresa é obrigatório.' });
  }

  try {
    await db.collection('empresas').doc(empresaId).delete();
    res.status(200).json({ message: 'Empresa excluída com sucesso!' });
  } catch (error) {
    console.error("Erro ao excluir empresa:", error);
    res.status(500).json({ message: 'Erro interno ao excluir a empresa.' });
  }
}