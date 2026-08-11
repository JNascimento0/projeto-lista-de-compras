import React, { useEffect, useState } from 'react';
// 🚀 IMPORTA A CONEXÃO COM O SUPABASE E O CSS DA SUA PASTA DE ESTILOS DEDICADA
import { supabase } from '../services/supabaseClient';
import '../styles/Compra.css'; 

export default function Compra() {
  const [dataCompra, setDataCompra] = useState('');
  const [categoria, setCategoria] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [precoUnitario, setPrecoUnitario] = useState(0);
  const [carrinho, setCarrinho] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [marcas, setMarcas] = useState([]);

  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [marcaSelecionada, setMarcaSelecionada] = useState('');

  useEffect(() => {
    const carregarDadosBase = async () => {
      const resProdutos = await supabase
        .from('produtos_base')
        .select('*')
        .order('nome', { ascending: true });
      if (resProdutos.data) setProdutos(resProdutos.data);
      
      const resMarcas = await supabase
        .from('marcas_base')
        .select('*')
        .order('nome', { ascending: true });
      if (resMarcas.data) setMarcas(resMarcas.data);
    };

    carregarDadosBase();
  }, []);

  const precoTotalItem = Math.round(quantidade * precoUnitario * 100) / 100;

  const adicionarItem = (e) => {
    e.preventDefault();

    if (!produtoSelecionado || !marcaSelecionada) {
      alert("Por favor, selecione o produto e a marca!");
      return;
    }

    const novoItem = {
      descricao: produtoSelecionado.nome,
      marca: marcaSelecionada,
      categoria,
      quantidade,
      precoUnitario,
      precoTotalItem
    };

    setCarrinho([...carrinho, novoItem]);

    // Limpeza dos campos
    setProdutoSelecionado(null);
    setMarcaSelecionada('');
    setCategoria('');
    setQuantidade(1);
    setPrecoUnitario(0);
  };

  const finalizarCompra = async () => {
    if (carrinho.length === 0) return;

    setSalvando(true);

    try {
      const { data: novaCompra, error: erroCompra } = await supabase
        .from('compras')
        .insert([
          {
            data_compra: dataCompra || new Date().toISOString().split('T')[0],
            valor_total: valorTotalCompra
          }
        ])
        .select();

      if (erroCompra) throw erroCompra;

      const idCompraGerado = novaCompra[0].id;

      const itensParaSalvar = carrinho.map(item => ({
        id_compra: idCompraGerado,
        descricao_produto: item.descricao,
        marca_produto: item.marca,
        categoria: item.categoria || 'Geral',
        quantidade: item.quantidade,
        preco_unitario: item.precoUnitario,
        preco_total: item.precoTotalItem
      }));

      const { error: erroItens } = await supabase
        .from('itens_compra')
        .insert(itensParaSalvar);

      if (erroItens) throw erroItens;

      alert("🛒 Compra salva com sucesso no Supabase!");
      setCarrinho([]); 
      setDataCompra('');

    } catch (error) {
      console.error("Erro ao salvar:", error.message);
      alert("Erro ao salvar a compra: " + error.message);
    } finally {
      setSalvando(false);
    }
  };

  const valorTotalCompra = carrinho.reduce((acc, item) => acc + item.precoTotalItem, 0);

  return (
    <div className="app-container">
      <div className="compra-card">
        <h2 className="compra-title">🛒 Lista de Compras <span className="compra-subtitle">| Mercado</span></h2>
        
        <div className="input-group">
          <label className="input-label">Data da Compra</label>
          <input 
            type="date" 
            value={dataCompra} 
            onChange={(e) => setDataCompra(e.target.value)} 
            className="compra-input"
          />
        </div>

        <form onSubmit={adicionarItem} className="compra-form">
          <h3 className="section-title">Adicionar Item</h3>
          
          {/* 1º: SELEÇÃO DO PRODUTO */}
          <div className="input-group">
            <label className="input-label">Produto:</label>
            <select 
              value={produtoSelecionado ? String(produtoSelecionado.id) : ""}
              onChange={(e) => {
                const valorTexto = e.target.value;
                const produtoEncontrado = produtos.find(p => String(p.id) === valorTexto);

                if (produtoEncontrado) {
                  setProdutoSelecionado(produtoEncontrado);
                  setCategoria(produtoEncontrado.categoria);
                } else {
                  setProdutoSelecionado(null);
                  setCategoria('');
                }
              }}
              className="compra-input"
            >
              <option value="">Selecione o produto...</option>
              {produtos.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.nome}</option>
              ))}
            </select>
          </div>

          {/* 2º: CAMPO CATEGORIA (PREENCHIMENTO AUTOMÁTICO) */}
          <div className="input-group">
            <label className="input-label">Categoria</label>
            <input 
              type="text"
              value={categoria} 
              placeholder="Selecione um produto..."
              readOnly
              className="compra-input readonly"
            />
          </div>

          {/* 3º: SELEÇÃO DA MARCA */}
          <div className="input-group">
            <label className="input-label">Marca:</label>
            <select
              value={marcaSelecionada}
              onChange={(e) => setMarcaSelecionada(e.target.value)}
              className="compra-input" 
            >
              <option value="">Selecione a marca...</option>
              {marcas.map((m) => (
                <option key={m.id} value={m.nome}>{m.nome}</option>
              ))}
            </select>
          </div>

          <div className="compra-row">
            <div className="input-group flex-1">
              <label className="input-label">Qtd. (Un ou Kg)</label>
              <input 
                type="number" 
                value={quantidade} 
                onChange={(e) => setQuantidade(Number(e.target.value))} 
                min="0.001"
                step="any"
                className="compra-input"
              />
            </div>
            <div className="input-group flex-1">
              <label className="input-label">Preço Unitário</label>
              <input 
                type="number" 
                step="0.01" 
                value={precoUnitario} 
                onChange={(e) => setPrecoUnitario(Number(e.target.value))} 
                placeholder="0,00"
                className="compra-input"
              />
            </div>
          </div>

          <div className="item-total-badge">
            <span>Subtotal do item:</span>
            <strong>R$ {precoTotalItem.toFixed(2)}</strong>
          </div>

          <button type="submit" className="button-action">
            Adicionar ao Carrinho
          </button>
        </form>

        <div className="carrinho-section">
          <h3 className="section-title">📋 Itens no Carrinho ({carrinho.length})</h3>
          
          {carrinho.length === 0 ? (
            <p className="empty-text">Nenhum item adicionado ainda.</p>
          ) : (
            <div className="list-container">
              {carrinho.map((item, index) => (
                <div key={index} className="list-item">
                  <div className="list-item-left">
                    <span className="item-qty">{item.quantidade}x</span>
                    <div>
                      <div className="item-name">
                        {item.descricao} <span className="item-brand">({item.marca})</span>
                      </div>
                      <div className="item-category">{item.categoria || 'Geral'}</div>
                    </div>
                  </div>
                  <div className="item-price">
                    R$ {item.precoTotalItem.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="total-footer">
          <span className="total-label">TOTAL DA COMPRA</span>
          <span className="total-value">R$ {valorTotalCompra.toFixed(2)}</span>
        </div>

        {carrinho.length > 0 && (
          <button 
            type="button"
            onClick={finalizarCompra} 
            disabled={salvando}
            className={`button-finalizar ${salvando ? 'salvando' : ''}`}
          >
            {salvando ? '💾 A guardar no Banco...' : '💾 Finalizar e Salvar Compra'}
          </button>
        )}
      </div>
    </div>
  );
}