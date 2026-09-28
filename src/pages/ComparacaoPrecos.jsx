import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import "../styles/ComparacaoPrecos.css";
import {
  PriceCompareIcon,
  CalendarCheckIcon,
} from "../components/icons";

export default function ComparacaoPrecos() {
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [historicoPrecos, setHistoricoPrecos] = useState([]);
  const [sugestoes, setSugestoes] = useState([]);
  const [produtosFrequentes, setProdutosFrequentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erroBusca, setErroBusca] = useState('');
  const [pesquisaRealizada, setPesquisaRealizada] = useState(false);
  const [indiceSugestaoAtiva, setIndiceSugestaoAtiva] = useState(-1);
  const [autocompleteAberto, setAutocompleteAberto] = useState(false);

  useEffect(() => {
    const carregarMaisBuscados = async () => {
      try {
        const { data, error } = await supabase
          .from('itens_compra')
          .select('descricao_produto');

        if (error) throw error;

        if (data) {
          const contagem = {};
          data.forEach(item => {
            const nome = item.descricao_produto?.trim();
            if (nome) {
              contagem[nome] = (contagem[nome] || 0) + 1;
            }
          });

          const topProdutos = Object.keys(contagem)
            .sort((a, b) => contagem[b] - contagem[a])
            .slice(0, 5);
          
          setProdutosFrequentes(topProdutos);
        }
      } catch (err) {
        console.error('Erro ao carregar produtos frequentes:', err);
      }
    };

    carregarMaisBuscados();
  }, []);

  useEffect(() => {
    const buscarSugestoes = async () => {
      const termoTratado = termoPesquisa.trim();

      if (termoTratado.length < 2) {
        setSugestoes([]);
        setAutocompleteAberto(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('itens_compra')
          .select('descricao_produto')
          .ilike('descricao_produto', `${termoTratado}%`)
          .limit(10);

          if (error) {
            console.error("Erro Banco de dados:", error);
            return;
          }

          if (data) {
            const nomesUnicos = [
              ...new Set(data.map((item) => item?.descricao_produto).filter(Boolean))
            ];
            setSugestoes(nomesUnicos);
          }
      } catch (err) {
        console.error("Erro ao buscar sugestões:", err.message);
      }
    };

    const timer = setTimeout(buscarSugestoes, 300);
    return () => clearTimeout(timer);
  }, [termoPesquisa]);

  const executarBusca = async (termo) => {
    const termoLimpo = termo ? termo.trim() : '';
    if (!termoLimpo) return;

    setLoading(true);
    setErroBusca('');
    setPesquisaRealizada(true);
    setSugestoes([]);
    setAutocompleteAberto(false);
    setIndiceSugestaoAtiva(-1);
    setTermoPesquisa(termoLimpo);

    try {
      const { data, error } = await supabase
        .from('itens_compra')
        .select(`
          id,
          preco_unitario,
          quantidade,
          descricao_produto,
          marca_produto,
          compras ( data_compra, nome_estabelecimento )
          `)
          .ilike('descricao_produto', `%${termoLimpo}%`);

      if (error) throw error;

      const formatados = (data || []).map(item => ({
        id: item.id,
        produto: item?.descricao_produto,
        marca: item?.marca_produto || 'Sem marca',
        preco: item?.preco_unitario,
        quantidade: item?.quantidade,
        estabelecimento: item?.compras?.nome_estabelecimento || 'Não informado',
        data: item?.compras?.data_compra || 'Sem data'
      }));

      formatados.sort((a, b) => new Date(b.data) - new Date(a.data));

      setHistoricoPrecos(formatados);
    } catch (error) {
      console.error('Erro ao comparar preços:', error.message);
      setHistoricoPrecos([]);
      setErroBusca(
        'Não foi possível buscar o histórico de preços. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const pesquisarProduto = (e) => {
    e.preventDefault();
    executarBusca(termoPesquisa);
  };

  const formatarMoeda = (valor) => {
    return Number(valor).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatarQuantidade = (qtd) => {
    const numero = Number(qtd);

    if (isNaN(numero)) {
      return String(qtd);
    }

    if (numero % 1 === 0) {
    return `${numero} Un`;
    }

    return `${numero.toLocaleString('pt-BR', {
    maximumFractionDigits: 3,
    })} Kg`;
  };

  

  const formatarData = (dataStr) => {
    if (!dataStr || dataStr === 'Sem data') return dataStr;
    const partes = dataStr.split('-');
    if (partes.length !== 3) return dataStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const precosValidos = historicoPrecos.map(item => Number(item.preco)).filter(p => !isNaN(p));
  const menorPreco = precosValidos.length ? Math.min(...precosValidos) : 0;
  const maiorPreco = precosValidos.length ? Math.max(...precosValidos) : 0;

  return (
    <div className="comparador-container">
      <div className="comparador-card">
        <h2 className="comparador-title">
          <PriceCompareIcon />
          <span>Comparador de Preços</span>
        </h2>

        <form onSubmit={pesquisarProduto} className="form-pesquisa">
          <div className="input-container">          
            <input 
            type="text"
            placeholder="Ex: Arroz, Feijão, Leite..."
            value={termoPesquisa}
            onChange={(e) => {
              setTermoPesquisa(e.target.value);
              setIndiceSugestaoAtiva(-1);
              setSugestoes([]);
              setAutocompleteAberto(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSugestoes([]);
                setIndiceSugestaoAtiva(-1);
                setAutocompleteAberto(false);
                return;
              }

              if (sugestoes.length === 0) return;

              if (e.key === 'ArrowDown') {
                e.preventDefault();

                setIndiceSugestaoAtiva((indiceAtual) =>
                  indiceAtual < sugestoes.length - 1
                    ? indiceAtual + 1
                    : 0
                );
              }

              if (e.key === 'ArrowUp') {
                e.preventDefault();

                setIndiceSugestaoAtiva((indiciAtual) =>
                  indiciAtual > 0
                    ? indiciAtual -1
                    : sugestoes.length -1
                );
              }

              if (e.key === 'Enter' && indiceSugestaoAtiva >= 0) {
                e.preventDefault();

                setAutocompleteAberto(false);
                executarBusca(sugestoes[indiceSugestaoAtiva]);
                setIndiceSugestaoAtiva(-1);
              }
            }}
            className="input-pesquisa"
            aria-label="Produto para comparar preços"
            autoComplete="off" 
            />
            {autocompleteAberto && sugestoes.length > 0 && (
              <ul className="autocomplete-dropdown">
                {sugestoes.map((sugestao, index) => (
                  <li key={sugestao} className="autocomplete-item">
                    <button
                      type="button"
                      className={
                        indiceSugestaoAtiva === index
                          ? 'autocomplete-item-ativo'
                          : '' 
                      }
                      onClick={() => {
                        setAutocompleteAberto(false);
                        executarBusca(sugestao);
                        setIndiceSugestaoAtiva(-1);
                      }}
                    >
                      {sugestao}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
              type="submit"
              className="btn-pesquisar"
              disabled={loading}
            >
              {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {produtosFrequentes.length > 0 && (
          <div className="atalhos-container">
            <span className="atalhos-label">Mais comprados:</span>
            {produtosFrequentes.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => executarBusca(String(item))}
                className="btn-atalho"
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="comparador-estado">
            <div className="comparador-loading" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <p>Analisando histórico de preços...</p>
          </div>
          ) : erroBusca ? (
          <div className="comparador-erro" role="alert">
            <strong>Não foi possível realizar a pesquisa</strong>

            <span>{erroBusca}</span>

            <button
              type="button"
              onClick={() => executarBusca(termoPesquisa)}
            >
              Tentar novamente
            </button>
          </div>
          ) : historicoPrecos.length === 0 ? (
            <div className="comparador-estado comparador-vazio">
              <strong>
                {pesquisaRealizada
                  ? 'Nenhum preço encontrado'
                  : 'Pesquise um produto'}
              </strong>

              <span>
                {pesquisaRealizada
                  ? 'Não encontramos compras registradas para esse produto.'
                  : 'Consulte o histórico para comparar os preços que você já pagou.'}
              </span>
            </div>
          ) : (
          <div className="lista-historico">
            <div className="metricas-resumo">
              <div className="metric-box menor">
                <span className="metric-title">Menor Preço</span>
                <span className="metric-value">{formatarMoeda(menorPreco)}</span>
              </div>
              <div className="metric-box maior">
                <span className="metric-title">Maior Preço</span>
                <span className="metric-value">{formatarMoeda(maiorPreco)}</span>
              </div>
            </div>

            {historicoPrecos.map((item) => (
              <div key={item.id} className="historico-item">
                <div>
                  <div className="nome-produto">
                    {item.produto} <span className="marca-produto">({item.marca})</span>
                  </div>
                  <div className="historico-meta">
                    <CalendarCheckIcon size={18} />
                    <span>
                      {formatarData(item.data)} - {item.estabelecimento} (Qtd: {formatarQuantidade(item.quantidade)})
                    </span>
                  </div>               
                </div>
                <div className="preco-produto">
                  {formatarMoeda(item.preco)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}