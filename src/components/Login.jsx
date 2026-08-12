import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import '../styles/Login.css';
import { APP_CONFIG } from '../config';

export default function Login({ onLoginSucesso }) {
  const [modoCadastro, setModoCadastro] = useState(false);
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  // Função para limpar todos os campos do formulário
  const limparCampos = () => {
    setEmail('');
    setNome('');
    setSenha('');
  };

  // Tradução de erros do Supabase
  const traduzirErro = (mensagemErro = '') => {
    const msg = mensagemErro.toLowerCase();

    if (msg.includes('invalid login credentials')) {
      return 'E-mail ou senha incorretos.';
    }
    if (msg.includes('user already registered')) {
      return 'Este e-mail já está cadastrado no sistema.';
    }
    if (msg.includes('password should be at least')) {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Por favor, confirme seu e-mail antes de acessar.';
    }
    
    return mensagemErro || 'Ocorreu um erro. Tente novamente.';
  };
    
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      if (modoCadastro) {
        // 1. Cria a conta no Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: senha,
          options: {
            data: {
              nome: nome,
            }
          }
        });
        if (error) throw error;

        // 2. Insere na tabela 'profiles'
        if (data?.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              nome: nome,
              email: email,
            });

          if (profileError) throw profileError;
        }

        setMensagem({
          tipo: 'sucesso',
          texto: 'Conta criada! Verifique seu e-mail para confirmar.'
        });

        // Limpa os dados digitados após cadastrar com sucesso
        limparCampos();
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError || !profile) {
          await supabase.auth.signOut();
          throw new Eerror('profile_not_found');
        }

        onLoginSucesso(data.user, profile);
      }
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: traduzirErro(error.message) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <video autoPlay loop muted playsInline className="bg-video">
        <source src="/videos/supermarket2.mp4" type="video/mp4" />
        Seu navegador não suporta vídeos.
      </video>

      <div className="bg-overlay"></div>

      <div className="login-card-glass">
        <div className="login-header">
          <div className="logo-badge">🛒</div>
          <h2>{modoCadastro ? 'Criar Nova Conta' : 'Gestão de Compras'}</h2>
          <p>{modoCadastro ? 'Preencha os dados abaixo' : 'Acesse com seu e-mail e senha'}</p>
        </div>

        {mensagem.texto && (
          <div className={`alert-badge ${mensagem.tipo}`}>
            {mensagem.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {modoCadastro && (
            <div className="input-field">
              <label htmlFor="nome">Nome Completo</label>
              <input
                id="nome"
                type="text"
                placeholder="Seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
          )}
          
          <div className="input-field">
            <label htmlFor="email">E-mail</label>
            <input 
              id="email"
              type="email" 
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-field">
            <div className="label-header">
              <label htmlFor="senha">Senha</label>
            </div>
            
            <div className="password-input-wrapper">
              <input 
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="btn-toggle-eye"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
              </button>
            </div>
            {!modoCadastro && (
              <button 
                type="button" 
                className="btn-forgot-below"
                onClick={() => alert('Função de recuperar senha')}
              >
                Esqueceu sua senha?
              </button>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading 
              ? (modoCadastro ? 'Criando conta...' : 'Entrando...') 
              : (modoCadastro ? 'Cadastrar' : 'Entrar no Sistema')}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {modoCadastro ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}
            <button 
              type="button" 
              className="btn-toggle"
              onClick={() => {
                setModoCadastro(!modoCadastro);
                setMensagem({ tipo: '', texto: '' });
                limparCampos(); // Limpa os campos ao alternar entre Login e Cadastro
              }}
            >
              {modoCadastro ? 'Fazer Login' : 'Cadastre-se'}
            </button>
          </p>

          <footer className="app-footer">
            <span>v{APP_CONFIG.version}</span>
            <span>•</span>
            <span>
              Desenvolvido por{" "}
              <strong>{APP_CONFIG.developer}</strong>
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}
