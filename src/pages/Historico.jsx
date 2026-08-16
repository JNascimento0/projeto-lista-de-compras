import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import '../styles/Historico.css';

export default function Historico() {
  const [comprasAgrupadas, setComprasAgrupadas] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [estabelecimentoAberto, setEstabelecimentoAberto] = useState(null);
  const [compraAberta, setCompraAberta] = useState(null);

  const formatarQuantidade = (qtd) => {
    const numero = Number(qtd);
    if (isNaN(numero)) return { valor: qtd, unidade: ''};

    if (numero % 1 === 0) {
      return { valor: qtd, unidade: 'Un'};
    }

    return { valor: qtd, unidade: 'Kg'};
  };

  useEffect(() => {
    buscarHistorico();
  }, []);

  const buscarHistorico = async () => {
    setCarregando(true);
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
    return <div className="historico-container"><p>Carregando histórico...</p></div>
  }

  const mercados = Object.keys(comprasAgrupadas);

  return (
    <div className="historico-container">
      <h2>📜 Histórico</h2>
      {mercados.length === 0 ? (
        <p>Nenhuma compra registrada até o momento.</p>
      ) : (
        <div className="accordion-list">
          {mercados.map((mercado) => (
            <div key={mercado} className="accordion-item nivel-1">
              {/* NÍVEL 1: Estabelecimento */}
              <button
                className="accordion-header mercado-header"
                onClick={() => toggleEstabelecimento(mercado)}
              >
                <span>🏢 {mercado}</span>
                <span>{estabelecimentoAberto === mercado ? '▲' : '▼'}</span>
              </button>
              {estabelecimentoAberto === mercado && (
                <div className="accordion-body">
                  {comprasAgrupadas[mercado].map((compra) => (
                    <div key={compra.id} className="accordion-item nivel-2">
                      {/* NÍVEL 2: Data da Compra */}
                      <button
                        className="accordion-header data-header"
                        onClick={() => toggleCompra(compra.id)}
                      >
                        <span>📅 {new Date(compra.data_compra).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                        <strong>R$ {Number(compra.valor_total).toFixed(2)} {compraAberta === compra.id ? '▲' : '▼'}</strong>
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
                                  <td>{item.descricao_produto}</td>
                                  <td>{item.marca_produto}</td>
                                  <td>
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
                                  <td>R$ {Number(item.preco_unitario).toFixed(2)}</td>
                                  <td>R$ {Number(item.preco_total).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                          
                          <div className="resumo-compra">
                            <strong>Total desta compra: R$ {Number(compra.valor_total).toFixed(2)}</strong>
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