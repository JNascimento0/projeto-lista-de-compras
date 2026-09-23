import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import '../styles/Historico.css';
import {
  CalendarIcon,
  CalendarCheckIcon,
  StoreIcon,
  ChevronIcon,
} from '../components/icons';

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
          <CalendarIcon />
        </span>

        <span>Histórico</span>
      </h2>
      {mercados.length === 0 ? (
        <div className="historico-estado historico-vazio">
          <CalendarIcon size={36} />

          <strong>Nenhuma compra registrada</strong>
          <span>Suas compras aparecerão aqui depois de serem finalizadas.</span>
        </div>
      ) : (
        <div className="accordion-list">
          {mercados.map((mercado) => (
            <div key={mercado} className="accordion-item nivel-1">
              {/* NÍVEL 1: Estabelecimento */}
              <button
                type="button"
                className="accordion-header mercado-header"
                onClick={() => toggleEstabelecimento(mercado)}
                aria-expanded={estabelecimentoAberto === mercado}
              >
                <span className="mercado-header-info">
                  <StoreIcon />

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
                          <CalendarCheckIcon />
                          <span>
                            {new Date(compra.data_compra).toLocaleDateString('pt-BR', {
                              timeZone: 'UTC',
                            })}
                          </span>
                        </span>
                        <strong className="data-header-total">
                          <span>{formatarMoeda(compra.valor_total)}</span>

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
                                  <td data-label="Preço Un.">{formatarMoeda(item.preco_unitario)}</td>
                                  <td data-label="Total">{formatarMoeda(item.preco_total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                          
                          <div className="resumo-compra">
                            <strong>Total desta compra: {formatarMoeda(compra.valor_total)}</strong>
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