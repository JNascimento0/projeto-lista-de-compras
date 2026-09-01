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
        <div className="logo">
          <svg
            className="logo-icon"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="9" cy="20" r="1" />
            <circle cx="19" cy="20" r="1" />
            <path d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 7H6" />
          </svg>

          <span>Meu Mercado</span>
        </div>
        
        {/* Menu de Navegação */}
        <nav className="nav-menu">
          <button 
            className={paginaAtual === 'compras' ? 'active' : ''} 
            onClick={() => setPaginaAtual('compras')}
          >
            <svg
              className="nav-icon"
              viewBox="0 0 24 24"
              width="17"
              height="17"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="9" cy="20" r="1" />
              <circle cx="19" cy="20" r="1" />
              <path d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 7H6" />
            </svg>

            Nova Compra
          </button>

          <button 
            className={paginaAtual === 'historico' ? 'active' : ''} 
            onClick={() => setPaginaAtual('historico')}
          >
            <svg
              className="nav-icon"
              viewBox="0 0 24 24"
              width="17"
              height="17"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="5" cy="5" r="1" />
              <circle cx="5" cy="12" r="1" />
              <circle cx="5" cy="19" r="1" />

              <path d="M9 5h7.5a2 2 0 0 1 2 2v1" />
              <path d="M9 12h8a2 2 0 0 1 2 2v1" />
              <path d="M9 19h7.5a2 2 0 0 0 2-2v-1" />
              <path d="M9 18h6c1.7 0 2.5-.8 2.5-2" />
            </svg>

            Histórico
          </button>

          <button 
            className={paginaAtual === 'comparador' ? 'active' : ''} 
            onClick={() => setPaginaAtual('comparador')}
          >
            <svg
              className="nav-icon"
              viewBox="0 0 24 24"
              width="17"
              height="17"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {/* arcos */}
              <path d="M7.2 6.8A7 7 0 0 1 18 11" />
              <path d="M16.8 17.2A7 7 0 0 1 6 13" />

              {/* símbolo superior esquerdo */}
              <path d="M6 3.8v4.4" />
              <path d="M3.8 6h4.4" />
              <circle cx="6" cy="6" r="0.55" fill="#0f1e19" stroke="none" />

              {/* símbolo inferior direito */}
              <path d="M18 15.8v4.4" />
              <path d="M15.8 18h4.4" />
              <circle cx="18" cy="18" r="0.55" fill="#0f1e19" stroke="none" />
            </svg>

            Comparar Preços
          </button>

          <button 
            className={paginaAtual === 'relatorios' ? 'active' : ''} 
            onClick={() => setPaginaAtual('relatorios')}
          >
            <svg
              className="nav-icon"
              viewBox="0 0 24 24"
              width="17"
              height="17"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {/* Barra esquerda */}
              <path d="M5 18V13.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V18" />

              {/* Barra central */}
              <path d="M10 18V6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12" />

              {/* Barra direita */}
              <path d="M15 18V10a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8" />

              {/* Base */}
              <path d="M3 19h18" />
            </svg>

            Relatórios
          </button>
          
          {/* EXCLUSIVO DO ADM */}
          {userRole === 'admin' && (
            <button 
              className={`btn-admin ${paginaAtual === 'cadastros' ? 'active' : ''}`} 
              onClick={() => setPaginaAtual('cadastros')}
            >
              <svg
                className="nav-icon"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9.59 3.94A1.13 1.13 0 0 1 10.7 3h2.6c.55 0 1.02.4 1.11.94l.21 1.28c.06.37.31.69.64.87l.22.13c.33.2.72.26 1.08.12l1.22-.45a1.12 1.12 0 0 1 1.37.49l1.29 2.24c.28.48.17 1.08-.26 1.43l-1 .83c-.29.24-.44.61-.43.99v.26c-.01.38.14.75.43.99l1 .83c.43.35.54.95.26 1.43l-1.29 2.24a1.12 1.12 0 0 1-1.37.49l-1.22-.45c-.36-.14-.75-.08-1.08.12l-.22.13c-.33.18-.58.5-.64.87l-.21 1.28c-.09.54-.56.94-1.11.94h-2.6c-.55 0-1.02-.4-1.11-.94l-.21-1.28c-.06-.37-.31-.69-.64-.87l-.22-.13c-.33-.2-.72-.26-1.08-.12l-1.22.45a1.12 1.12 0 0 1-1.37-.49l-1.29-2.24a1.12 1.12 0 0 1 .26-1.43l1-.83c.29-.24.44-.61.43-.99v-.26c.01-.38-.14-.75-.43-.99l-1-.83a1.12 1.12 0 0 1-.26-1.43l1.29-2.24a1.12 1.12 0 0 1 1.37-.49l1.22.45c.36.14.75.08 1.08-.12l.22-.13c.33-.18.58-.5.64-.87l.21-1.28Z" />

                <circle cx="12" cy="12" r="3" />
              </svg>

              <span className="btn-admin-text">
                <span>Cadastrar</span>
                <span>Produtos/Marcas</span>
              </span>
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