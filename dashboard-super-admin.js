import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase-config.js';
import Head from 'next/head';
import styles from '../styles/Dashboard.module.css';

// Componente de Seleção de Sistema (reutilizado)
import ChoicePanel from '../components/ChoicePanel';

// NOVAS IMPORTAÇÕES (CORREÇÃO)
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import RelatorioTemplate from '../components/RelatorioTemplate';


// --- CONSTANTES ---
const ITEMS_PER_PAGE = 10;
const estadosBrasileiros = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

// --- FORMULÁRIOS (GLP e GNV) ---

// Componente do formulário de usuário
const UserForm = ({ user, onSubmit, onCancel, isEditing }) => {
  const [formData, setFormData] = useState(
    user || { email: '', password: '', name: '', cpf: '', telefone: '', role: 'tecnico' }
  );
  useEffect(() => { setFormData(user || { email: '', password: '', name: '', cpf: '', telefone: '', role: 'tecnico' }); }, [user]);
  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };
  
  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      <input type="email" name="email" placeholder="Email do usuário" value={formData.email || ''} onChange={handleChange} required disabled={isEditing} />
      {!isEditing && ( <input type="password" name="password" placeholder="Senha (mín. 6 caracteres)" value={formData.password || ''} onChange={handleChange} required /> )}
      <input type="text" name="name" placeholder="Nome do usuário" value={formData.name || ''} onChange={handleChange} required />
      <input type="text" name="cpf" placeholder="CPF do usuário" value={formData.cpf || ''} onChange={handleChange} />
      <input type="text" name="telefone" placeholder="Telefone do usuário" value={formData.telefone || ''} onChange={handleChange} />
      <select name="role" value={formData.role} onChange={handleChange}>
        <option value="tecnico">Técnico (GLP)</option>
        <option value="mecanicoGNV">Mecânico (GNV)</option>
        <option value="admin">Admin</option>
        <option value="super-admin">Super Admin</option>
      </select>
      <div className={styles.modalActions}>
        <button type="submit" className={styles.primaryButton}>{isEditing ? 'Salvar Alterações' : 'Criar Usuário'}</button>
        <button type="button" onClick={onCancel} className={styles.secondaryButton}>Cancelar</button>
      </div>
    </form>
  );
};

const EmpresaForm = ({ empresa, onSubmit, onCancel, isEditing }) => {
    const [formData, setFormData] = useState(empresa || { nome: '', cnpj: '', estado: 'RJ', responsavelNome: '', responsavelTelefone: '' });
    useEffect(() => { setFormData(empresa || { nome: '', cnpj: '', estado: 'RJ', responsavelNome: '', responsavelTelefone: '' }); }, [empresa]);
    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };
  
    return (
      <form className={styles.formContainer} onSubmit={handleSubmit}>
        <input type="text" name="nome" placeholder="Nome Fantasia" value={formData.nome} onChange={handleChange} required />
        <input type="text" name="cnpj" placeholder="CNPJ" value={formData.cnpj} onChange={handleChange} />
        <select name="estado" value={formData.estado} onChange={handleChange}>{estadosBrasileiros.map(uf => <option key={uf} value={uf}>{uf}</option>)}</select>
        <input type="text" name="responsavelNome" placeholder="Nome do Responsável" value={formData.responsavelNome} onChange={handleChange} />
        <input type="tel" name="responsavelTelefone" placeholder="Telefone do Responsável" value={formData.responsavelTelefone} onChange={handleChange} />
        <div className={styles.modalActions}>
            <button type="submit" className={styles.primaryButton}>{isEditing ? 'Salvar Alterações' : 'Cadastrar Empresa'}</button>
            <button type="button" onClick={onCancel} className={styles.secondaryButton}>Cancelar</button>
        </div>
      </form>
    );
};

