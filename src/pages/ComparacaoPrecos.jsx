import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import "../styles/ComparacaoPrecos.css";

export default function ComparacaoPrecos() {
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [historicoPrecos, setHistoricoPrecos] = useState([]);
  const [sugestoes, setSugestoes] = useState([]);
  const [produtosFrequentes, setProdutosFrequentes] = useState([]);
  const [loading, setLoading] = useState(false);

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

      /*
      const { data } = await supabase
        .from('itens_compra')
        .select('descricao_produto')
        .ilike('descricao_produto', `%${termoPesquisa}`)
        .limit(5)

      if (data) {
        const nomesUnicos = [...new Set(data.map(item => item.descricao_produto))];
        setSugestoes(nomesUnicos);
      }
        */
    };

    const timer = setTimeout(buscarSugestoes, 300);
    return () => clearTimeout(timer);
  }, [termoPesquisa]);

  const executarBusca = async (termo) => {
    const termoLimpo = termo ? termo.trim() : '';
    if (!termoLimpo) return;

    setLoading(true);
    setSugestoes([]);
    setTermoPesquisa(termoLimpo);

    try {
      const { data, error } = await supabase
        .from('itens_compra')
        .select(`
          preco_unitario,
          quantidade,
          descricao_produto,
          marca_produto,
          compras ( data_compra, nome_estabelecimento )
          `)
          .ilike('descricao_produto', `%${termoLimpo}%`);

      if (error) throw error;

      console.log("Dados retornados do banco de dados:", data);

      const formatados = (data || []).map(item => ({
        produto: item?.descricao_produto,
        marca: item?.marca_produto || 'Sem marca',
        preco: item?.preco_unitario,
        quantidade: item?.quantidade,
        establecimento: item?.compras?.nome_estabelecimento || 'Não informado',
        data: item?.compras?.data_compra || 'Sem data'
      }));

      formatados.sort((a, b) => new Date(b.data) - new Date(a.data));

      setHistoricoPrecos(formatados);
    } catch (error) {
      console.error('Erro ao compara preços:', error.message);
      alert('Erro ao buscar histórico de preços.');
    } finally {
      setLoading(false);
    }
  };

  const pesquisarProduto = (e) => {
    e.preventDefault();
    executarBusca(termoPesquisa);
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
    <div className="app-container">
      <div className="comparador-card">
        <h2 className="comparador-title">🔍 Comparador de Preços</h2>

        <form onSubmit={pesquisarProduto} className="form-pesquisa">
          <div className="input-container">          
            <input 
            type="text"
            placeholder="Ex: Arroz, Feijão, Leite..."
            value={termoPesquisa}
            onChange={(e) => setTermoPesquisa(e.target.value)}
            className="input-pesquisa" 
            />
            {sugestoes.length > 0 && (
              <ul className="autocomplete-dropdown">
                {sugestoes.map((sugesta, idx) => (
                  <li
                    key={idx}
                    onClick={() => executarBusca(sugesta)}
                    className="autocomplete-item"
                  >
                    {sugesta}
                  </li>
                ))}
              </ul>
            )}
          </div>
            <button type="submit" className="btn-pesquisar">Buscar</button>
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
          <p className="center-text">Analisando histórico do banco...</p>
        ) : historicoPrecos.length === 0 ? (
          <p className="center-text">Pesquise um produto para ver a evolução de preços.</p>
        ) : (
          <div className="lista-historico">
            <div className="metricas-resumo">
              <div className="metric-box menor">
                <span className="metric-title">Menor Preço</span>
                <span className="metric-value">R$ {menorPreco.toFixed(2)}</span>
              </div>
              <div className="metric-box maior">
                <span className="metric-title">Maior Preço</span>
                <span className="metric-value">R$ {maiorPreco.toFixed(2)}</span>
              </div>
            </div>

            {historicoPrecos.map((item, index) => (
              <div key={index} className="historico-item">
                <div>
                  <div className="nome-produto">
                    {item.produto} <span className="marca-produto">({item.marca})</span>
                  </div>
                  <div>
                    📅 {formatarData(item.data)} - {item.establecimento} (Qtd: {item.quantidade})
                  </div>               
                </div>
                <div className="preco-produto">
                  R$ {Number(item.preco).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}