// /src/pages/api/updateUser.js

// CORREÇÃO: O caminho da importação foi ajustado de ../../../ para ../../
import { auth, db } from '../../firebase-admin-config';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método não permitido.' });
  }

  // Captura todos os dados que podem ser atualizados
  const { userId, name, cpf, telefone, role, endereco, dataNascimento, rg } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'ID do usuário é obrigatório.' });
  }

  try {
    // Objeto com os dados a serem atualizados no Firestore
    const firestoreUpdateData = {};
    if (name !== undefined) firestoreUpdateData.name = name;
    if (cpf !== undefined) firestoreUpdateData.cpf = cpf;
    if (telefone !== undefined) firestoreUpdateData.telefone = telefone;
    if (role !== undefined) firestoreUpdateData.role = role;
    if (endereco !== undefined) firestoreUpdateData.endereco = endereco;
    if (dataNascimento !== undefined) firestoreUpdateData.dataNascimento = dataNascimento;
    if (rg !== undefined) firestoreUpdateData.rg = rg;

    // Atualiza o nome e telefone no Firebase Auth, se fornecidos
    const authUpdateData = {};
    if (name) authUpdateData.displayName = name;
    if (telefone) authUpdateData.phoneNumber = telefone;
    
    if (Object.keys(authUpdateData).length > 0) {
      await auth.updateUser(userId, authUpdateData);
    }

    // Atualiza os dados no Firestore se houver dados para atualizar
    if (Object.keys(firestoreUpdateData).length > 0) {
      await db.collection('users').doc(userId).update(firestoreUpdateData);
    }

    res.status(200).json({ message: 'Usuário atualizado com sucesso!' });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ message: 'Erro interno ao atualizar o usuário.' });
  }
}