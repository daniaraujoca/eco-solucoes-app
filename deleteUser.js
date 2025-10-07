// /src/pages/api/deleteUser.js

// CORREÇÃO: O caminho da importação foi ajustado
import { auth, db } from '../../firebase-admin-config';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Método não permitido.' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'ID do usuário é obrigatório.' });
  }

  try {
    // 1. Exclui o usuário do Firebase Authentication
    await auth.deleteUser(userId);

    // 2. Exclui o documento do Firestore
    await db.collection('users').doc(userId).delete();

    res.status(200).json({ message: 'Usuário excluído com sucesso!' });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    res.status(500).json({ message: 'Erro interno ao excluir o usuário.' });
  }
}