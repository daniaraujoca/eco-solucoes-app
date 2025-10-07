// /src/pages/api/deleteAgendamento.js

import { db } from '../../firebase-admin-config';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Método não permitido.' });
  }

  if (!db) {
    return res.status(500).json({ message: 'Erro interno: A conexão com o banco de dados falhou.' });
  }

  const { agendamentoId } = req.body;

  if (!agendamentoId) {
    return res.status(400).json({ message: 'ID do agendamento é obrigatório.' });
  }

  try {
    await db.collection('agendamentos').doc(agendamentoId).delete();
    res.status(200).json({ message: 'Agendamento excluído com sucesso!' });
  } catch (error) {
    console.error("Erro ao excluir agendamento:", error);
    res.status(500).json({ message: 'Erro interno ao excluir o agendamento.' });
  }
}