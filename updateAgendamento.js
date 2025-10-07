// /src/pages/api/updateAgendamento.js

import { db } from '../../firebase-admin-config';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método não permitido.' });
  }

  if (!db) {
    return res.status(500).json({ message: 'Erro interno: A conexão com o banco de dados falhou.' });
  }

  const { agendamentoId, updates } = req.body;

  if (!agendamentoId || !updates) {
    return res.status(400).json({ message: 'ID do agendamento e dados de atualização são obrigatórios.' });
  }

  try {
    // Se a data for enviada como string (do formulário HTML), converte para um objeto Date
    // O Firebase Admin SDK irá lidar com a conversão para Timestamp
    if (updates.data && typeof updates.data === 'string') {
        updates.data = new Date(updates.data);
    }
    
    await db.collection('agendamentos').doc(agendamentoId).update(updates);
    res.status(200).json({ message: 'Agendamento atualizado com sucesso!' });
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error);
    res.status(500).json({ message: 'Erro interno ao atualizar o agendamento.' });
  }
}