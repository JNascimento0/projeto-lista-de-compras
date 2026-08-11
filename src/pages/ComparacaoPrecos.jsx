import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";
import "../styles/ComparacaoPrecos.css";

export default function ComparacaoPrecos() {
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [historicoPrecos, setHistoricoPrecos] = useState([]);
  const [loading, setLoading] = useState(false);

  const pesquisarProduto = async (e) => {
    e.preventDefault();
    if (!termoPesquisa.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('itens_compra')
        .select(`
          preco_unitario,
          quantidade,
          descricao_produto,
          marca_produto,
          compras ( data_compra )
        `) 
        .ilike('descricao_produto', `%${termoPesquisa}%`);

      if (error) throw error;

      const formatados = (data || []).map(item => ({
        produto: item?.descricao_produto,
        marca: item?.marca_produto || 'Sem marca',
        preco: item?.preco_unitario,
        quantidade: item?.quantidade,
        data: item?.compras?.data_compra || 'Sem data'
      }));
      
      formatados.sort((a, b) => new Date(b.data) - new Date(a.data));

      setHistoricoPrecos(formatados);
    } catch (error) {
      console.error('Erro ao comparar preços:', error.message);
      alert('Erro ao buscar histórico de preços.');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataStr) => {
    if (!dataStr || dataStr === 'Sem data') return dataStr;
    const partes = dataStr.split('-');
    if (partes.length !== 3) return dataStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  return (
    <div className="app-container">
      <div className="comparador-card">
        <h2 className="comparador-title">🔍 Comparador de Preços</h2>

        <form onSubmit={pesquisarProduto} className="form-pesquisa">
          <input 
            type="text"
            placeholder="Ex: Arroz, Feijão, Leite..."
            value={termoPesquisa}
            onChange={(e) => setTermoPesquisa(e.target.value)}
            className="input-pesquisa" 
          />
          <button type="submit" className="btn-pesquisar">Buscar</button>
        </form>

        {loading ? (
          <p className="center-text">Analisando histórico do banco...</p>
        ) : historicoPrecos.length === 0 ? (
          <p className="center-text">Pesquise um produto para ver a evolução de preços.</p>
        ) : (
          <div className="lista-historico">
            <div className="alerta-variacao">
              Último preço registrado: <strong>R$ {Number(historicoPrecos[0].preco).toFixed(2)}</strong>
            </div>

            {historicoPrecos.map((item, index) => (
              <div key={index} className="historico-item">
                <div>
                  <div className="nome-produto">
                    {item.produto} <span className="marca-produto">({item.marca})</span>
                  </div>
                  <div className="data-produto">📅 {formatarData(item.data)} (Qtd: {item.quantidade})</div>
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