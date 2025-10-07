import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
// CORREÇÃO: Importando 'auth' e 'db' do arquivo de configuração central
import { auth, db } from '../firebase-config.js'; 
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter(); 
  
  // Função para lidar com o login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Lê o perfil do usuário do Firestore
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userRole = docSnap.data().role;
        const userName = docSnap.data().name;

        // Redireciona com base no perfil do usuário, passando o nome na URL
        if (userRole === "super-admin") {
          router.push({ pathname: '/dashboard-super-admin', query: { name: userName } });
        } else if (userRole === "admin") {
          router.push({ pathname: '/dashboard-admin', query: { name: userName } });
        } else if (userRole === "tecnico") {
          router.push({ pathname: '/dashboard-tecnico', query: { name: userName } });
        } else {
          setError("Perfil de usuário não reconhecido.");
        }
      } else {
        setError("Perfil de usuário não encontrado no banco de dados.");
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('Email ou senha inválidos.');
      } else {
        setError('Ocorreu um erro. Tente novamente mais tarde.');
      }
    }
  };
  
  // Função para lidar com o "Esqueceu a senha?"
  const handleResetPassword = async () => {
    if (!email) {
      alert('Por favor, insira seu email para recuperar a senha.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert('Um email para redefinição de senha foi enviado para o seu endereço.');
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao enviar o email. Por favor, verifique se o email está correto.');
    }
  };

  return (
    <>
      <Head>
        <title>ECO SOLUÇÕES - Login</title>
        <meta name="description" content="PWA de gestão da ECO SOLUÇÕES" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container">
        <header>
          <img src="/logo-eco-solucoes.png" alt="Logo ECO SOLUÇÕES" className="logo" />
        </header>

        <main className="login-box">
          <h2>Conecte-se</h2>
          <form className="login-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="email">E-mail</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="input-group password-group">
              <label htmlFor="password">Senha</label>
              <input 
                type={showPassword ? 'text' : 'password'}
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? '👁️' : '🔒'}
              </span>
            </div>
            {error && <p className="error-message">{error}</p>}
            <a href="#" className="forgot-password" onClick={handleResetPassword}>Esqueceu a senha?</a>
            <button type="submit" className="login-button">Entrar</button>
          </form>
        </main>
      </div>

      <style jsx>{`
        /* ... seu CSS permanece o mesmo ... */
        .container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background-color: #f0f2f5;
          padding: 20px;
        }

        .logo {
          width: 150px;
          margin-bottom: 20px;
        }

        .login-box {
          background-color: #ffffff;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 400px;
          text-align: center;
        }

        h2 {
          margin-bottom: 20px;
          color: #333;
        }

        .input-group {
          text-align: left;
          margin-bottom: 15px;
        }

        .input-group label {
          display: block;
          margin-bottom: 5px;
          color: #555;
        }

        .input-group input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
          font-size: 16px;
        }

        .password-group {
          position: relative;
        }
        
        .password-toggle-icon {
          position: absolute;
          right: 10px;
          top: 65%;
          transform: translateY(-50%);
          cursor: pointer;
          font-size: 1.2rem;
        }
        
        .error-message {
          color: #e74c3c;
          margin-bottom: 15px;
          font-weight: bold;
        }

        .forgot-password {
          display: block;
          text-align: right;
          margin-bottom: 20px;
          color: #0070f3;
          text-decoration: none;
        }

        .login-button {
          width: 100%;
          padding: 12px;
          background-color: #0070f3;
          color: #fff;
          border: none;
          border-radius: 5px;
          font-size: 18px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .login-button:hover {
          background-color: #005bb5;
        }
      `}</style>
    </>
  );
}