import { useEffect, useState, useCallback, useRef, createRef } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from '../firebase-config.js';
import Head from 'next/head';
import styles from '../styles/TecnicoDashboard.module.css';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import RelatorioTemplate from '../components/RelatorioTemplate';

const initialFormData = {
    agendamentoId: null,
    nomeEmpresa: '',
    nomeLocal: '',
    tipoEmpreendimento: '',
    logoEmpresa: [],
    tipoInstalacao: '',
    avaliacaoArmazenamento: '',
    fotosArmazenamento: [],
    obsArmazenamento: '',
    tipoTubulacao: '',
    reguladoresPrincipais: '',
    validadeReguladores: '',
    pressaoLinha: '',
    distanciaMedia: '',
    avaliacaoInfra: '',
    fotosInfra: [],
    obsInfra: '',
    resultadoEstanqueidade: '',
    descEstanqueidade: '',
    fotosEstanqueidade: [],
    obsEstanqueidade: '',
    obsGerais: '',
};

const initialEquipamento = {
    id: Date.now(),
    tipo: '',
    outroTipo: '',
    avaliacaoReguladores: '',
    avaliacaoMangueiras: '',
    avaliacaoGeral: '',
    fotos: [],
    observacoes: '',
    fileInputRef: createRef()
};

const empreendimentoOptions = ["Escola", "Restaurante", "Condomínios", "Industria", "Residencial"];
const instalacaoOptions = ["P-13", "P-45", "P-90", "P-180", "Granel", "GN"];
const tubulacaoOptions = ["Galvanizado", "Cobre", "Tubo Multicamadas"];
const estanqueidadeOptions = [
    { value: 'aprovado', label: 'Aprovado (Sem Vazamentos)' },
    { value: 'reprovado', label: 'Reprovado (Vazamento Detectado)' }
];

