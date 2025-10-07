// /components/ChoicePanel.js
import styles from '../styles/ChoicePanel.module.css';

export default function ChoicePanel({ onSelect }) {
  return (
    <div className={styles.choiceContainer}>
      <img src="/logo-eco-solucoes.png" alt="Logo ECO SOLUÇÕES" className={styles.logo} />
      <h1 className={styles.title}>Selecione o Sistema</h1>
      <p className={styles.subtitle}>Escolha em qual painel você deseja operar.</p>
      <div className={styles.buttonGroup}>
        <button 
          className={styles.choiceButton} 
          onClick={() => onSelect('ECO GNV')}
        >
          ECO GNV
        </button>
        <button 
          className={styles.choiceButton} 
          onClick={() => onSelect('ECO GLP')}
        >
          ECO GLP
        </button>
      </div>
    </div>
  );
}