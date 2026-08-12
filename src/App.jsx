import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./services/supabaseClient";
import Compra from './pages/Compra';
import Historico from "./pages/Historico";
import ComparacaoPrecos from "./pages/ComparacaoPrecos";
import Cadastros from './pages/Cadastros';
import Relatorios from "./pages/Relatorios";
import Login from "./components/Login";
import MeuPerfil from "./pages/MeuPerfil";
import "./styles/App.css";
import { APP_CONFIG } from "./config";

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [userRole, setUserRole] = useState('user'); // 'user' ou 'admin'
  const [loading, setLoading] = useState(true);
  const [paginaAtual, setPaginaAtual] = useState('compras');
  const [menuAberto, setMenuAberto] = useState(false);

  // 1. CORRIGIDO: useRef importado lá no topo
  const menuRef = useRef(null);

  useEffect(() => {
    checarSessao();
  }, []);

  // Fecha o menu dropdown ao clicar fora dele
  useEffect(() => {
    const fecharMenuFora = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAberto(false);
      }
    };
    document.addEventListener("mousedown", fecharMenuFora);
    return () => document.removeEventListener("mousedown", fecharMenuFora);
  }, []);

  const checarSessao = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUsuario(session.user);
      await carregarRole(session.user.id);
    }
    setLoading(false);
  };

  const carregarRole = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (data) setUserRole(data.role);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
    setUserRole('user');
  };

  // Função para pegar APENAS o primeiro nome do usuário
  const obterPrimeiroNome = () => {
    const nomeCompleto = usuario?.user_metadata?.nome || usuario?.email?.split('@')[0] || "Usuário";
    return nomeCompleto.trim().split(" ")[0];
  };

  // 2. CORRIGIDO: toUpperCarse() alterado para toUpperCase()
  const obterInicial = () => {
    const primeiroNome = obterPrimeiroNome();
    return primeiroNome.charAt(0).toUpperCase();
  };

  // Tela de carregamento enquanto verifica a sessão
  if (loading) {
    return <div className="loading-screen">Carregando...</div>;
  }

  // Se NÃO está logado: mostra a tela de login
  if (!usuario) {
    return (
      <Login
        onLoginSucesso={(user, profile) => {
          setUsuario(user);
          const roleString = typeof profile === 'object' && profile?.role ? profile.role : profile;
          setUserRole(roleString || 'user');
        }}
      />
    );
  }

  // Se está logado: exibe o sistema completo
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="logo">🛒 Meu Mercado</div>
        
        {/* Menu de Navegação */}
        <nav className="nav-menu">
          <button 
            className={paginaAtual === 'compras' ? 'active' : ''} 
            onClick={() => setPaginaAtual('compras')}
          >
            🛒 Nova Compra
          </button>

          <button 
            className={paginaAtual === 'historico' ? 'active' : ''} 
            onClick={() => setPaginaAtual('historico')}
          >
            📜 Histórico
          </button>

          <button 
            className={paginaAtual === 'comparador' ? 'active' : ''} 
            onClick={() => setPaginaAtual('comparador')}
          >
            🔍 Comparar Preços
          </button>

          <button 
            className={paginaAtual === 'relatorios' ? 'active' : ''} 
            onClick={() => setPaginaAtual('relatorios')}
          >
            📊 Relatórios
          </button>
          
          {/* EXCLUSIVO DO ADM */}
          {userRole === 'admin' && (
            <button 
              className={`btn-admin ${paginaAtual === 'cadastros' ? 'active' : ''}`} 
              onClick={() => setPaginaAtual('cadastros')}
            >
              ⚙️ Cadastrar Produtos/Marcas
            </button>
          )}
        </nav>

        {/* ÁREA DE IDENTIFICAÇÃO DO USUÁRIO (NOME + AVATAR + SETA) */}
        <div className="user-profile-wrapper" ref={menuRef}>
          <button className="user-profile-button" onClick={() => setMenuAberto(!menuAberto)}>
            {/* Foto ou Avatar com Inicial */}
            {usuario?.user_metadata?.avatar_url ? (
              <img src={usuario.user_metadata.avatar_url} alt="Foto de Perfil" className="avatar-img" />
            ) : (
              <div className="avatar-circle">{obterInicial()}</div>
            )}

            {/* Apenas o Primeiro Nome */}
            <span className="user-first-name">{obterPrimeiroNome()}</span>

            {/* Seta indicativa para Dropdown */}
            <span className={`dropdown-arrow ${menuAberto ? 'open' : ''}`}>▾</span>
          </button>

          {/* MENU DROPDOWN (Aparece ao Clicar) */}
          {menuAberto && (
            <div className="dropdown-menu">
              <div className="dropdown-user-details">
                <p className="full-name">{usuario?.user_metadata?.nome || "Usuário"}</p>
                <p className="user-email">{usuario?.email}</p>
                {userRole === 'admin' && <span className="badge-adm">ADMINISTRADOR</span>}
              </div>

              <hr className="dropdown-divider" />

              <button className="dropdown-item" onClick={() => { setPaginaAtual('perfil'); setMenuAberto(false); }}>
                👤 Editar Perfil / Foto
              </button>

              <button className="dropdown-item btn-sair" onClick={handleLogout}>
                🚪 Sair
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo das Páginas */}
      <main className="app-content">
        <div className="content-container">
          {paginaAtual === 'compras' && <Compra/>}
          {paginaAtual === 'historico' && <Historico/>}
          {paginaAtual === 'comparador' && <ComparacaoPrecos/>}
          {paginaAtual === 'relatorios' && <Relatorios/>}
          
          {/* Trava de segurança para tela de cadastros */}
          {paginaAtual === 'cadastros' && userRole === 'admin' && (
            <Cadastros/>
          )}

          {/* 3. CORRIGIDO: Fallback para quando 'perfil' estiver selecionado */}
          {paginaAtual === 'perfil' && <MeuPerfil/>}
        </div>
      </main>

      <footer className="app-footer">
        <span>v{APP_CONFIG.version}</span>
        <span>•</span>
        <span>
          Desenvolvido por{" "}
          <strong>{APP_CONFIG.developer}</strong>
        </span>
      </footer>
    </div>
  );
}
//export default App;