export default function TecnicoDashboard() {
    const router = useRouter();
    const { name } = router.query;
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('dashboard');
    const [formData, setFormData] = useState(initialFormData);
    const [equipamentos, setEquipamentos] = useState([]);
    const [myAgendamentos, setMyAgendamentos] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [locais, setLocais] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [relatorioParaPDF, setRelatorioParaPDF] = useState(null);
    const pdfTemplateRef = useRef(null);

    const fileInputRefs = {
        logoEmpresa: useRef(null),
        fotosArmazenamento: useRef(null),
        fotosInfra: useRef(null),
        fotosEstanqueidade: useRef(null),
    };

    const fetchData = useCallback(async (uid) => {
        if (!uid) return;
        setIsLoadingData(true);
        try {
            const [empresasSnap, locaisSnap] = await Promise.all([
                getDocs(collection(db, "empresas")),
                getDocs(collection(db, "locais"))
            ]);
            const empresasData = empresasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const locaisData = locaisSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEmpresas(empresasData);
            setLocais(locaisData);
            
            const agendamentosQuery = query(collection(db, "agendamentos"), where("tecnicoId", "==", uid));
            const agendamentosSnap = await getDocs(agendamentosQuery);
            const agendamentosCompletos = agendamentosSnap.docs.map(doc => {
                const agendamento = { id: doc.id, ...doc.data() };
                const local = locaisData.find(l => l.id === agendamento.localId);
                const empresa = empresasData.find(e => e.id === local?.empresaId);
                return { ...agendamento, nomeLocal: local?.nome || "Local não encontrado", nomeEmpresa: empresa?.nome || "Empresa não encontrada" };
            });
            setMyAgendamentos(agendamentosCompletos);
        } catch (error) {
            console.error("Erro ao buscar dados do técnico:", error);
            alert("Não foi possível carregar os seus agendamentos.");
        }
        setIsLoadingData(false);
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchData(currentUser.uid);
            } else {
                router.push('/');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [router, fetchData]);
    
    useEffect(() => {
        const allImageObjects = [];
        Object.values(formData).forEach(value => {
            if (Array.isArray(value)) {
                allImageObjects.push(...value.filter(item => item && item.preview));
            }
        });
        equipamentos.forEach(eq => allImageObjects.push(...eq.fotos));
        return () => {
            allImageObjects.forEach(image => {
                URL.revokeObjectURL(image.preview);
            });
        };
    }, []);

    const handleFileChange = (e, fieldName, equipamentoId = null) => {
        const files = Array.from(e.target.files).map(file => ({ file: file, preview: URL.createObjectURL(file) }));
        if (equipamentoId) {
            setEquipamentos(prev => prev.map(eq => eq.id === equipamentoId ? { ...eq, fotos: [...eq.fotos, ...files] } : eq));
        } else {
            setFormData(prev => ({...prev, [fieldName]: [...prev[fieldName], ...files]}));
        }
        e.target.value = null;
    };

    const handleRemoveImage = (fieldName, previewUrl, equipamentoId = null) => {
        URL.revokeObjectURL(previewUrl);
        if (equipamentoId) {
            setEquipamentos(prev => prev.map(eq => eq.id === equipamentoId ? { ...eq, fotos: eq.fotos.filter(f => f.preview !== previewUrl) } : eq));
        } else {
            setFormData(prev => ({...prev, [fieldName]: prev[fieldName].filter(f => f.preview !== previewUrl)}));
        }
    };

    const handleStartVisit = (agendamento) => {
        setFormData(initialFormData);
        setEquipamentos([]);
        setView('form');
        setFormData(prev => ({ ...prev, agendamentoId: agendamento.id, nomeEmpresa: agendamento.nomeEmpresa, nomeLocal: agendamento.nomeLocal }));
    };

    const handleFormChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogout = async () => {
        try { await signOut(auth); router.push('/'); } catch (err) { console.error(err); alert('Ocorreu um erro ao fazer logout.'); }
    };

    const handleAddEquipamento = () => {
        setEquipamentos(prev => [...prev, { ...initialEquipamento, id: Date.now(), fileInputRef: createRef() }]);
    };

    const handleRemoveEquipamento = (id) => {
        setEquipamentos(prev => prev.filter(item => item.id !== id));
    };

    const handleEquipamentoChange = (id, e) => {
        const { name, value } = e.target;
        setEquipamentos(prev => prev.map(item => item.id === id ? { ...item, [name]: value } : item));
    };
    
    const gerarPDF = async (dadosDoRelatorio) => {
        setRelatorioParaPDF(dadosDoRelatorio);
        await new Promise(resolve => setTimeout(resolve, 500));
        const input = pdfTemplateRef.current;
        if (!input) {
            setRelatorioParaPDF(null);
            return;
        }

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
            
            const canvas = await html2canvas(input, {
                scale: 2,
                useCORS: true,
                allowTaint: true
            });
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUploading(true);
        try {
            const uploadImages = async (files, basePath) => await Promise.all(
                files.map(async (imageObject) => {
                    const filePath = `${basePath}/${Date.now()}_${imageObject.file.name}`;
                    const storageRef = ref(storage, filePath);
                    await uploadBytes(storageRef, imageObject.file);
                    return await getDownloadURL(storageRef);
                })
            );
            
            const reportBasePath = `relatorios/${formData.agendamentoId || Date.now()}`;
            const [logoEmpresaUrl, fotosArmazenamentoUrls, fotosInfraUrls, fotosEstanqueidadeUrls] = await Promise.all([
                uploadImages(formData.logoEmpresa, `${reportBasePath}/logo`),
                uploadImages(formData.fotosArmazenamento, `${reportBasePath}/armazenamento`),
                uploadImages(formData.fotosInfra, `${reportBasePath}/infraestrutura`),
                uploadImages(formData.fotosEstanqueidade, `${reportBasePath}/estanqueidade`)
            ]);
            
            const equipamentosComUrls = await Promise.all(
                equipamentos.map(async (eq, index) => {
                    const fotosUrls = await uploadImages(eq.fotos, `${reportBasePath}/equipamento_${index + 1}`);
                    const { fotos, fileInputRef, ...restoDoEquipamento } = eq;
                    return { ...restoDoEquipamento, fotosUrls };
                })
            );

            const { logoEmpresa, fotosArmazenamento, fotosInfra, fotosEstanqueidade, ...restoDoFormulario } = formData;
            const finalReport = {
                ...restoDoFormulario,
                tecnicoId: user.uid,
                tecnicoNome: name,
                createdAt: serverTimestamp(),
                logoEmpresaUrl: logoEmpresaUrl[0] || null,
                fotosArmazenamentoUrls,
                fotosInfraUrls,
                fotosEstanqueidadeUrls,
                equipamentos: equipamentosComUrls,
            };

            const docRef = await addDoc(collection(db, "relatorios"), finalReport);
            alert(`Relatório salvo com sucesso! ID: ${docRef.id}`);
            
            await gerarPDF({ ...finalReport, createdAt: new Date() });

            setView('dashboard');
            setFormData(initialFormData);
            setEquipamentos([]);
        } catch (error) {
            console.error("Erro ao salvar o relatório:", error);
            alert("Ocorreu um erro ao salvar o relatório.");
        } finally {
            setIsUploading(false);
        }
    };

    if (loading || !user) {
        return <div>Carregando...</div>;
    }

    const ImagePreviewer = ({ fieldName, equipamentoId = null }) => {
        const images = equipamentoId ? (equipamentos.find(eq => eq.id === equipamentoId)?.fotos || []) : (formData[fieldName] || []);
        return (
            <div className={styles.imagePreviewContainer}>
                {images.map((image) => (
                    <div key={image.preview} className={styles.imagePreview}>
                        <img src={image.preview} alt="Pré-visualização" className={styles.previewImage} />
                        <button type="button" className={styles.removeImageButton} onClick={() => handleRemoveImage(fieldName, image.preview, equipamentoId)}>&times;</button>
                    </div>
                ))}
            </div>
        );
    };

    if (view === 'dashboard') {
        return (
            <>
                <Head><title>Painel do Técnico</title></Head>
                <div className={styles.container}>
                    <header className={styles.header}>
                        <h1>Painel do Técnico</h1>
                        <div>
                           <button onClick={() => router.back()} className={styles.secondaryButton} style={{marginRight: '10px'}}>Voltar</button>
                           <button onClick={handleLogout} className={styles.logoutButton}>Sair</button>
                        </div>
                    </header>
                    <main className={styles.dashboardContent}>
                        <h2>Bem-vindo, {name}!</h2>
                        <p>Selecione uma visita agendada para iniciar o relatório.</p>
                        <div style={{marginTop: '30px'}}>
                            <h3>Minhas Visitas Agendadas</h3>
                            {isLoadingData ? (<p>Carregando agendamentos...</p>) : myAgendamentos.length > 0 ? (
                                <ul className={styles.visitList}>
                                    {myAgendamentos.map(ag => (
                                        <li key={ag.id} className={styles.visitItem} onClick={() => handleStartVisit(ag)} style={{cursor: 'pointer'}}>
                                            <strong>{ag.nomeLocal}</strong> ({ag.nomeEmpresa})<br />
                                            <small>Data: {ag.data.toDate ? ag.data.toDate().toLocaleString('pt-BR') : 'Data inválida'}</small>
                                            <small style={{marginLeft: '15px'}}>Serviço: {ag.tipoServico}</small>
                                        </li>
                                    ))}
                                </ul>
                            ) : (<p>Você não possui nenhuma visita agendada no momento.</p>)}
                        </div>
                    </main>
                </div>
            </>
        );
    }
    
    if (view === 'form') {
        return (
            <>
                <Head><title>Nova Visita Técnica</title></Head>
                <div className={styles.container}>
                    <header className={styles.header}>
                        <h1>Relatório de Visita Técnica</h1>
                        <button onClick={() => setView('dashboard')} className={styles.secondaryButton} disabled={isUploading}>&larr; Voltar ao Painel</button>
                    </header>
                    <main className={styles.formContent}>
                        {isUploading && ( <div style={{ padding: '20px', backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}><p style={{ margin: 0, fontWeight: 'bold' }}>Salvando relatório e enviando imagens... Por favor, aguarde.</p></div>)}
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formSection}>
                                <h2 >Dados da Visita</h2>
                                <div className={styles.inputGroup}>
                                    <label htmlFor="nomeLocal">Local da Visita (Empresa)</label>
                                    <input type="text" id="nomeLocal" name="nomeLocal" value={`${formData.nomeLocal} (${formData.nomeEmpresa})`} disabled />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label className={styles.chipGroupLabel}>1. Qual o tipo de empreendimento?</label>
                                    <div className={styles.chipGroup}>
                                        {empreendimentoOptions.map(option => (<button type="button" key={option} className={`${styles.chipButton} ${formData.tipoEmpreendimento === option ? styles.active : ''}`} onClick={() => handleFormChange('tipoEmpreendimento', option)}>{option}</button>))}
                                        <button type="button" className={`${styles.chipButton} ${formData.tipoEmpreendimento === 'outros' ? styles.active : ''}`} onClick={() => handleFormChange('tipoEmpreendimento', 'outros')}>outros</button>
                                        <button type="button" className={styles.cameraButton}>📷</button>
                                    </div>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Logo da Empresa (Opcional)</label>
                                    <input type="file" accept="image/*" ref={fileInputRefs.logoEmpresa} style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'logoEmpresa')} />
                                    <button type="button" className={styles.secondaryButton} onClick={() => fileInputRefs.logoEmpresa.current.click()}>Carregar Logo</button>
                                    <ImagePreviewer fieldName="logoEmpresa" />
                                </div>
                            </div>
                            <div className={styles.formSection}>
                                <h2 >2. Área de Armazenamento de Gás</h2>
                                <div className={styles.inputGroup}>
                                    <label className={styles.chipGroupLabel}>Tipo de instalação?</label>
                                    <div className={styles.chipGroup}>
                                        {instalacaoOptions.map(option => (<button type="button" key={option} className={`${styles.chipButton} ${formData.tipoInstalacao === option ? styles.active : ''}`} onClick={() => handleFormChange('tipoInstalacao', option)}>{option}</button>))}
                                        <button type="button" className={`${styles.chipButton} ${formData.tipoInstalacao === 'outros' ? styles.active : ''}`} onClick={() => handleFormChange('tipoInstalacao', 'outros')}>outros</button>
                                        <button type="button" className={styles.cameraButton}>📷</button>
                                    </div>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label htmlFor="avaliacaoArmazenamento">Avaliação da Área</label>
                                    <select id="avaliacaoArmazenamento" name="avaliacaoArmazenamento" value={formData.avaliacaoArmazenamento} onChange={(e) => handleFormChange(e.target.name, e.target.value)}>
                                        <option value="">Selecione</option>
                                        <option value="otimo">Ótimo</option>
                                        <option value="bom">Bom</option>
                                        <option value="regular">Regular</option>
                                        <option value="ruim">Ruim/Precisando de Manutenção</option>
                                    </select>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Fotos da Área de Armazenamento</label>
                                    <input type="file" accept="image/*" multiple ref={fileInputRefs.fotosArmazenamento} style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'fotosArmazenamento')} />
                                    <div className={styles.uploadGroup}>
                                        <button type="button" className={styles.secondaryButton} onClick={() => fileInputRefs.fotosArmazenamento.current.click()}>Carregar do Álbum</button>
                                        <button type="button" className={styles.cameraButton} onClick={() => { fileInputRefs.fotosArmazenamento.current.setAttribute('capture', 'environment'); fileInputRefs.fotosArmazenamento.current.click(); }}>📷 Tirar Foto</button>
                                    </div>
                                    <ImagePreviewer fieldName="fotosArmazenamento" />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label htmlFor="obsArmazenamento">Observações (Armazenamento)</label>
                                    <textarea id="obsArmazenamento" name="obsArmazenamento" rows="3" value={formData.obsArmazenamento} onChange={(e) => handleFormChange(e.target.name, e.target.value)}></textarea>
                                </div>
                            </div>
                            <div className={styles.formSection}>
                                <h2 >3. Infraestrutura da Linha de Gás</h2>
                                <div className={styles.inputGroup}>
                                    <label className={styles.chipGroupLabel}>Qual a infraestrutura utilizada nos tubos de condução de gás?</label>
                                    <div className={styles.chipGroup}>
                                        {tubulacaoOptions.map(option => (<button type="button" key={option} className={`${styles.chipButton} ${formData.tipoTubulacao === option ? styles.active : ''}`} onClick={() => handleFormChange('tipoTubulacao', option)}>{option}</button>))}
                                        <button type="button" className={`${styles.chipButton} ${formData.tipoTubulacao === 'outros' ? styles.active : ''}`} onClick={() => handleFormChange('tipoTubulacao', 'outros')}>outros</button>
                                        <button type="button" className={styles.cameraButton}>📷</button>
                                    </div>
                                </div>
                                <div className={styles.inputGroup}><label htmlFor="reguladoresPrincipais">Tipos de Reguladores e Validades</label><input type="text" id="reguladoresPrincipais" name="reguladoresPrincipais" value={formData.reguladoresPrincipais} onChange={(e) => handleFormChange(e.target.name, e.target.value)} placeholder="Ex: Regulador 12kg/h, validade 01/2028"/></div>
                                <div className={styles.inputGroup}><label htmlFor="pressaoLinha">Pressão da Linha de Serviço (mbar/psi)</label><input type="text" id="pressaoLinha" name="pressaoLinha" value={formData.pressaoLinha} onChange={(e) => handleFormChange(e.target.name, e.target.value)} /></div>
                                <div className={styles.inputGroup}><label htmlFor="distanciaMedia">Distância Média (PI de Gás {"->"} Área de Queima)</label><input type="number" id="distanciaMedia" name="distanciaMedia" value={formData.distanciaMedia} onChange={(e) => handleFormChange(e.target.name, e.target.value)} placeholder="Metros"/></div>
                                <div className={styles.inputGroup}>
                                    <label htmlFor="avaliacaoInfra">Avaliação da Infraestrutura</label>
                                    <select id="avaliacaoInfra" name="avaliacaoInfra" value={formData.avaliacaoInfra} onChange={(e) => handleFormChange(e.target.name, e.target.value)}>
                                        <option value="">Selecione</option><option value="otimo">Ótimo</option><option value="bom">Bom</option><option value="regular">Regular</option><option value="ruim">Ruim/Precisando de Manutenção</option>
                                    </select>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Fotos da Infraestrutura (Tubulação, Reguladores)</label>
                                    <input type="file" accept="image/*" multiple ref={fileInputRefs.fotosInfra} style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'fotosInfra')} />
                                    <div className={styles.uploadGroup}>
                                        <button type="button" className={styles.secondaryButton} onClick={() => fileInputRefs.fotosInfra.current.click()}>Carregar do Álbum</button>
                                        <button type="button" className={styles.cameraButton} onClick={() => { fileInputRefs.fotosInfra.current.setAttribute('capture', 'environment'); fileInputRefs.fotosInfra.current.click(); }}>📷 Tirar Foto</button>
                                    </div>
                                    <ImagePreviewer fieldName="fotosInfra" />
                                </div>
                            </div>
                            <div className={styles.formSection}>
                                <h2 >4. Equipamentos de Geração de Energia</h2>
                                {equipamentos.map((item, index) => (
                                    <div key={item.id} className={styles.equipamentoBlock}>
                                        <div className={styles.equipamentoHeader}><h3>Equipamento #{index + 1}</h3><button type="button" onClick={() => handleRemoveEquipamento(item.id)} className={styles.deleteButton}>Remover</button></div>
                                        <div className={styles.inputGroup}><label>Tipo de Equipamento</label><select name="tipo" value={item.tipo} onChange={(e) => handleEquipamentoChange(item.id, e)}><option value="">Selecione</option><option value="fogao">Fogão</option><option value="caldeira">Caldeira</option><option value="fritadeira">Fritadeira</option><option value="forno">Forno</option><option value="outro">Outro</option></select></div>
                                        {item.tipo === 'outro' && (<div className={styles.inputGroup}><label>Qual?</label><input type="text" name="outroTipo" value={item.outroTipo} onChange={(e) => handleEquipamentoChange(item.id, e)} /></div>)}
                                        <div className={styles.inputGroup}><label>Avaliação das Mangueiras</label><select name="avaliacaoMangueiras" value={item.avaliacaoMangueiras} onChange={(e) => handleEquipamentoChange(item.id, e)}><option value="">Selecione</option><option value="otimo">Ótimo</option><option value="bom">Bom</option><option value="regular">Regular</option><option value="ruim">Ruim/Precisando de Manutenção</option></select></div>
                                        <div className={styles.inputGroup}><label>Avaliação Geral do Equipamento</label><select name="avaliacaoGeral" value={item.avaliacaoGeral} onChange={(e) => handleEquipamentoChange(item.id, e)}><option value="">Selecione</option><option value="otimo">Ótimo</option><option value="bom">Bom</option><option value="regular">Regular</option><option value="ruim">Ruim/Precisando de Manutenção</option></select></div>
                                        <div className={styles.inputGroup}>
                                            <label>Fotos do Equipamento</label>
                                            <input type="file" accept="image/*" multiple ref={item.fileInputRef} style={{ display: 'none' }} onChange={(e) => handleFileChange(e, null, item.id)} />
                                            <div className={styles.uploadGroup}>
                                                <button type="button" className={styles.secondaryButton} onClick={() => item.fileInputRef.current.click()}>Carregar do Álbum</button>
                                                <button type="button" className={styles.cameraButton} onClick={() => { item.fileInputRef.current.setAttribute('capture', 'environment'); item.fileInputRef.current.click(); }}>📷 Tirar Foto</button>
                                            </div>
                                            <ImagePreviewer fieldName="fotos" equipamentoId={item.id} />
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddEquipamento} className={styles.secondaryButton} disabled={isUploading}>+ Adicionar Equipamento</button>
                            </div>
                            <div className={styles.formSection}>
                                <h2>5. Teste de Estanqueidade (Vazamento)</h2>
                                <div className={styles.inputGroup}>
                                  <label className={styles.chipGroupLabel}>Resultado do Teste</label>
                                  <div className={styles.chipGroup}>{estanqueidadeOptions.map(option => (<button type="button" key={option.value} className={`${styles.chipButton} ${formData.resultadoEstanqueidade === option.value ? styles.active : ''}`} onClick={() => handleFormChange('resultadoEstanqueidade', option.value)}>{option.label}</button>))}</div>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Fotos (Manômetro, etc.)</label>
                                    <input type="file" accept="image/*" multiple ref={fileInputRefs.fotosEstanqueidade} style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'fotosEstanqueidade')} />
                                    <div className={styles.uploadGroup}><button type="button" className={styles.secondaryButton} onClick={() => fileInputRefs.fotosEstanqueidade.current.click()}>Carregar do Álbum</button><button type="button" className={styles.cameraButton} onClick={() => { fileInputRefs.fotosEstanqueidade.current.setAttribute('capture', 'environment'); fileInputRefs.fotosEstanqueidade.current.click(); }}>📷 Tirar Foto</button></div>
                                    <ImagePreviewer fieldName="fotosEstanqueidade" />
                                </div>
                            </div>
                            <div className={styles.formActions}>
                                <button type="button" className={styles.secondaryButton} disabled={isUploading}>Salvar Rascunho</button>
                                <button type="submit" className={styles.primaryButton} disabled={isUploading}>{isUploading ? 'Enviando...' : 'Finalizar e Gerar PDF'}</button>
                            </div>
                        </form>
                    </main>
                </div>
                <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -1 }}>
                    <RelatorioTemplate ref={pdfTemplateRef} relatorio={relatorioParaPDF} />
                </div>
            </>
        );
    }
    return null;
}