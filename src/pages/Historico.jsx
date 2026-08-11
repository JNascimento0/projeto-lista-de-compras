import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import '../styles/Historico.css';

export default function Historico() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compraSelecionada, setCompraSelecionada] = useState(null);
  const [itensCompra, setItensCompra] = useState([]);
  const [loadingItens, setLoadingItens] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');

  useEffect(() => {
    buscarHistorico();
  }, []);

  const buscarHistorico = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('compras')
        .select('*')
        .order('data_compra', { ascending: false });

      if (error) throw error;
      setCompras(data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error.message);
      alert('Erro ao carregar histórico: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filtrarPorCategoria = async (categoriaSelecionada) => {
    setCategoriaFiltro(categoriaSelecionada);

    if (!categoriaSelecionada) {
      buscarHistorico();
      return;
    }

    setLoading(true);
    try {
      const { data: itensFiltrados, error: erroItens } = await supabase
        .from('itens_compra')
        .select('id_compra')
        .eq('categoria', categoriaSelecionada);
      if (erroItens) throw erroItens;

      const idsCompras = [...new Set(itensFiltrados.map(item => item.id_compra))];

      if (idsCompras.length === 0) {
        setCompras([]);
        setLoading(false);
        return;
      }

      const { data: comprasFiltradas, error: erroCompras } = await supabase
        .from('compras')
        .select('*')
        .in('id', idsCompras)
        .order('data_compra', { ascending: false });
      
      if (erroCompras) throw erroCompras;
      setCompras(comprasFiltradas || []);

    } catch (error) {
      console.error('Erro ao filtrar:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const verDetalhesCompra = async (compra) => {
    setCompraSelecionada(compra);
    setLoadingItens(true);
    try {
      const { data, error } = await supabase
        .from('itens_compra')
        .select('*')
        .eq('id_compra', compra.id);

      if (error) throw error;
      setItensCompra(data || []);
    } catch (error) {
      console.error('Erro ao buscar itens:', error.message);
      alert('Erro ao carregar itens da compra.');
    } finally {
      setLoadingItens(false);
    }
  };

  const formatarData = (dataStr) => {
    if (!dataStr) return '';
    const partes = dataStr.split('-');
    if (partes.length !== 3) return dataStr;
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="app-container">
      <div className="historico-card">
        <h2 className="historico-title">📋 Histórico de Compras</h2>
        
        <div className="filtro-group">
          <label className="filtro-label">
            Filtrar histórico por Categoria:
          </label>
          <select
            value={categoriaFiltro}
            onChange={(e) => filtrarPorCategoria(e.target.value)}
            className="filtro-select"
          >
            <option value="">Visualizar Todas as Compras</option>
            <option value="Mercearia">Mercearia</option>
            <option value="Açougue">Açougue</option>
            <option value="Hortifruti (Feira)">Hortifruti (Feira)</option>
            <option value="Laticínios">Laticínios</option>
            <option value="Perecíveis">Perecíveis</option>
            <option value="Limpeza">Limpeza</option>
            <option value="Higiene">Higiene</option>
            <option value="Bebidas">Bebidas</option>
            <option value="Padaria">Padaria</option>
            <option value="Outros">Outros</option>
          </select>
        </div>

        {loading ? (
          <p className="center-text">Carregando compras do banco...</p>
        ) : compras.length === 0 ? (
          <p className="center-text">Nenhuma compra encontrada no histórico.</p>
        ) : (
          <div className="lista-compras">
            {compras.map((compra) => (
              <div 
                key={compra.id} 
                onClick={() => verDetalhesCompra(compra)}
                className={`compra-item ${compraSelecionada?.id === compra.id ? 'selecionada' : ''}`}
              >
                <div>
                  <div className="compra-data">📅 {formatarData(compra.data_compra)}</div>
                  <div className="compra-id">Cód. Registro: #{compra.id}</div>
                </div>
                <div className="compra-total">
                  R$ {compra.valor_total ? Number(compra.valor_total).toFixed(2) : '0.00'}
                </div>
              </div>
            ))}
          </div>
        )}

        {compraSelecionada && (
          <div className="detalhes-container">
            <div className="detalhes-header">
              <h3 className="section-title">🛒 Itens da Compra ({formatarData(compraSelecionada.data_compra)})</h3>
              <button onClick={() => setCompraSelecionada(null)} className="btn-fechar">Fechar</button>
            </div>

            {loadingItens ? (
              <p className="center-text">Buscando produtos do carrinho...</p>
            ) : (
              <div className="list-container">
                {itensCompra.map((item) => (
                  <div key={item.id} className="list-item">
                    <div className="list-item-left">
                      <span className="item-qty">{item.quantidade ? Number(item.quantidade) : 0}x</span>
                      <div>
                        <div className="item-name">{item.descricao_produto}</div>
                        <div className="item-category">{item.categoria || 'Geral'}</div>
                        <div className="item-price-unit">
                          Un: R$ {item.preco_unitario ? Number(item.preco_unitario).toFixed(2) : '0.00'}
                        </div>
                      </div>
                    </div>
                    <div className="item-price-total">
                      R$ {item.preco_total ? Number(item.preco_total).toFixed(2) : '0.00'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}