const LocalForm = ({ local, empresas, onSubmit, onCancel, isEditing }) => {
    const [formData, setFormData] = useState(local || { nome: '', endereco: '', cep: '', estado: 'RJ', responsavelLocal: '', telefoneLocal: '', empresaId: '' });
    useEffect(() => { setFormData(local || { nome: '', endereco: '', cep: '', estado: 'RJ', responsavelLocal: '', telefoneLocal: '', empresaId: '' }); }, [local]);
    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };

    return (
        <form className={styles.formContainer} onSubmit={handleSubmit}>
            <select name="empresaId" value={formData.empresaId} onChange={handleChange} required><option value="">-- Selecione a Empresa Cliente --</option>{empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}</select>
            <input type="text" name="nome" placeholder="Nome do Local (Ex: Matriz, Filial Centro)" value={formData.nome} onChange={handleChange} required />
            <input type="text" name="endereco" placeholder="Endereço Completo" value={formData.endereco} onChange={handleChange} />
            <input type="text" name="cep" placeholder="CEP" value={formData.cep} onChange={handleChange} />
            <select name="estado" value={formData.estado} onChange={handleChange}>{estadosBrasileiros.map(uf => <option key={uf} value={uf}>{uf}</option>)}</select>
            <input type="text" name="responsavelLocal" placeholder="Nome do Responsável no Local" value={formData.responsavelLocal} onChange={handleChange} />
            <input type="tel" name="telefoneLocal" placeholder="Telefone do Responsável no Local" value={formData.telefoneLocal} onChange={handleChange} />
            <div className={styles.modalActions}>
                <button type="submit" className={styles.primaryButton}>{isEditing ? 'Salvar Alterações' : 'Cadastrar Local'}</button>
                <button type="button" onClick={onCancel} className={styles.secondaryButton}>Cancelar</button>
            </div>
        </form>
    );
};

