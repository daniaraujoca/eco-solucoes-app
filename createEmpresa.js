// Caminho corrigido para a nova localização do ficheiro de configuração
import { db } from '../../firebase-admin-config';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido.' });
  }

  if (!db) {
    return res.status(500).json({ message: 'Erro interno: A conexão com o banco de dados falhou.' });
  }
  
  const { nome, cnpj, endereco, responsavelNome, responsavelTelefone, horarioFuncionamento, tipoEstabelecimento } = req.body;

  try {
    await db.collection('empresas').add({
      nome,
      cnpj,
      endereco,
      responsavelNome,
      responsavelTelefone,
      horarioFuncionamento,
      tipoEstabelecimento
    });
    res.status(200).json({ message: 'Empresa criada com sucesso!' });
  } catch (error) {
    console.error("Erro ao criar empresa no Firestore:", error);
    res.status(500).json({ message: 'Erro interno ao criar a empresa.' });
  }
}

