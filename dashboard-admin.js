import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase-config';
import Head from 'next/head';
import styles from '../styles/Dashboard.module.css';
import ChoicePanel from '../components/ChoicePanel';

const estadosBrasileiros = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
const ITEMS_PER_PAGE = 10;

const DetailsModal = ({ item, type, onClose, onSave, onDelete, extraData }) => {
  if (!item) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const initialFormData = { ...item };
    if (type === 'empresa' && item.horarioFuncionamento) {
      initialFormData.horarioAbertura = item.horarioFuncionamento.abre || '';
      initialFormData.horarioFechamento = item.horarioFuncionamento.fecha || '';
    }
    if (type === 'agendamento' && item.data) {
        const date = item.data.toDate ? item.data.toDate() : new Date(item.data);
        initialFormData.data = date.toISOString().slice(0, 16);
    }
    setFormData(initialFormData);
    setIsEditing(false);
  }, [item, type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSave(type, item.id, formData);
  };

  const handleDelete = () => {
    if (window.confirm(`Tem a certeza que deseja excluir este ${type}?`)) {
      onDelete(type, item.id);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    const initialFormData = { ...item };
     if (type === 'empresa' && item.horarioFuncionamento) {
      initialFormData.horarioAbertura = item.horarioFuncionamento.abre;
      initialFormData.horarioFechamento = item.horarioFuncionamento.fecha;
    }
     if (type === 'agendamento' && item.data) {
        const date = item.data.toDate ? item.data.toDate() : new Date(item.data);
        initialFormData.data = date.toISOString().slice(0, 16);
    }
    setFormData(initialFormData);
  };

  const renderFields = () => {
    if (type === 'empresa') {
      return (
        <>
          <label>Nome Fantasia</label><input type="text" name="nome" value={formData.nome || ''} onChange={handleChange} disabled={!isEditing} />
          <label>CNPJ</label><input type="text" name="cnpj" value={formData.cnpj || ''} onChange={handleChange} disabled={!isEditing} />
          <label>Estado Sede</label><select name="estado" value={formData.estado || 'RJ'} onChange={handleChange} disabled={!isEditing}>{estadosBrasileiros.map(uf => <option key={uf} value={uf}>{uf}</option>)}</select>
          <label>Nome do Responsável Geral</label><input type="text" name="responsavelNome" value={formData.responsavelNome || ''} onChange={handleChange} disabled={!isEditing} />
          <label>Telefone do Responsável Geral</label><input type="tel" name="responsavelTelefone" value={formData.responsavelTelefone || ''} onChange={handleChange} disabled={!isEditing} />
        </>
      );
    }
    if (type === 'local') {
      return (
         <>
          <label>Empresa Cliente</label>
          <select name="empresaId" value={formData.empresaId} onChange={handleChange} disabled={!isEditing} required>
            <option value="">Selecione</option>{extraData.empresas.map(emp => (<option key={emp.id} value={emp.id}>{emp.nome}</option>))}
          </select>
          <label>Nome do Local</label><input type="text" name="nome" value={formData.nome || ''} onChange={handleChange} disabled={!isEditing} />
          <label>Endereço</label><input type="text" name="endereco" value={formData.endereco || ''} onChange={handleChange} disabled={!isEditing} />
          <label>CEP</label><input type="text" name="cep" value={formData.cep || ''} onChange={handleChange} disabled={!isEditing} />
          <label>Estado</label><select name="estado" value={formData.estado || 'RJ'} onChange={handleChange} disabled={!isEditing}>{estadosBrasileiros.map(uf => <option key={uf} value={uf}>{uf}</option>)}</select>
          <label>Nome do Responsável Local</label><input type="text" name="responsavelLocal" value={formData.responsavelLocal || ''} onChange={handleChange} disabled={!isEditing} />
          <label>Telefone do Responsável Local</label><input type="tel" name="telefoneLocal" value={formData.telefoneLocal || ''} onChange={handleChange} disabled={!isEditing} />
        </>
      )
    }
    if (type === 'tecnico') {
       return (
        <>
          <label>Nome Completo</label><input type="text" name="name" value={formData.name || ''} onChange={handleChange} disabled={!isEditing} />
          <label>Email (não pode ser alterado)</label><input type="email" name="email" value={formData.email || ''} readOnly disabled />
          <label>CPF</label><input type="text" name="cpf" value={formData.cpf || ''} onChange={handleChange} disabled={!isEditing} />
          <label>Data de Nascimento</label><input type="date" name="dataNascimento" value={formData.dataNascimento || ''} onChange={handleChange} disabled={!isEditing} />
          <label>RG</label><input type="text" name="rg" value={formData.rg || ''} onChange={handleChange} disabled={!isEditing} />
          <label>Endereço</label><input type="text" name="endereco" value={formData.endereco || ''} onChange={handleChange} disabled={!isEditing} />
          <label>Telefone</label><input type="tel" name="telefone" value={formData.telefone || ''} onChange={handleChange} disabled={!isEditing} />
        </>
      );
    }
    if (type === 'agendamento') {
       return (
        <>
          <label>Local de Serviço</label>
          <select name="localId" value={formData.localId} onChange={handleChange} disabled={!isEditing} required>
            <option value="">Selecione</option>{extraData.locais.map(loc => (<option key={loc.id} value={loc.id}>{loc.nome}</option>))}
          </select>
          <label>Técnico</label>
          <select name="tecnicoId" value={formData.tecnicoId} onChange={handleChange} disabled={!isEditing} required>
            <option value="">Selecione</option>{extraData.tecnicos.map(tec => (<option key={tec.id} value={tec.id}>{tec.name}</option>))}
          </select>
          <label>Data e Hora</label><input type="datetime-local" name="data" value={formData.data} onChange={handleChange} disabled={!isEditing} required />
          <label>Tipo de Serviço</label>
          <select name="tipoServico" value={formData.tipoServico} onChange={handleChange} disabled={!isEditing} required>
            <option>Visita Técnica</option><option>Instalação</option><option>Manutenção</option>
          </select>
          <label>Observações</label><textarea name="observacoes" value={formData.observacoes || ''} onChange={handleChange} disabled={!isEditing} rows="3"></textarea>
        </>
      );
    }
    return null;
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h2>Detalhes d{type === 'empresa' ? 'a Empresa' : type === 'tecnico' ? 'o Técnico' : type === 'agendamento' ? 'o Agendamento' : 'o Local'}</h2>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className={`${styles.formContainer} ${styles.modalFields}`}>{renderFields()}</div>
          <div className={styles.modalActions}>
            {isEditing ? (<><button type="submit" className={styles.primaryButton}>Salvar</button><button type="button" onClick={handleCancel} className={styles.secondaryButton}>Cancelar</button></>) : (<button type="button" onClick={() => setIsEditing(true)} className={styles.editButton}>Editar</button>)}
            <button type="button" onClick={handleDelete} className={styles.deleteButton}>Excluir</button>
            <button type="button" onClick={onClose} className={styles.secondaryButton}>Fechar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const router = useRouter();
  const { name } = router.query;
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [activeTab, setActiveTab] = useState('listarDados');

  const [empresaForm, setEmpresaForm] = useState({ nome: '', cnpj: '', estado: 'RJ', responsavelNome: '', responsavelTelefone: '' });
  const [localForm, setLocalForm] = useState({ nome: '', endereco: '', cep: '', estado: 'RJ', responsavelLocal: '', telefoneLocal: '', empresaId: '' });
  const [tecnicoForm, setTecnicoForm] = useState({ name: '', email: '', password: '', cpf: '', dataNascimento: '', rg: '', endereco: '', telefone: '' });
  const [agendamentoForm, setAgendamentoForm] = useState({ localId: '', tecnicoId: '', data: '', tipoServico: 'Visita Técnica', observacoes: '' });

  const [agendamentos, setAgendamentos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [locais, setLocais] = useState([]);
  
  const [selectedItem, setSelectedItem] = useState({ item: null, type: '' });
  
  const [listTab, setListTab] = useState('empresas');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({ estado: '' });

  const [agendamentoFilters, setAgendamentoFilters] = useState({ dataInicio: '', dataFim: '', localNome: '', tecnicoNome: '', estado: '' });

  useEffect(() => {
    setCurrentPage(1);
  }, [listTab, searchTerm, filters]);

  const filteredData = useMemo(() => {
    let data = [];
    if (listTab === 'empresas') data = empresas;
    else if (listTab === 'locais') data = locais;
    else if (listTab === 'tecnicos') data = tecnicos;

    return data.filter(item => {
      const nameMatch = item.nome || item.name || '';
      const searchTermMatch = nameMatch.toLowerCase().includes(searchTerm.toLowerCase());

      if (listTab === 'empresas' && filters.estado) {
        return searchTermMatch && item.estado === filters.estado;
      }
      
      return searchTermMatch;
    });
  }, [listTab, empresas, locais, tecnicos, searchTerm, filters]);
  
  const filteredAgendamentos = agendamentos.filter(ag => {
    const agendamentoDate = ag.data.toDate ? ag.data.toDate() : new Date(ag.data);
    const localDoAgendamento = locais.find(l => l.id === ag.localId);
    const tecnicoDoAgendamento = tecnicos.find(t => t.id === ag.tecnicoId);

    const dataInicioFilter = agendamentoFilters.dataInicio ? new Date(agendamentoFilters.dataInicio) : null;
    if(dataInicioFilter) dataInicioFilter.setHours(0, 0, 0, 0);

    const dataFimFilter = agendamentoFilters.dataFim ? new Date(agendamentoFilters.dataFim) : null;
    if(dataFimFilter) dataFimFilter.setHours(23, 59, 59, 999);

    return (
      (!dataInicioFilter || agendamentoDate >= dataInicioFilter) &&
      (!dataFimFilter || agendamentoDate <= dataFimFilter) &&
      (!agendamentoFilters.localNome || (localDoAgendamento && localDoAgendamento.nome.toLowerCase().includes(agendamentoFilters.localNome.toLowerCase()))) &&
      (!agendamentoFilters.tecnicoNome || (tecnicoDoAgendamento && tecnicoDoAgendamento.name.toLowerCase().includes(agendamentoFilters.tecnicoNome.toLowerCase()))) &&
      (!agendamentoFilters.estado || (localDoAgendamento && localDoAgendamento.estado.toLowerCase().includes(agendamentoFilters.estado.toLowerCase())))
    );
  });

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      else router.push('/');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const fetchAllData = useCallback(async () => {
    try {
      const [empresasSnap, tecnicosSnap, agendamentosSnap, locaisSnap] = await Promise.all([
        getDocs(collection(db, "empresas")),
        getDocs(collection(db, "users")),
        getDocs(collection(db, "agendamentos")),
        getDocs(collection(db, "locais"))
      ]);
      setEmpresas(empresasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      const allUsers = tecnicosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTecnicos(allUsers.filter(user => user.role === 'tecnico'));
      setAgendamentos(agendamentosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLocais(locaisSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  }, []);
  
  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, fetchAllData]);

  const handleFormChange = (setter) => (event) => {
    const { name, value } = event.target;
    setter(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setAgendamentoFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateEmpresa = async (event) => {
    event.preventDefault();
    try {
      await addDoc(collection(db, "empresas"), empresaForm);
      alert('Empresa Cliente cadastrada com sucesso!');
      setEmpresaForm({ nome: '', cnpj: '', estado: 'RJ', responsavelNome: '', responsavelTelefone: ''});
      fetchAllData();
    } catch (error) {
      alert('Ocorreu um erro ao cadastrar a empresa.');
    }
  };

  const handleCreateLocal = async (event) => {
    event.preventDefault();
    if (!localForm.empresaId) {
      alert("Por favor, selecione a empresa cliente responsável.");
      return;
    }
    try {
      const response = await fetch('/api/createLocal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localForm)
      });
      if (response.ok) {
        alert('Local de serviço cadastrado com sucesso!');
        setLocalForm({ nome: '', endereco: '', cep: '', estado: 'RJ', responsavelLocal: '', telefoneLocal: '', empresaId: '' });
        fetchAllData();
      } else {
        const error = await response.json();
        alert(`Erro ao cadastrar local: ${error.message}`);
      }
    } catch (error) {
      alert('Ocorreu um erro de comunicação ao criar o local.');
    }
  };

  const handleCreateTecnico = async (event) => {
    event.preventDefault();
    const formattedPhone = `+55${tecnicoForm.telefone.replace(/\D/g, '')}`;
    const tecnicoData = { ...tecnicoForm, telefone: formattedPhone, role: 'tecnico' };
    try {
      const response = await fetch('/api/createUser', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tecnicoData) });
      if (response.ok) {
        alert('Técnico cadastrado com sucesso!');
        setTecnicoForm({ name: '', email: '', password: '', cpf: '', dataNascimento: '', rg: '', endereco: '', telefone: '' });
        fetchAllData();
      } else {
        const error = await response.json();
        alert(`Erro ao cadastrar técnico: ${error.message}`);
      }
    } catch (error) {
      alert('Ocorreu um erro de comunicação. Tente novamente.');
    }
  };

  const handleCreateAgendamento = async (event) => {
    event.preventDefault();
    if (!agendamentoForm.localId || !agendamentoForm.tecnicoId || !agendamentoForm.data) {
      alert("Por favor, preencha o local, o técnico e a data.");
      return;
    }
    try {
      const agendamentoData = { ...agendamentoForm, sistema: selectedSystem, data: new Date(agendamentoForm.data) };
      await addDoc(collection(db, "agendamentos"), agendamentoData);
      alert('Agendamento criado com sucesso!');
      setAgendamentoForm({ localId: '', tecnicoId: '', data: '', tipoServico: 'Visita Técnica', observacoes: '' });
      fetchAllData();
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      alert("Ocorreu um erro ao criar o agendamento.");
    }
  };

  const handleUpdate = async (type, id, data) => {
    const urlMap = {
      empresa: '/api/updateEmpresa',
      local: '/api/updateLocal',
      tecnico: '/api/updateUser',
      agendamento: '/api/updateAgendamento'
    };
    const url = urlMap[type];
    
    let finalData = { ...data };
    if (type === 'empresa') {
      finalData.horarioFuncionamento = { abre: data.horarioAbertura, fecha: data.horarioFechamento };
      delete finalData.horarioAbertura;
      delete finalData.horarioFechamento;
    }
    
    const idFieldMap = { empresa: 'empresaId', local: 'localId', tecnico: 'userId', agendamento: 'agendamentoId' };
    const body = { [idFieldMap[type]]: id, updates: finalData };
    if(type === 'tecnico') body.updates = undefined;

    try {
      const response = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(type === 'tecnico' ? {userId: id, ...finalData} : body) });
      if (response.ok) {
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} atualizado com sucesso!`);
        setSelectedItem({ item: null, type: '' });
        fetchAllData();
      } else {
        const error = await response.json();
        alert(`Erro ao atualizar: ${error.message}`);
      }
    } catch (error) {
      alert('Ocorreu um erro de comunicação.');
    }
  };

  const handleDelete = async (type, id) => {
    const urlMap = {
      empresa: '/api/deleteEmpresa',
      local: '/api/deleteLocal',
      tecnico: '/api/deleteUser',
      agendamento: '/api/deleteAgendamento'
    };
    const idFieldMap = { empresa: 'empresaId', local: 'localId', tecnico: 'userId', agendamento: 'agendamentoId' };
    const url = urlMap[type];
    const body = { [idFieldMap[type]]: id };
    
    try {
       const response = await fetch(url, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (response.ok) {
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} excluído com sucesso!`);
        setSelectedItem({ item: null, type: '' });
        fetchAllData();
      } else {
        const error = await response.json();
        alert(`Erro ao excluir: ${error.message}`);
      }
    } catch (error) {
       alert('Ocorreu um erro de comunicação.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (loading || !user) return <div>Carregando...</div>;
  if (!selectedSystem) return <ChoicePanel onSelect={(system) => setSelectedSystem(system)} />;

  const renderTabContent = () => {
    switch (activeTab) {
        case 'cadastrarEmpresa':
            return (
              <div>
                <h2>Cadastrar Nova Empresa Cliente</h2>
                <form className={styles.formContainer} onSubmit={handleCreateEmpresa}>
                    <input type="text" name="nome" placeholder="Nome da Empresa Cliente" value={empresaForm.nome} onChange={handleFormChange(setEmpresaForm)} required />
                    <input type="text" name="cnpj" placeholder="CNPJ" value={empresaForm.cnpj} onChange={handleFormChange(setEmpresaForm)} required />
                    <label>Estado Sede</label>
                    <select name="estado" value={empresaForm.estado} onChange={handleFormChange(setEmpresaForm)} required>
                      {estadosBrasileiros.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                    <input type="text" name="responsavelNome" placeholder="Nome do Responsável Geral" value={empresaForm.responsavelNome} onChange={handleFormChange(setEmpresaForm)} required />
                    <input type="tel" name="responsavelTelefone" placeholder="Telefone do Responsável Geral" value={empresaForm.responsavelTelefone} onChange={handleFormChange(setEmpresaForm)} required />
                    <button type="submit" className={styles.primaryButton}>Cadastrar Empresa</button>
                </form>
              </div>
            );
          case 'cadastrarLocal':
            return (
              <div>
                <h2>Cadastrar Novo Local de Serviço</h2>
                <form className={styles.formContainer} onSubmit={handleCreateLocal}>
                    <label>Empresa Cliente (Responsável)</label>
                    <select name="empresaId" value={localForm.empresaId} onChange={handleFormChange(setLocalForm)} required>
                      <option value="">Selecione a empresa principal</option>
                      {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
                    </select>
                    <input type="text" name="nome" placeholder="Nome do Local (Ex: Escola Olga Teixeira)" value={localForm.nome} onChange={handleFormChange(setLocalForm)} required />
                    <input type="text" name="endereco" placeholder="Endereço Completo" value={localForm.endereco} onChange={handleFormChange(setLocalForm)} required />
                    <input type="text" name="cep" placeholder="CEP" value={localForm.cep} onChange={handleFormChange(setLocalForm)} required />
                    <label>Estado</label>
                    <select name="estado" value={localForm.estado} onChange={handleFormChange(setLocalForm)} required>{estadosBrasileiros.map(uf => <option key={uf} value={uf}>{uf}</option>)}</select>
                    <input type="text" name="responsavelLocal" placeholder="Nome do Responsável no Local" value={localForm.responsavelLocal} onChange={handleFormChange(setLocalForm)} />
                    <input type="tel" name="telefoneLocal" placeholder="Telefone do Responsável no Local" value={localForm.telefoneLocal} onChange={handleFormChange(setLocalForm)} />
                    <button type="submit" className={styles.primaryButton}>Cadastrar Local</button>
                </form>
              </div>
            );
          case 'cadastrarTecnico':
            return (
              <div>
                <h2>Cadastrar Novo Técnico</h2>
                <form className={styles.formContainer} onSubmit={handleCreateTecnico}>
                    <input type="text" name="name" placeholder="Nome Completo" value={tecnicoForm.name} onChange={handleFormChange(setTecnicoForm)} required />
                    <input type="email" name="email" placeholder="Email" value={tecnicoForm.email} onChange={handleFormChange(setTecnicoForm)} required />
                    <input type="password" name="password" placeholder="Senha (mín. 6 caracteres)" value={tecnicoForm.password} onChange={handleFormChange(setTecnicoForm)} required />
                    <input type="text" name="cpf" placeholder="CPF" value={tecnicoForm.cpf} onChange={handleFormChange(setTecnicoForm)} required />
                    <input type="date" name="dataNascimento" value={tecnicoForm.dataNascimento} onChange={handleFormChange(setTecnicoForm)} required />
                    <input type="text" name="rg" placeholder="RG" value={tecnicoForm.rg} onChange={handleFormChange(setTecnicoForm)} required />
                    <input type="text" name="endereco" placeholder="Endereço" value={tecnicoForm.endereco} onChange={handleFormChange(setTecnicoForm)} required />
                    <input type="tel" name="telefone" placeholder="Telefone (Ex: 21912345678)" value={tecnicoForm.telefone} onChange={handleFormChange(setTecnicoForm)} required />
                    <button type="submit" className={styles.primaryButton}>Cadastrar Técnico</button>
                </form>
              </div>
            );
      case 'listarDados':
        return (
          <div>
            <h2>Listar Dados</h2>
            <div className={styles.listSubTabs}>
              <button className={`${styles.subTabButton} ${listTab === 'empresas' ? styles.active : ''}`} onClick={() => setListTab('empresas')}>Empresas Clientes</button>
              <button className={`${styles.subTabButton} ${listTab === 'locais' ? styles.active : ''}`} onClick={() => setListTab('locais')}>Locais de Serviço</button>
              <button className={`${styles.subTabButton} ${listTab === 'tecnicos' ? styles.active : ''}`} onClick={() => setListTab('tecnicos')}>Técnicos</button>
            </div>
            
            <div className={styles.filterContainer}>
                <input type="text" placeholder="Buscar por nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                {listTab === 'empresas' && (
                  <select value={filters.estado} onChange={(e) => setFilters({ ...filters, estado: e.target.value })}>
                    <option value="">Todos os Estados</option>
                    {estadosBrasileiros.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                )}
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  {listTab === 'empresas' && (<tr><th>Nome</th><th>CNPJ</th><th>Estado</th><th>Ações</th></tr>)}
                  {listTab === 'locais' && (<tr><th>Nome do Local</th><th>Empresa Principal</th><th>Endereço</th><th>Ações</th></tr>)}
                  {listTab === 'tecnicos' && (<tr><th>Nome</th><th>Email</th><th>Telefone</th><th>Ações</th></tr>)}
                </thead>
                <tbody>
                  {currentData.length > 0 ? currentData.map(item => {
                    if (listTab === 'empresas') return (
                      <tr key={item.id}>
                        <td>{item.nome}</td><td>{item.cnpj}</td><td>{item.estado}</td>
                        <td className={styles.actionsCell}>
                          <button onClick={() => setSelectedItem({ item, type: 'empresa' })} className={styles.editButton}>Ver / Editar</button>
                        </td>
                      </tr>
                    );
                    if (listTab === 'locais') return (
                      <tr key={item.id}>
                        <td>{item.nome}</td><td>{empresas.find(e => e.id === item.empresaId)?.nome || 'N/A'}</td><td>{item.endereco}</td>
                        <td className={styles.actionsCell}>
                          <button onClick={() => setSelectedItem({ item, type: 'local' })} className={styles.editButton}>Ver / Editar</button>
                        </td>
                      </tr>
                    );
                    if (listTab === 'tecnicos') return (
                      <tr key={item.id}>
                        <td>{item.name}</td><td>{item.email}</td><td>{item.telefone}</td>
                        <td className={styles.actionsCell}>
                          <button onClick={() => setSelectedItem({ item, type: 'tecnico' })} className={styles.editButton}>Ver / Editar</button>
                        </td>
                      </tr>
                    );
                    return null;
                  }) : (
                    <tr><td colSpan="4">Nenhum dado encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.paginationContainer}>
              <span>Página {currentPage} de {totalPages || 1}</span>
              <div>
                <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className={styles.paginationButton}>Anterior</button>
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages} className={styles.paginationButton} style={{marginLeft: '10px'}}>Próxima</button>
              </div>
            </div>
          </div>
        );
      case 'agendamentos':
        return (
          <div>
            <h2>Gestão de Agendamentos</h2>
            <div className={styles.subSection}>
              <h3>Criar Novo Agendamento</h3>
              <form className={styles.formContainer} onSubmit={handleCreateAgendamento}>
                <label>Local de Serviço</label>
                <select name="localId" value={agendamentoForm.localId} onChange={handleFormChange(setAgendamentoForm)} required>
                  <option value="">Selecione um local</option>
                  {locais.map(local => (<option key={local.id} value={local.id}>{local.nome} ({empresas.find(e => e.id === local.empresaId)?.nome})</option>))}
                </select>
                <label>Técnico Responsável</label>
                <select name="tecnicoId" value={agendamentoForm.tecnicoId} onChange={handleFormChange(setAgendamentoForm)} required>
                  <option value="">Selecione um técnico</option>
                  {tecnicos.map(tecnico => (<option key={tecnico.id} value={tecnico.id}>{tecnico.name}</option>))}
                </select>
                <label>Data e Hora</label><input type="datetime-local" name="data" value={agendamentoForm.data} onChange={handleFormChange(setAgendamentoForm)} required />
                <label>Tipo de Serviço</label><select name="tipoServico" value={agendamentoForm.tipoServico} onChange={handleFormChange(setAgendamentoForm)} required><option>Visita Técnica</option><option>Instalação</option><option>Manutenção</option></select>
                <label>Observações</label><textarea name="observacoes" placeholder="Detalhes..." value={agendamentoForm.observacoes} onChange={handleFormChange(setAgendamentoForm)} rows="4"></textarea>
                <button type="submit" className={styles.primaryButton}>Agendar Serviço</button>
              </form>
            </div>
            <div className={styles.subSection}>
              <h3>Buscar Agendamentos</h3>
              <div className={styles.filterContainer}>
                <input type="date" name="dataInicio" value={agendamentoFilters.dataInicio} onChange={handleFilterChange} />
                <input type="date" name="dataFim" value={agendamentoFilters.dataFim} onChange={handleFilterChange} />
                <input type="text" name="localNome" placeholder="Nome do Local" value={agendamentoFilters.localNome} onChange={handleFilterChange} />
                <input type="text" name="tecnicoNome" placeholder="Nome do Técnico" value={agendamentoFilters.tecnicoNome} onChange={handleFilterChange} />
                <input type="text" name="estado" placeholder="Estado (UF)" value={agendamentoFilters.estado} onChange={handleFilterChange} />
              </div>
              <h4>Agendamentos Encontrados ({filteredAgendamentos.length})</h4>
              <ul className={styles.dataList}>
                  {filteredAgendamentos.length > 0 ? filteredAgendamentos.map(ag => {
                      const local = locais.find(l => l.id === ag.localId);
                      const tecnicoNome = tecnicos.find(t => t.id === ag.tecnicoId)?.name || 'Técnico Removido';
                      return (
                          <li key={ag.id} onClick={() => setSelectedItem({item: ag, type: 'agendamento'})}>
                              <strong>{local?.nome || 'Local Removido'}</strong>
                              <small>Técnico: {tecnicoNome}</small>
                              <small>Data: {ag.data.toDate ? ag.data.toDate().toLocaleString('pt-BR') : 'Data inválida'}</small>
                          </li>
                      );
                  }) : <li>Nenhum agendamento encontrado.</li>}
              </ul>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <>
      <Head>
        <title>Painel Admin - {selectedSystem}</title>
      </Head>
      <div className={styles.dashboardContainer}>
        <DetailsModal 
          item={selectedItem.item}
          type={selectedItem.type}
          onClose={() => setSelectedItem({ item: null, type: '' })}
          onSave={handleUpdate}
          onDelete={handleDelete}
          extraData={{empresas, tecnicos, locais}}
        />
        <header className={styles.header}>
          <div><h1>Painel Admin - <span style={{ color: '#3498db' }}>{selectedSystem}</span></h1><p>Bem-vindo, {name}!</p></div>
          <div><button onClick={() => setSelectedSystem(null)} className={styles.secondaryButton} style={{marginRight: '10px'}}>Trocar Sistema</button><button onClick={handleLogout} className={styles.logoutButton}>Sair</button></div>
        </header>
        <div className={styles.content}>
          <nav className={styles.tabMenu}>
            <button className={`${styles.tabButton} ${activeTab === 'cadastrarEmpresa' ? styles.active : ''}`} onClick={() => setActiveTab('cadastrarEmpresa')}>Cadastrar Empresa Cliente</button>
            <button className={`${styles.tabButton} ${activeTab === 'cadastrarLocal' ? styles.active : ''}`} onClick={() => setActiveTab('cadastrarLocal')}>Cadastrar Local de Serviço</button>
            <button className={`${styles.tabButton} ${activeTab === 'cadastrarTecnico' ? styles.active : ''}`} onClick={() => setActiveTab('cadastrarTecnico')}>Cadastrar Técnico</button>
            <button className={`${styles.tabButton} ${activeTab === 'listarDados' ? styles.active : ''}`} onClick={() => setActiveTab('listarDados')}>Listar Dados</button>
            <button className={`${styles.tabButton} ${activeTab === 'agendamentos' ? styles.active : ''}`} onClick={() => setActiveTab('agendamentos')}>Agendamentos</button>
          </nav>
          <main className={styles.tabContent}>
            {renderTabContent()}
          </main>
        </div>
      </div>
    </>
  );
}