const OficinaForm = ({ oficina, onSubmit, onCancel, isEditing }) => {
    const [formData, setFormData] = useState(oficina || { nome: '', cnpj: '', endereco: '', responsavel: '', telefone: '', estado: 'RJ' });
    useEffect(() => { setFormData(oficina || { nome: '', cnpj: '', endereco: '', responsavel: '', telefone: '', estado: 'RJ' }); }, [oficina]);
    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };
  
    return (
      <form className={styles.formContainer} onSubmit={handleSubmit}>
        <input type="text" name="nome" placeholder="Nome da Oficina" value={formData.nome} onChange={handleChange} required />
        <input type="text" name="cnpj" placeholder="CNPJ" value={formData.cnpj} onChange={handleChange} />
        <input type="text" name="endereco" placeholder="Endereço Completo" value={formData.endereco} onChange={handleChange} />
        <select name="estado" value={formData.estado} onChange={handleChange}>{estadosBrasileiros.map(uf => <option key={uf} value={uf}>{uf}</option>)}</select>
        <input type="text" name="responsavel" placeholder="Nome do Responsável" value={formData.responsavel} onChange={handleChange} />
        <input type="tel" name="telefone" placeholder="Telefone de Contato" value={formData.telefone} onChange={handleChange} />
        <div className={styles.modalActions}>
            <button type="submit" className={styles.primaryButton}>{isEditing ? 'Salvar Alterações' : 'Cadastrar Oficina'}</button>
            <button type="button" onClick={onCancel} className={styles.secondaryButton}>Cancelar</button>
        </div>
      </form>
    );
};
export default function SuperAdminDashboard() {
  const router = useRouter();
  const { name } = router.query;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // --- ESTADO PRINCIPAL PARA CONTROLE DE SISTEMA ---
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [activeTab, setActiveTab] = useState('usuarios'); 

  // --- ESTADOS GLOBAIS ---
  const [users, setUsers] = useState([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  
  // --- ESTADOS DO SISTEMA GLP ---
  const [empresas, setEmpresas] = useState([]);
  const [isEmpresaModalOpen, setIsEmpresaModalOpen] = useState(false);
  const [currentEmpresa, setCurrentEmpresa] = useState(null);
  const [empresaSearchTerm, setEmpresaSearchTerm] = useState('');
  const [empresaCurrentPage, setEmpresaCurrentPage] = useState(1);
  
  const [locais, setLocais] = useState([]);
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);
  const [currentLocal, setCurrentLocal] = useState(null);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [localCurrentPage, setLocalCurrentPage] = useState(1);

  const [agendamentos, setAgendamentos] = useState([]);
  const [agendamentoForm, setAgendamentoForm] = useState({ empresaId: '', localId: '', tecnicoId: '', data: '', tipoServico: 'Visita Técnica', observacoes: '' });
  
  const [relatorios, setRelatorios] = useState([]);
  const [relatorioSearchTerm, setRelatorioSearchTerm] = useState('');
  const [relatorioCurrentPage, setRelatorioCurrentPage] = useState(1);
  const [relatorioParaPDF, setRelatorioParaPDF] = useState(null);
  const pdfTemplateRef = useRef(null);

  // --- ESTADOS DO SISTEMA GNV ---
  const [oficinas, setOficinas] = useState([]);
  const [isOficinaModalOpen, setIsOficinaModalOpen] = useState(false);
  const [currentOficina, setCurrentOficina] = useState(null);
  const [oficinaSearchTerm, setOficinaSearchTerm] = useState('');
  const [oficinaCurrentPage, setOficinaCurrentPage] = useState(1);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) { setUser(currentUser); } else { router.push('/'); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);
  
  const fetchAllData = useCallback(async () => {
    try {
        const [
            usersSnap, 
            empresasSnap, // GLP
            locaisSnap, // GLP
            agendamentosSnap, // GLP
            relatoriosSnap, // GLP
            oficinasSnap, // GNV
        ] = await Promise.all([ 
            getDocs(collection(db, 'users')), 
            getDocs(collection(db, 'empresas')),
            getDocs(collection(db, 'locais')),
            getDocs(collection(db, 'agendamentos')),
            getDocs(collection(db, 'relatorios')),
            getDocs(collection(db, 'oficinasGNV')),
        ]);
        setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setEmpresas(empresasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLocais(locaisSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setAgendamentos(agendamentosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setRelatorios(relatoriosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setOficinas(oficinasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { console.error("Erro ao buscar todos os dados:", error); }
  }, []);

  useEffect(() => { if (user) { fetchAllData(); } }, [user, fetchAllData]);

  // --- Lógicas de filtragem e paginação ---

  // Usuários (Compartilhado)
  const filteredUsers = useMemo(() => users.filter(u => u.name.toLowerCase().includes(userSearchTerm.toLowerCase())), [users, userSearchTerm]);
  const userTotalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const currentUsers = filteredUsers.slice((userCurrentPage - 1) * ITEMS_PER_PAGE, userCurrentPage * ITEMS_PER_PAGE);
  useEffect(() => { setUserCurrentPage(1); }, [userSearchTerm]);
  
  // Empresas (GLP)
  const filteredEmpresas = useMemo(() => empresas.filter(e => e.nome.toLowerCase().includes(empresaSearchTerm.toLowerCase())), [empresas, empresaSearchTerm]);
  const empresaTotalPages = Math.ceil(filteredEmpresas.length / ITEMS_PER_PAGE);
  const currentEmpresas = filteredEmpresas.slice((empresaCurrentPage - 1) * ITEMS_PER_PAGE, empresaCurrentPage * ITEMS_PER_PAGE);
  useEffect(() => { setEmpresaCurrentPage(1); }, [empresaSearchTerm]);
  
  // Locais (GLP)
  const filteredLocais = useMemo(() => locais.filter(l => l.nome.toLowerCase().includes(localSearchTerm.toLowerCase())), [locais, localSearchTerm]);
  const localTotalPages = Math.ceil(filteredLocais.length / ITEMS_PER_PAGE);
  const currentLocais = filteredLocais.slice((localCurrentPage - 1) * ITEMS_PER_PAGE, localCurrentPage * ITEMS_PER_PAGE);
  useEffect(() => { setLocalCurrentPage(1); }, [localSearchTerm]);

  // Relatórios (GLP)
  const filteredRelatorios = useMemo(() => 
    relatorios.filter(r => 
        (r.nomeLocal && r.nomeLocal.toLowerCase().includes(relatorioSearchTerm.toLowerCase())) ||
        (r.tecnicoNome && r.tecnicoNome.toLowerCase().includes(relatorioSearchTerm.toLowerCase()))
    ), [relatorios, relatorioSearchTerm]);
  const relatorioTotalPages = Math.ceil(filteredRelatorios.length / ITEMS_PER_PAGE);
  const currentRelatorios = filteredRelatorios.slice((relatorioCurrentPage - 1) * ITEMS_PER_PAGE, relatorioCurrentPage * ITEMS_PER_PAGE);
  useEffect(() => { setRelatorioCurrentPage(1); }, [relatorioSearchTerm]);
  
  // Oficinas (GNV)
  const filteredOficinas = useMemo(() => oficinas.filter(o => o.nome.toLowerCase().includes(oficinaSearchTerm.toLowerCase())), [oficinas, oficinaSearchTerm]);
  const oficinaTotalPages = Math.ceil(filteredOficinas.length / ITEMS_PER_PAGE);
  const currentOficinas = filteredOficinas.slice((oficinaCurrentPage - 1) * ITEMS_PER_PAGE, oficinaCurrentPage * ITEMS_PER_PAGE);
  useEffect(() => { setOficinaCurrentPage(1); }, [oficinaSearchTerm]);

  // Listas derivadas para dropdowns
  const tecnicosGLP = useMemo(() => users.filter(u => u.role === 'tecnico'), [users]);
  const locaisFiltradosPorEmpresa = useMemo(() => {
    if (!agendamentoForm.empresaId) return [];
    return locais.filter(l => l.empresaId === agendamentoForm.empresaId);
  }, [locais, agendamentoForm.empresaId]);
  // Funções de Modais
  const openUserCreateModal = () => { setCurrentUser(null); setIsUserModalOpen(true); };
  const openUserEditModal = (userToEdit) => { setCurrentUser(userToEdit); setIsUserModalOpen(true); };
  const closeUserModal = () => { setIsUserModalOpen(false); setCurrentUser(null); };
  
  const openEmpresaCreateModal = () => { setCurrentEmpresa(null); setIsEmpresaModalOpen(true); };
  const openEmpresaEditModal = (empresaToEdit) => { setCurrentEmpresa(empresaToEdit); setIsEmpresaModalOpen(true); };
  const closeEmpresaModal = () => { setIsEmpresaModalOpen(false); setCurrentEmpresa(null); };

  const openLocalCreateModal = () => { setCurrentLocal(null); setIsLocalModalOpen(true); };
  const openLocalEditModal = (localToEdit) => { setCurrentLocal(localToEdit); setIsLocalModalOpen(true); };
  const closeLocalModal = () => { setIsLocalModalOpen(false); setCurrentLocal(null); };

  const openOficinaCreateModal = () => { setCurrentOficina(null); setIsOficinaModalOpen(true); };
  const openOficinaEditModal = (oficina) => { setCurrentOficina(oficina); setIsOficinaModalOpen(true); };
  const closeOficinaModal = () => { setIsOficinaModalOpen(false); setCurrentOficina(null); };

  // Função para gerar PDF
  const gerarPDF = async (dadosDoRelatorio) => {
    setRelatorioParaPDF(dadosDoRelatorio);
    await new Promise(resolve => setTimeout(resolve, 500));
    const input = pdfTemplateRef.current;
    if (!input) { setRelatorioParaPDF(null); return; }

    const allImages = Array.from(input.getElementsByTagName('img'));
    const preloadImages = allImages.map(img => new Promise((resolve, reject) => {
        if (img.complete) return resolve();
        img.crossOrigin = 'anonymous';
        img.onload = resolve;
        img.onerror = reject;
    }));

    try {
        await Promise.all(preloadImages);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const canvas = await html2canvas(input, { scale: 2, useCORS: true, allowTaint: true });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = position - pageHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        pdf.save(`relatorio_${dadosDoRelatorio.nomeLocal.replace(/ /g, '_')}_${Date.now()}.pdf`);
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Não foi possível gerar o PDF. Uma ou mais imagens não puderam ser carregadas.");
    } finally {
        setRelatorioParaPDF(null);
    }
  };

  // Funções CRUD de Usuário
  const handleCreateUser = async (formData) => {
    try {
      const response = await fetch('/api/createUser', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (response.ok) { alert('Usuário criado com sucesso!'); closeUserModal(); fetchAllData(); } 
      else { const errorData = await response.json(); alert(`Erro: ${errorData.message}`); }
    } catch (error) { alert('Ocorreu um erro de comunicação ao criar o usuário.'); }
  };

  const handleUpdateUser = async (formData) => {
    try {
      const response = await fetch('/api/updateUser', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.id, ...formData }) });
      if (response.ok) { alert('Usuário atualizado com sucesso!'); closeUserModal(); fetchAllData(); } 
      else { const errorData = await response.json(); alert(`Erro: ${errorData.message}`); }
    } catch (error) { alert('Ocorreu um erro de comunicação ao atualizar o usuário.'); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Tem certeza que deseja excluir este usuário?")) return;
    try {
      const response = await fetch('/api/deleteUser', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
      if (response.ok) { alert('Usuário excluído com sucesso!'); fetchAllData(); } 
      else { const errorData = await response.json(); alert(`Erro: ${errorData.message}`); }
    } catch (error) { alert('Ocorreu um erro de comunicação ao excluir o usuário.'); }
  };

  // Funções CRUD de Empresa (GLP)
  const handleCreateEmpresa = async (formData) => {
    try {
      await addDoc(collection(db, "empresas"), formData);
      alert('Empresa criada com sucesso!'); closeEmpresaModal(); fetchAllData();
    } catch (error) { alert('Ocorreu um erro ao criar a empresa.'); }
  };

  const handleUpdateEmpresa = async (formData) => {
    try {
      const empresaRef = doc(db, 'empresas', currentEmpresa.id);
      await updateDoc(empresaRef, formData);
      alert('Empresa atualizada com sucesso!'); closeEmpresaModal(); fetchAllData();
    } catch (error) { alert('Ocorreu um erro ao atualizar a empresa.'); }
  };

  const handleDeleteEmpresa = async (empresaId) => {
    if (!window.confirm("Tem certeza que deseja excluir esta empresa?")) return;
    try {
      await deleteDoc(doc(db, 'empresas', empresaId));
      alert('Empresa excluída com sucesso!'); fetchAllData();
    } catch (error) { alert('Ocorreu um erro ao excluir a empresa.'); }
  };
  
  // Funções CRUD de Local (GLP)
  const handleCreateLocal = async (formData) => {
    try {
      await addDoc(collection(db, "locais"), formData);
      alert('Local criado com sucesso!'); closeLocalModal(); fetchAllData();
    } catch (error) { alert('Ocorreu um erro ao criar o local.'); }
  };

  const handleUpdateLocal = async (formData) => {
    try {
      const localRef = doc(db, 'locais', currentLocal.id);
      await updateDoc(localRef, formData);
      alert('Local atualizado com sucesso!'); closeLocalModal(); fetchAllData();
    } catch (error) { alert('Ocorreu um erro ao atualizar o local.'); }
  };

  const handleDeleteLocal = async (localId) => {
    if (!window.confirm("Tem certeza que deseja excluir este local?")) return;
    try {
      await deleteDoc(doc(db, 'locais', localId));
      alert('Local excluído com sucesso!'); fetchAllData();
    } catch (error) { alert('Ocorreu um erro ao excluir o local.'); }
  };
  
  // Funções do Formulário de Agendamento (GLP)
  const handleAgendamentoFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'empresaId') { setAgendamentoForm(prev => ({ ...prev, empresaId: value, localId: '' })); } 
    else { setAgendamentoForm(prev => ({ ...prev, [name]: value })); }
  };

  const handleCreateAgendamento = async (e) => {
    e.preventDefault();
    if (!agendamentoForm.localId || !agendamentoForm.tecnicoId || !agendamentoForm.data) { alert("Preencha local, técnico e data."); return; }
    try {
      await addDoc(collection(db, "agendamentos"), { ...agendamentoForm, data: new Date(agendamentoForm.data) });
      alert('Agendamento criado com sucesso!');
      setAgendamentoForm({ empresaId: '', localId: '', tecnicoId: '', data: '', tipoServico: 'Visita Técnica', observacoes: '' });
      fetchAllData();
    } catch (error) { console.error(error); alert("Erro ao criar agendamento."); }
  };

  // Funções CRUD de Oficina (GNV)
  const handleCreateOficina = async (formData) => {
    try {
        await addDoc(collection(db, "oficinasGNV"), formData);
        alert('Oficina cadastrada com sucesso!');
        closeOficinaModal();
        fetchAllData();
    } catch (error) { alert('Erro ao cadastrar oficina.'); console.error(error); }
  };

  const handleUpdateOficina = async (formData) => {
      try {
          const oficinaRef = doc(db, 'oficinasGNV', currentOficina.id);
          await updateDoc(oficinaRef, formData);
          alert('Oficina atualizada com sucesso!');
          closeOficinaModal();
          fetchAllData();
      } catch (error) { alert('Erro ao atualizar oficina.'); console.error(error); }
  };

  const handleDeleteOficina = async (id) => {
      if (!window.confirm("Tem certeza que deseja excluir esta oficina?")) return;
      try {
          await deleteDoc(doc(db, 'oficinasGNV', id));
          alert('Oficina excluída com sucesso!');
          fetchAllData();
      } catch (error) { alert('Erro ao excluir oficina.'); console.error(error); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };
  if (loading || !user) {
    return <div>Carregando...</div>;
  }

  // Se nenhum sistema foi selecionado, mostra o painel de escolha.
  if (!selectedSystem) {
    return <ChoicePanel onSelect={(system) => setSelectedSystem(system)} />;
  }

  const renderTabContent = () => {
    // --- RENDERIZAÇÃO CONDICIONAL BASEADA NO SISTEMA ESCOLHIDO ---

    const sharedUserTab = (
      <div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}><h2>Gerenciar Usuários</h2><button onClick={openUserCreateModal} className={styles.primaryButton}>+ Novo Usuário</button></div>
        <div className={styles.filterContainer}><input type="text" placeholder="Buscar por nome..." value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} /></div>
        <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
                <thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Ações</th></tr></thead>
                <tbody>{currentUsers.length > 0 ? currentUsers.map(u => (<tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td className={styles.actionsCell}><button onClick={() => openUserEditModal(u)} className={styles.editButton}>Editar</button><button onClick={() => handleDeleteUser(u.id)} className={styles.deleteButton}>Excluir</button></td></tr>)) : (<tr><td colSpan="4">Nenhum usuário encontrado.</td></tr>)}</tbody>
            </table>
        </div>
        <div className={styles.paginationContainer}><span>Página {userCurrentPage} de {userTotalPages || 1}</span><div><button onClick={() => setUserCurrentPage(p => p - 1)} disabled={userCurrentPage === 1} className={styles.paginationButton}>Anterior</button><button onClick={() => setUserCurrentPage(p => p + 1)} disabled={userCurrentPage >= userTotalPages} className={styles.paginationButton} style={{marginLeft: '10px'}}>Próxima</button></div></div>
      </div>
    );

    if (selectedSystem === 'ECO GLP') {
        switch (activeTab) {
            case 'usuarios': return sharedUserTab;
            case 'empresas': return (
                <div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}><h2>Gerenciar Empresas</h2><button onClick={openEmpresaCreateModal} className={styles.primaryButton}>+ Nova Empresa</button></div>
                  <div className={styles.filterContainer}><input type="text" placeholder="Buscar por nome..." value={empresaSearchTerm} onChange={(e) => setEmpresaSearchTerm(e.target.value)} /></div>
                  <div className={styles.tableContainer}>
                      <table className={styles.dataTable}>
                          <thead><tr><th>Nome Fantasia</th><th>CNPJ</th><th>Responsável</th><th>Ações</th></tr></thead>
                          <tbody>{currentEmpresas.length > 0 ? currentEmpresas.map(e => (<tr key={e.id}><td>{e.nome}</td><td>{e.cnpj}</td><td>{e.responsavelNome}</td><td className={styles.actionsCell}><button onClick={() => openEmpresaEditModal(e)} className={styles.editButton}>Editar</button><button onClick={() => handleDeleteEmpresa(e.id)} className={styles.deleteButton}>Excluir</button></td></tr>)) : (<tr><td colSpan="4">Nenhuma empresa encontrada.</td></tr>)}</tbody>
                      </table>
                  </div>
                  <div className={styles.paginationContainer}><span>Página {empresaCurrentPage} de {empresaTotalPages || 1}</span><div><button onClick={() => setEmpresaCurrentPage(p => p - 1)} disabled={empresaCurrentPage === 1} className={styles.paginationButton}>Anterior</button><button onClick={() => setEmpresaCurrentPage(p => p + 1)} disabled={empresaCurrentPage >= empresaTotalPages} className={styles.paginationButton} style={{marginLeft: '10px'}}>Próxima</button></div></div>
                </div>
              );
            case 'locais': return (
                <div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}><h2>Gerenciar Locais de Serviço</h2><button onClick={openLocalCreateModal} className={styles.primaryButton}>+ Novo Local</button></div>
                  <div className={styles.filterContainer}><input type="text" placeholder="Buscar por nome do local..." value={localSearchTerm} onChange={(e) => setLocalSearchTerm(e.target.value)} /></div>
                  <div className={styles.tableContainer}>
                      <table className={styles.dataTable}>
                          <thead><tr><th>Nome do Local</th><th>Empresa Cliente</th><th>Endereço</th><th>Ações</th></tr></thead>
                          <tbody>{currentLocais.length > 0 ? currentLocais.map(l => (<tr key={l.id}><td>{l.nome}</td><td>{empresas.find(e => e.id === l.empresaId)?.nome || 'N/A'}</td><td>{l.endereco}</td><td className={styles.actionsCell}><button onClick={() => openLocalEditModal(l)} className={styles.editButton}>Editar</button><button onClick={() => handleDeleteLocal(l.id)} className={styles.deleteButton}>Excluir</button></td></tr>)) : (<tr><td colSpan="4">Nenhum local encontrado.</td></tr>)}</tbody>
                      </table>
                  </div>
                  <div className={styles.paginationContainer}><span>Página {localCurrentPage} de {localTotalPages || 1}</span><div><button onClick={() => setLocalCurrentPage(p => p - 1)} disabled={localCurrentPage === 1} className={styles.paginationButton}>Anterior</button><button onClick={() => setLocalCurrentPage(p => p + 1)} disabled={localCurrentPage >= localTotalPages} className={styles.paginationButton} style={{marginLeft: '10px'}}>Próxima</button></div></div>
                </div>
            );
            case 'agendamento': return (
                <div>
                  <h2>Agendar Nova Visita (GLP)</h2>
                  <form className={styles.formContainer} onSubmit={handleCreateAgendamento}><label>Selecione a Empresa Cliente</label><select name="empresaId" value={agendamentoForm.empresaId} onChange={handleAgendamentoFormChange} required><option value="">-- Selecione uma Empresa --</option>{empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}</select><label>Selecione o Local de Serviço</label><select name="localId" value={agendamentoForm.localId} onChange={handleAgendamentoFormChange} required disabled={!agendamentoForm.empresaId}><option value="">-- Selecione um Local --</option>{locaisFiltradosPorEmpresa.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}</select><label>Atribuir ao Técnico</label><select name="tecnicoId" value={agendamentoForm.tecnicoId} onChange={handleAgendamentoFormChange} required><option value="">-- Selecione um Técnico --</option>{tecnicosGLP.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><label>Data e Hora da Visita</label><input type="datetime-local" name="data" value={agendamentoForm.data} onChange={handleAgendamentoFormChange} required /><label>Tipo de Serviço</label><select name="tipoServico" value={agendamentoForm.tipoServico} onChange={handleAgendamentoFormChange} required><option>Visita Técnica</option><option>Instalação</option><option>Manutenção</option></select><label>Observações</label><textarea name="observacoes" placeholder="Detalhes adicionais..." value={agendamentoForm.observacoes} onChange={handleAgendamentoFormChange} rows="4"></textarea><button type="submit" className={styles.primaryButton}>Agendar Visita</button></form>
                </div>
            );
            case 'atendimentos': return (
                <div>
                  <h2>Relatórios Finalizados (GLP)</h2>
                  <div className={styles.filterContainer}><input type="text" placeholder="Buscar por local ou técnico..." value={relatorioSearchTerm} onChange={(e) => setRelatorioSearchTerm(e.target.value)} /></div>
                  <div className={styles.tableContainer}>
                      <table className={styles.dataTable}>
                          <thead><tr><th>Data</th><th>Local</th><th>Técnico</th><th>Ações</th></tr></thead>
                          <tbody>{currentRelatorios.length > 0 ? currentRelatorios.map(r => (<tr key={r.id}><td>{r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('pt-BR') : 'N/A'}</td><td>{r.nomeLocal}</td><td>{r.tecnicoNome}</td><td className={styles.actionsCell}><button onClick={() => gerarPDF(r)} className={styles.editButton}>Visualizar PDF</button></td></tr>)) : (<tr><td colSpan="4">Nenhum relatório encontrado.</td></tr>)}</tbody>
                      </table>
                  </div>
                  <div className={styles.paginationContainer}><span>Página {relatorioCurrentPage} de {relatorioTotalPages || 1}</span><div><button onClick={() => setRelatorioCurrentPage(p => p - 1)} disabled={relatorioCurrentPage === 1} className={styles.paginationButton}>Anterior</button><button onClick={() => setRelatorioCurrentPage(p => p + 1)} disabled={relatorioCurrentPage >= relatorioTotalPages} className={styles.paginationButton} style={{marginLeft: '10px'}}>Próxima</button></div></div>
                </div>
            );
            default: return null;
        }
    }

    if (selectedSystem === 'ECO GNV') {
        switch (activeTab) {
            case 'usuarios': return sharedUserTab; // Reutilizando a aba de usuários
            case 'oficinas':
                return (
                    <div>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}><h2>Gerenciar Oficinas</h2><button onClick={openOficinaCreateModal} className={styles.primaryButton}>+ Nova Oficina</button></div>
                        <div className={styles.filterContainer}><input type="text" placeholder="Buscar por nome da oficina..." value={oficinaSearchTerm} onChange={(e) => setOficinaSearchTerm(e.target.value)} /></div>
                        <div className={styles.tableContainer}>
                            <table className={styles.dataTable}>
                                <thead><tr><th>Nome</th><th>Endereço</th><th>Responsável</th><th>Ações</th></tr></thead>
                                <tbody>{currentOficinas.length > 0 ? currentOficinas.map(o => (<tr key={o.id}><td>{o.nome}</td><td>{o.endereco}</td><td>{o.responsavel}</td><td className={styles.actionsCell}><button onClick={() => openOficinaEditModal(o)} className={styles.editButton}>Editar</button><button onClick={() => handleDeleteOficina(o.id)} className={styles.deleteButton}>Excluir</button></td></tr>)) : (<tr><td colSpan="4">Nenhuma oficina encontrada.</td></tr>)}</tbody>
                            </table>
                        </div>
                        <div className={styles.paginationContainer}><span>Página {oficinaCurrentPage} de {oficinaTotalPages || 1}</span><div><button onClick={() => setOficinaCurrentPage(p => p - 1)} disabled={oficinaCurrentPage === 1} className={styles.paginationButton}>Anterior</button><button onClick={() => setOficinaCurrentPage(p => p + 1)} disabled={oficinaCurrentPage >= oficinaTotalPages} className={styles.paginationButton} style={{marginLeft: '10px'}}>Próxima</button></div></div>
                    </div>
                );
            default: return (<div><h2>Funcionalidade a ser implementada.</h2></div>);
        }
    }
  };

  return (
    <>
      <Head><title>Painel Super Admin</title></Head>

      {isUserModalOpen && ( <div className={styles.modalBackdrop}><div className={styles.modalContent}><h2>{currentUser ? 'Editar Usuário' : 'Criar Novo Usuário'}</h2><UserForm key={currentUser ? currentUser.id : 'new'} user={currentUser} onSubmit={currentUser ? handleUpdateUser : handleCreateUser} onCancel={closeUserModal} isEditing={!!currentUser} /></div></div> )}
      {isEmpresaModalOpen && ( <div className={styles.modalBackdrop}><div className={styles.modalContent}><h2>{currentEmpresa ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}</h2><EmpresaForm key={currentEmpresa ? currentEmpresa.id : 'new'} empresa={currentEmpresa} onSubmit={currentEmpresa ? handleUpdateEmpresa : handleCreateEmpresa} onCancel={closeEmpresaModal} isEditing={!!currentEmpresa} /></div></div> )}
      {isLocalModalOpen && ( <div className={styles.modalBackdrop}><div className={styles.modalContent}><h2>{currentLocal ? 'Editar Local' : 'Cadastrar Novo Local'}</h2><LocalForm key={currentLocal ? currentLocal.id : 'new'} local={currentLocal} empresas={empresas} onSubmit={currentLocal ? handleUpdateLocal : handleCreateLocal} onCancel={closeLocalModal} isEditing={!!currentLocal} /></div></div> )}
      {isOficinaModalOpen && ( <div className={styles.modalBackdrop}><div className={styles.modalContent}><h2>{currentOficina ? 'Editar Oficina' : 'Cadastrar Nova Oficina'}</h2><OficinaForm key={currentOficina ? currentOficina.id : 'new'} oficina={currentOficina} onSubmit={currentOficina ? handleUpdateOficina : handleCreateOficina} onCancel={closeOficinaModal} isEditing={!!currentOficina} /></div></div> )}

      <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -1 }}>
        <RelatorioTemplate ref={pdfTemplateRef} relatorio={relatorioParaPDF} />
      </div>

      <div className={styles.dashboardContainer}>
        <header className={styles.header}>
            <div>
                <h1>Bem-vindo, {name}! (Super Admin)</h1>
                <h2 style={{color: '#3498db', fontSize: '1.2rem', margin: 0}}>{selectedSystem}</h2>
            </div>
            <div>
                <button onClick={() => {setSelectedSystem(null); setActiveTab('usuarios');}} className={styles.secondaryButton} style={{marginRight: '10px'}}>Trocar Sistema</button>
                <button onClick={handleLogout} className={styles.logoutButton}>Sair</button>
            </div>
        </header>
        <div className={styles.content}>
          <nav className={styles.tabMenu}>
            {selectedSystem === 'ECO GLP' && (
                <>
                    <button className={`${styles.tabButton} ${activeTab === 'usuarios' ? styles.active : ''}`} onClick={() => setActiveTab('usuarios')}>Gerenciar Usuários</button>
                    <button className={`${styles.tabButton} ${activeTab === 'empresas' ? styles.active : ''}`} onClick={() => setActiveTab('empresas')}>Gerenciar Empresas</button>
                    <button className={`${styles.tabButton} ${activeTab === 'locais' ? styles.active : ''}`} onClick={() => setActiveTab('locais')}>Gerenciar Locais</button>
                    <button className={`${styles.tabButton} ${activeTab === 'agendamento' ? styles.active : ''}`} onClick={() => setActiveTab('agendamento')}>Agendar Visita</button>
                    <button className={`${styles.tabButton} ${activeTab === 'atendimentos' ? styles.active : ''}`} onClick={() => setActiveTab('atendimentos')}>Listar Atendimentos</button>
                </>
            )}
            {selectedSystem === 'ECO GNV' && (
                <>
                    <button className={`${styles.tabButton} ${activeTab === 'usuarios' ? styles.active : ''}`} onClick={() => setActiveTab('usuarios')}>Gerenciar Usuários</button>
                    <button className={`${styles.tabButton} ${activeTab === 'oficinas' ? styles.active : ''}`} onClick={() => setActiveTab('oficinas')}>Gerenciar Oficinas</button>
                    <button className={`${styles.tabButton} ${activeTab === 'mecanicos' ? styles.active : ''}`} onClick={() => setActiveTab('mecanicos')}>Gerenciar Mecânicos</button>
                    <button className={`${styles.tabButton} ${activeTab === 'instalacoes' ? styles.active : ''}`} onClick={() => setActiveTab('instalacoes')}>Listar Instalações</button>
                </>
            )}
          </nav>
          <main className={styles.tabContent}>
            {renderTabContent()}
          </main>
        </div>
      </div>
    </>
  );
}