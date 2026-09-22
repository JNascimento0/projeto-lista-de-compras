import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import '../styles/Historico.css';

const ChevronIcon = ({ aberto }) => (
  <svg
    className={`accordion-chevron ${
      aberto ? 'accordion-chevron--aberto' : ''
    }`}
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export default function Historico() {
  const [comprasAgrupadas, setComprasAgrupadas] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [estabelecimentoAberto, setEstabelecimentoAberto] = useState(null);
  const [compraAberta, setCompraAberta] = useState(null);
  const [erroCarregamento, setErroCarregamento] = useState('');

  const formatarQuantidade = (qtd) => {
    const numero = Number(qtd);
    if (isNaN(numero)) return { valor: qtd, unidade: ''};

    if (numero % 1 === 0) {
      return { valor: qtd, unidade: 'Un'};
    }

    return { valor: qtd, unidade: 'Kg'};
  };

  const formatarMoeda = (valor) => {
    return Number(valor).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  useEffect(() => {
    buscarHistorico();
  }, []);

  const buscarHistorico = async () => {
    setCarregando(true);
    setErroCarregamento('');

    try {
      const { data, error } = await supabase
        .from('compras')
        .select(`
          *,
          itens_compra (*)
          `)
        .order('data_compra', { ascending: false });

      if (error) throw error;

      const agrupado = (data || []).reduce((acc, compra) => {
        const nomeMercado = compra.nome_estabelecimento || "Estabelecimento Não Informado";

        if (!acc[nomeMercado]) {
          acc[nomeMercado] = [];
        }

        acc[nomeMercado].push(compra);
        return acc;
      }, {});

      setComprasAgrupadas(agrupado);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err.message);
      setErroCarregamento(
        'Não foi possível carregar o histórico. Tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  };

  const toggleEstabelecimento = (nomeMercado) => {
    setEstabelecimentoAberto(estabelecimentoAberto === nomeMercado ? null : nomeMercado);
    setCompraAberta(null);
  };

  const toggleCompra = (idCompra) => {
    setCompraAberta(compraAberta === idCompra ? null : idCompra);
  };

  if (carregando) {
    return (
      <div className="historico-container">
        <div className="historico-estado">
          <div className="historico-loading" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <p className="historico-loading-texto">
            Carregando histórico...
          </p>
        </div>
      </div>
    );
  }

  if (erroCarregamento) {
    return (
      <div className="historico-container">
        <div className="historico-erro">
          <strong>Não foi possível carregar o histórico</strong>
          <span>{erroCarregamento}</span>

          <button type="button" onClick={buscarHistorico}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const mercados = Object.keys(comprasAgrupadas);

  return (
    <div className="historico-container">
      <h2 className="historico-title">
        <span className="header-cart-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="28"
            height="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4" />
            <path d="M8 3v4" />
            <path d="M3 10h18" />
            <path d="M8 14h.01" />
            <path d="M12 14h.01" />
            <path d="M16 14h.01" />
            <path d="M8 18h.01" />
            <path d="M12 18h.01" />
          </svg>
        </span>

        <span>Histórico</span>
      </h2>
      {mercados.length === 0 ? (
        <div className="historico-estado historico-vazio">
          <svg
            viewBox="0 0 24 24"
            width="36"
            height="36"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4" />
            <path d="M8 3v4" />
            <path d="M3 10h18" />
          </svg>

          <strong>Nenhuma compra registrada</strong>
          <span>Suas compras aparecerão aqui depois de serem finalizadas.</span>
        </div>
      ) : (
        <div className="accordion-list">
          {mercados.map((mercado) => (
            <div key={mercado} className="accordion-item nivel-1">
              {/* NÍVEL 1: Estabelecimento */}
              <button
                type="button"                className="accordion-header mercado-header"
                onClick={() => toggleEstabelecimento(mercado)}
                aria-expanded={estabelecimentoAberto === mercado}
              >
                <span className="mercado-header-info">
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 9l2-5h14l2 5" />
                    <path d="M5 13v7h14v-7" />
                    <path d="M9 20v-6h6v6" />
                    <path d="M3 9a2 2 0 0 0 4 0" />
                    <path d="M7 9a2 2 0 0 0 4 0" />
                    <path d="M11 9a2 2 0 0 0 4 0" />
                    <path d="M15 9a2 2 0 0 0 4 0" />
                    <path d="M19 9a2 2 0 0 0 2 0" />
                  </svg>

                  <span className="mercado-nome">{mercado}</span>
                </span>
                <ChevronIcon aberto={estabelecimentoAberto === mercado} />
              </button>
              {estabelecimentoAberto === mercado && (
                <div className="accordion-body">
                  {comprasAgrupadas[mercado].map((compra) => (
                    <div key={compra.id} className="accordion-item nivel-2">
                      {/* NÍVEL 2: Data da Compra */}
                      <button
                        type="button"
                        className="accordion-header data-header"
                        onClick={() => toggleCompra(compra.id)}
                        aria-expanded={compraAberta === compra.id}
                      >
                        <span className="data-header-info">
                          <svg
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <rect x="3" y="4" width="18" height="17" rx="2" />
                            <path d="M8 2v4" />
                            <path d="M16 2v4" />
                            <path d="M3 9h18" />
                            <path d="m8 15 2 2 5-5" />
                          </svg>
                          <span>
                            {new Date(compra.data_compra).toLocaleDateString('pt-BR', {
                              timeZone: 'UTC',
                            })}
                          </span>
                        </span>
                        <strong className="data-header-total">
                          <span>R$ {formatarMoeda(compra.valor_total)}</span>

                          <ChevronIcon aberto={compraAberta === compra.id} />
                        </strong>
                      </button>

                      {/* NÍVEL 3: Itens da Compra */}
                      {compraAberta === compra.id && (
                        <div className="accordion-body itens-detalhes">
                        <div className="tabela-wrapper">
                          <table className="tabela-itens">
                            <thead>
                              <tr>
                                <th>Produto</th>
                                <th>Marca</th>
                                <th>Qtd</th>
                                <th>Preço Un.</th>
                                <th>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(compra.itens_compra || []).map((item) => (
                                <tr key={item.id}>
                                  <td data-label="Produto">{item.descricao_produto}</td>
                                  <td data-label="Marca">{item.marca_produto}</td>
                                  <td data-label="Quantidade">
                                    {(() => {
                                      const { valor, unidade } = formatarQuantidade(item.quantidade);
                                      return (
                                        <div className="coluna-qtd">
                                          <span>{valor}</span>
                                          <span className="unidade">{unidade}</span>
                                        </div>
                                      );
                                    })()}
                                  </td>
                                  <td data-label="Preço Un.">R$ {formatarMoeda(item.preco_unitario)}</td>
                                  <td data-label="Total">R$ {formatarMoeda(item.preco_total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                          
                          <div className="resumo-compra">
                            <strong>Total desta compra: R$ {formatarMoeda(compra.valor_total)}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}