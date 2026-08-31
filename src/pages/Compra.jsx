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
  const [estabelecimentos, setEstabelecimentos] = useState([]);
  const [estabelecimentoSelecionado, setNovoEstabelecimentoSelecionado] = useState(null);

  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [marcaSelecionada, setMarcaSelecionada] = useState('');
  const [codigoBarra, setCodigoBarra] = useState('');
  const [modoManual, setModoManual] = useState(false);
  const [produtoNaoEncontrado, setProdutoNaoEncontrado] = useState(false);
  const [buscandoProduto, setBuscandoProduto] = useState(false);

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

      const resEstabelecimentos = await supabase
        .from('estabelecimentos_base')
        .select('*')
        .order('nome', { ascending: true });
      if (resEstabelecimentos.data) setEstabelecimentos(resEstabelecimentos.data);
    };

    carregarDadosBase();
  }, []);

  const precoTotalItem = Math.round(quantidade * precoUnitario * 100) / 100;

  const buscarProdutoPorCodigo = async () => {
    if (!codigoBarra.trim()) {
      alert("Digite ou informe um código de barras.");
      return;
    }

    setProdutoNaoEncontrado(false);
    setProdutoSelecionado(null);
    setCategoria('');
    setMarcaSelecionada('');

    const inicioBusca = Date.now();
    setBuscandoProduto(true);

    const { data, error } = await supabase
      .from('produtos_base')
      .select('*')
      .eq('codigo_barra', codigoBarra.trim());

    const tempoDecorrido = Date.now() - inicioBusca;
    const tempoRestante = Math.max(0, 600 - tempoDecorrido);

    await new Promise(resolve => setTimeout(resolve, tempoRestante));

    setBuscandoProduto(false);

    if (error) {
      console.error("Erro ao buscar produto", error);
      alert("Erro ao consultar o produto.");
      return;
    }

    if (data.length === 0) {
      setProdutoNaoEncontrado(true);
      return;
    }

    const produto = data[0];

    setProdutoSelecionado(produto);
    setCategoria(produto.categoria);


  };

  const sugerirCadastroProduto = async () => {
    if (!codigoBarra.trim()) {
      alert("Não há código de barras para sugerir.");
      return;
    }

    const { error } = await supabase
      .from('sugestoes_cadastro')
      .insert([
        {
          codigo_barra: codigoBarra.trim()
        }
      ]);

    if (error) {
      console.error("Erro ao enviar sugestão:", error);
      alert("Não foi possível enviar a sugestão.");
      return;
    }

    alert("Sugestão enviada com sucesso!");
  };

  const adicionarItem = (e) => {
    e.preventDefault();

    if (!produtoSelecionado || !marcaSelecionada) {
      alert("Por favor, selecione o produto e a marca!");
      return;
    }

    const novoItem = {
      idTemp: Date.now(), // ID temporário para identificar e manipular o item no carrinho
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

  // 🔄 ALTERAR QUANTIDADE NO CARRINHO
  const alterarQuantidadeCarrinho = (idTemp, novaQuantidade) => {
    if (novaQuantidade <= 0) return;

    setCarrinho(carrinhoAtuais =>
      carrinhoAtuais.map(item => {
        if (item.idTemp === idTemp) {
          const novaQtd = Number(novaQuantidade);
          const novoTotal = Math.round(novaQtd * item.precoUnitario * 100) / 100;
          return {
            ...item,
            quantidade: novaQtd,
            precoTotalItem: novoTotal
          };
        }
        return item;
      })
    );
  };

  // 🗑️ REMOVER ITEM DO CARRINHO
  const removerItemCarrinho = (idTemp) => {
    setCarrinho(carrinhoAtuais => carrinhoAtuais.filter(item => item.idTemp !== idTemp));
  };

  const finalizarCompra = async () => {
    if (carrinho.length === 0) return;

    if (!estabelecimentoSelecionado) {
      alert("Por favor, selecione o estabelecimento onde a compra será realizada!");
      return;
    }

    setSalvando(true);

    try {
      const { data: { user }, error: usuarioError } = await supabase.auth.getUser();

      if (usuarioError || !user) {
        throw new Error("Não foi possível identificar o usuário.");
      }

      const { data: novaCompra, error: erroCompra } = await supabase
        .from('compras')
        .insert([
          {
            user_id: user.id,
            data_compra: dataCompra || new Date().toISOString().split('T')[0],
            id_estabelecimento: estabelecimentoSelecionado ? estabelecimentoSelecionado.id : null,
            nome_estabelecimento: estabelecimentoSelecionado ? estabelecimentoSelecionado.nome : null,
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

      alert("🛒 Compra salva com sucesso no Banco de dados!");
      setCarrinho([]); 
      setDataCompra('');
      setNovoEstabelecimentoSelecionado(null);
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
        <h2 className='compra-title'>
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
              <circle cx="9" cy="20" r="1" />
              <circle cx="19" cy="20" r="1" />
              <path d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 7H6" />
            </svg>
          </span>
          Lista de compras
          <span className='compra-subtitle'> | Mercado</span>
        </h2>

        {/* SELEÇÃO DE DATA E ESTABELECIMENTO */}
        <div className="compra-row">
          <div className="input-group flex-1">
            <label className="input-label">Data da Compra</label>
            <input 
              type="date" 
              value={dataCompra} 
              onChange={(e) => setDataCompra(e.target.value)} 
              className="compra-input"
            />
          </div>

          <div className="input-group flex-1">
            <label className="input-label">Estabelecimento (Mercado)</label>
            <select
              value={estabelecimentoSelecionado ? String(estabelecimentoSelecionado.id) : ""}
              onChange={(e) => {
                const valorTexto = e.target.value;
                const eEncontrado = estabelecimentos.find(est => String(est.id) === valorTexto);
                setNovoEstabelecimentoSelecionado(eEncontrado || null);
              }}
              className="compra-input"
            >
              <option value="">Selecione o estabelecimento...</option>
              {estabelecimentos.map((e) => (
                <option key={e.id} value={String(e.id)}>{e.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <form onSubmit={adicionarItem} className="compra-form">
          <h3 className="section-title">Adicionar Item</h3>
          
          {/* CÓDIGO DE BARRAS */}
          <div className='input-group'>
            <label className='input-label'>Código de Barras (EAN)</label>

            <button
              type='button'
              className='btn-scanner'
              onClick={buscarProdutoPorCodigo}
            >
              <span className="scanner-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 28 24"
                  width="28"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* canto superior esquerdo */}
                  <path d="M9 3.5H5.5a2 2 0 0 0-2 2V8" />

                  {/* canto superior direito */}
                  <path d="M19 3.5h3.5a2 2 0 0 1 2 2V8" />

                  {/* canto inferior direito */}
                  <path d="M24.5 16v2.5a2 2 0 0 1-2 2H19" />

                  {/* canto inferior esquerdo */}
                  <path d="M9 20.5H5.5a2 2 0 0 1-2-2V16" />

                  {/* retângulo central */}
                  <rect
                    x="10"
                    y="8.5"
                    width="8"
                    height="7"
                    rx="1.2"
                  />
                </svg>
              </span>

              {buscandoProduto ? (
                <div className='loading-dots'>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : (
                <>
                  <span className='scanner-text'>Escanear código de barras</span>
                </>
              )}
            </button>
            
            <label className='manual-checkbox'>
              <input
                type='checkbox'
                checked={modoManual}
                onChange={(e) => {
                  setModoManual(e.target.checked);

                  if (!e.target.checked) {
                    setCodigoBarra('');
                  }
                }}
              />

              <span className='manual-checkbox-text'>Não foi possível escanear</span>
            </label>

            {modoManual && (
              <input
                type='text'
                value={codigoBarra}
                onChange={(e) => setCodigoBarra(e.target.value)}
                placeholder='Digite o código de barras...'
                className='compra-input codigo-barra-manual'
                inputMode='numeric'
              />
            )}

            {produtoNaoEncontrado && (
              <div className='produto-nao-encontrado'>
                <div className='produto-nao-encontrado-header'>
                  <span className='produto-nao-encontrado-icon'>!</span>
                  <p className='produto-nao-encontrado-texto'>
                  Produto não encontrado.           
                  </p>
                </div>
                
                <button
                  type='button'
                  className='btn-sugerir-cadastro'
                  onClick={sugerirCadastroProduto}
                >
                  Sugerir cadastro
                </button>
              </div>
            )}
          </div>

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

          {/* 2º: CAMPO CATEGORIA */}
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
              disabled={!produtoSelecionado} 
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
            <span className='item-total-label'>Subtotal do item:</span>
            <strong>R$ {precoTotalItem.toFixed(2)}</strong>
          </div>

          <button type="submit" className="button-action">
            <span className='btn-action-icon'>+</span>
            Adicionar ao Carrinho
          </button>
        </form>

        <div className="carrinho-section">
          <h3 className="section-title">📋 Itens no Carrinho ({carrinho.length})</h3>
          
          {carrinho.length === 0 ? (
            <p className="empty-text">Nenhum item adicionado ainda.</p>
          ) : (
            <div className="list-container">
              {carrinho.map((item) => (
                <div key={item.idTemp} className="list-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div className="list-item-left" style={{ flex: 1 }}>
                    <div className="item-name">
                      {item.descricao} <span className="item-brand">({item.marca})</span>
                    </div>
                    <div className="item-category">{item.categoria || 'Geral'}</div>
                  </div>

                  {/* Controles de Quantidade */}
                  <div className="qtd-controls">
                    <button 
                      type="button" 
                      onClick={() => alterarQuantidadeCarrinho(item.idTemp, item.quantidade - 1)}
                      className="btn-qtd"
                    >
                      -
                    </button>
                    <span className="qtd-display">{item.quantidade}</span>
                    <button 
                      type="button" 
                      onClick={() => alterarQuantidadeCarrinho(item.idTemp, item.quantidade + 1)}
                      className="btn-qtd"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal do Item */}
                  <div className="item-price">
                    R$ {item.precoTotalItem.toFixed(2)}
                  </div>

                  {/* Botão Remover */}
                  <button 
                    type="button" 
                    onClick={() => removerItemCarrinho(item.idTemp)}
                    className="btn-remover"
                    title="Remover item"
                  >
                    🗑️
                  </button>
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