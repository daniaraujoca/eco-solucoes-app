// Caminho corrigido
import { db, auth } from '../../firebase-admin-config';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido.' });
  }

  if (!auth || !db) {
    return res.status(500).json({ message: 'Erro interno: A conexão com os serviços do Firebase falhou.' });
  }

  const { email, password, name, cpf, dataNascimento, rg, endereco, telefone, role } = req.body;

  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      phoneNumber: telefone,
    });

    await db.collection('users').doc(userRecord.uid).set({
      name, email, cpf, dataNascimento, rg, endereco, telefone,
      role: role || 'tecnico', // Garante um perfil padrão se não for fornecido
    });

    res.status(200).json({ uid: userRecord.uid, message: 'Usuário criado com sucesso!' });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ message: 'Este e-mail já está em uso.' });
    }
    res.status(500).json({ message: 'Erro interno ao criar o usuário.' });
  }
}

