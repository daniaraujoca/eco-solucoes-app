import React from 'react';

// Estilos para o PDF
const styles = {
  page: {
    padding: '25px',
    backgroundColor: '#fff',
    width: '210mm',
    minHeight: '297mm',
    fontFamily: 'Arial, sans-serif',
    fontSize: '11px',
    color: '#333',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #333',
    paddingBottom: '10px',
    marginBottom: '20px',
  },
  headerText: {
    textAlign: 'right',
    flexGrow: 1,
    padding: '0 20px'
  },
  ecoLogo: {
    maxWidth: '120px',
  },
  clientLogo: {
    maxWidth: '100px',
    maxHeight: '60px',
  },
  reportTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    margin: 0,
  },
  clientName: {
    fontSize: '16px',
    margin: '5px 0 0 0',
    color: '#555',
  },
  section: {
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '1px solid #eee',
    pageBreakInside: 'avoid', // Evita que a seção seja cortada
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#2c3e50',
    borderBottom: '2px solid #3498db',
    paddingBottom: '5px',
    marginBottom: '10px',
  },
  field: {
    marginBottom: '8px',
    display: 'flex',
  },
  label: {
    fontWeight: 'bold',
    minWidth: '180px',
  },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginTop: '10px',
  },
  image: {
    width: '100%',
    height: 'auto',
    borderRadius: '4px',
    border: '1px solid #ddd',
  },
};

const RelatorioTemplate = React.forwardRef(({ relatorio }, ref) => {
  if (!relatorio) {
    return null;
  }

  const formatDate = (date) => {
    if (!date) return 'Data não disponível';
    if (date.toLocaleString) { return date.toLocaleString('pt-BR'); }
    if (date.seconds) { return new Date(date.seconds * 1000).toLocaleString('pt-BR'); }
    return 'Data inválida';
  };

  return (
    <div ref={ref} style={styles.page}>
      <header style={styles.header}>
        <img src="/logo-eco-solucoes.png" alt="Logo Eco Soluções" style={styles.ecoLogo} />
        <div style={styles.headerText}>
          <h1 style={styles.reportTitle}>Relatório de Visita Técnica</h1>
          <h2 style={styles.clientName}>{relatorio.nomeEmpresa}</h2>
        </div>
        {relatorio.logoEmpresaUrl && <img src={relatorio.logoEmpresaUrl} alt="Logo da Empresa" style={styles.clientLogo} crossOrigin="anonymous" />}
      </header>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Dados da Visita</h2>
        <div style={styles.field}><span style={styles.label}>Local:</span> {relatorio.nomeLocal}</div>
        <div style={styles.field}><span style={styles.label}>Data da Visita:</span> {formatDate(relatorio.createdAt)}</div>
        <div style={styles.field}><span style={styles.label}>Técnico Responsável:</span> {relatorio.tecnicoNome}</div>
        <div style={styles.field}><span style={styles.label}>Tipo de Empreendimento:</span> {relatorio.tipoEmpreendimento}</div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>1. Área de Armazenamento de Gás</h2>
        <div style={styles.field}><span style={styles.label}>Tipo de Instalação:</span> {relatorio.tipoInstalacao}</div>
        <div style={styles.field}><span style={styles.label}>Avaliação da Área:</span> {relatorio.avaliacaoArmazenamento}</div>
        <div style={styles.field}><span style={styles.label}>Observações:</span> {relatorio.obsArmazenamento || 'N/A'}</div>
        <div style={styles.imageGrid}>
          {relatorio.fotosArmazenamentoUrls?.map((url, index) => (
            <img key={index} src={url} alt={`Foto Armazenamento ${index + 1}`} style={styles.image} crossOrigin="anonymous"/>
          ))}
        </div>
      </section>
      
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>2. Infraestrutura da Linha de Gás</h2>
        <div style={styles.field}><span style={styles.label}>Tipo de Tubulação:</span> {relatorio.tipoTubulacao}</div>
        <div style={styles.field}><span style={styles.label}>Reguladores e Validades:</span> {relatorio.reguladoresPrincipais}</div>
        <div style={styles.field}><span style={styles.label}>Pressão da Linha:</span> {relatorio.pressaoLinha}</div>
        <div style={styles.field}><span style={styles.label}>Distância Média:</span> {relatorio.distanciaMedia} metros</div>
        <div style={styles.field}><span style={styles.label}>Avaliação da Infra.:</span> {relatorio.avaliacaoInfra}</div>
        <div style={styles.imageGrid}>
          {relatorio.fotosInfraUrls?.map((url, index) => (
            <img key={index} src={url} alt={`Foto Infraestrutura ${index + 1}`} style={styles.image} crossOrigin="anonymous"/>
          ))}
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>3. Equipamentos</h2>
        {relatorio.equipamentos?.map((eq, index) => (
          <div key={index} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px', marginBottom: '10px', pageBreakInside: 'avoid' }}>
            <h4>Equipamento #{index + 1}: {eq.tipo === 'outro' ? eq.outroTipo : eq.tipo}</h4>
            <div style={styles.field}><span style={styles.label}>Avaliação das Mangueiras:</span> {eq.avaliacaoMangueiras}</div>
            <div style={styles.field}><span style={styles.label}>Avaliação Geral:</span> {eq.avaliacaoGeral}</div>
            <div style={styles.imageGrid}>
                {eq.fotosUrls?.map((url, imgIndex) => (
                    <img key={imgIndex} src={url} alt={`Foto Equip. ${index + 1}-${imgIndex + 1}`} style={styles.image} crossOrigin="anonymous"/>
                ))}
            </div>
          </div>
        ))}
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>4. Teste de Estanqueidade</h2>
        <div style={styles.field}><span style={styles.label}>Resultado:</span> {relatorio.resultadoEstanqueidade}</div>
        <div style={styles.imageGrid}>
          {relatorio.fotosEstanqueidadeUrls?.map((url, index) => (
            <img key={index} src={url} alt={`Foto Estanqueidade ${index + 1}`} style={styles.image} crossOrigin="anonymous"/>
          ))}
        </div>
      </section>
    </div>
  );
});

RelatorioTemplate.displayName = 'RelatorioTemplate';
export default RelatorioTemplate;