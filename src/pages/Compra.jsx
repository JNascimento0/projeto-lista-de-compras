import React, { useEffect, useState } from 'react';
// 🚀 IMPORTA A CONEXÃO COM O SUPABASE E O CSS DA SUA PASTA DE ESTILOS DEDICADA
import { supabase } from '../services/supabaseClient';
import '../styles/Compra.css';

export default function Compra() {
  const [dataCompra, setDataCompra] = useState('');
  const [categoria, setCategoria] = useState('');
  const [quantidade, setQuantidade] = useState(0);
  const [precoUnitario, setPrecoUnitario] = useState(0);
  const [carrinho, setCarrinho] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [marcas, setMarcas] = useState([]);
  const [estabelecimentos, setEstabelecimentos] = useState([]);
  const [estabelecimentoSelecionado, setNovoEstabelecimentoSelecionado] = useState(null);

  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [marcaSelecionada, setMarcaSelecionada] = useState('');
  const [codigoBarra, setCodigoBarra] = useState('');
  const [modoManual, setModoManual] = useState(false);
  const [produtoNaoEncontrado, setProdutoNaoEncontrado] = useState(false);
  const [buscandoProduto, setBuscandoProduto] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [erroEstabelecimento, setErroEstabelecimento] = useState('');
  const [erroData, setErroData] = useState('');
  const [erroProduto, setErroProduto] = useState('');
  const [erroMarca, setErroMarca] = useState('');
  const [erroQuantidade, setErroQuantidade] = useState('');
  const [erroPreco, setErroPreco] = useState('');
  const [erroCodigoBarra, setErroCodigoBarra] = useState('');
  const [mensagemSugestao, setMensagemSugestao] = useState(null);

  useEffect(() => {
    const carregarDadosBase = async () => {
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

  const normalizarCodigoBarra = (codigo) => {
    return String(codigo ?? '').replace(/\s+/g, '');
  }

  const precoTotalItem = Math.round(quantidade * precoUnitario * 100) / 100;

  const buscarProdutoPorCodigo = async (codigo) => {
    const codigoRecebido = normalizarCodigoBarra(codigo);

    if (!codigoRecebido) {
      setErroCodigoBarra("Digite ou informe um código de barras.");
      return;
    }

    setErroCodigoBarra('');
    setProdutoNaoEncontrado(false);
    setProdutoSelecionado(null);
    setCategoria('');
    setMarcaSelecionada('');
    setMensagemSugestao(null);
    setErroProduto('');
    setErroMarca('');

    const inicioBusca = Date.now();
    setBuscandoProduto(true);

    const { data, error } = await supabase
      .from('produtos_base')
      .select('*')
      .eq('codigo_barra', codigoRecebido)
      .maybeSingle();

    const tempoDecorrido = Date.now() - inicioBusca;
    const tempoRestante = Math.max(0, 600 - tempoDecorrido);

    await new Promise(resolve => setTimeout(resolve, tempoRestante));

    setBuscandoProduto(false);

    if (error) {
      console.error("Erro ao buscar produto", error);
      setErroCodigoBarra(
        "Não foi possível consultar o produto. Tente novamente."
      );
      return;
    }

    if (!data) {
      setProdutoNaoEncontrado(true);
      return;
    }

    const produto = data;

    setProdutoSelecionado(produto);
    setCategoria(produto.categoria);
    setErroProduto('');

  };

  const sugerirCadastroProduto = async (codigo) => {
    const codigoRecebido = normalizarCodigoBarra(codigo);

    if (!codigoRecebido) {
      setMensagemSugestao({
        tipo: 'erro',
        texto: 'Não há código de barras para sugerir.'
      });

      setTimeout(() => {
        setMensagemSugestao(null);
      }, 4000);

      return;
    }

    setMensagemSugestao(null);

    const { error } = await supabase
      .from('sugestoes_cadastro')
      .insert([
        {
          codigo_barra: codigoRecebido
        }
      ]);

    if (error) {
      console.error("Erro ao enviar sugestão:", error);
      setMensagemSugestao({
        tipo: 'erro',
        texto: 'Não foi possível enviar a sugestão.'
      });

    setTimeout(() => {
      setMensagemSugestao(null);
    }, 4000);

      return;
    }

    setMensagemSugestao({
      tipo: 'sucesso',
      texto: 'Sugestão enviada com sucesso!'
    });

    setTimeout(() => {
      setMensagemSugestao(null);
    }, 4000);
  };

  const adicionarItem = (e) => {
    e.preventDefault();

    const produtoInvalido = !produtoSelecionado;
    const marcaInvalida = Boolean(produtoSelecionado) && !marcaSelecionada;

    setErroProduto(
      produtoInvalido ? 'Escaneie ou informe um produto.' :''
    );

    setErroMarca(
      marcaInvalida ? 'Selecione uma marca.' : ''
    );

    if (produtoInvalido || marcaInvalida) {
      return;
    }

    const quantidadeNumero = Number(quantidade);
    const precoNumero = Number(precoUnitario);

    const quantidadeInvalida =
      !Number.isFinite(quantidadeNumero) || quantidadeNumero <= 0;

    const precoInvalido =
      !Number.isFinite(precoNumero) || precoNumero <= 0;

    setErroQuantidade(
      quantidadeInvalida ? 'Informe uma quantidade maior que zero.' : ''
    );

    setErroPreco(
      precoInvalido ? 'Informe um preço maior que zero.' : ''
    );

    if (quantidadeInvalida || precoInvalido) {
      return;
    }

    const novoItem = {
      idTemp: Date.now(), // ID temporário para identificar e manipular o item no carrinho
      codigoBarra: produtoSelecionado.codigo_barra,
      idProduto: produtoSelecionado.id,
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
    setQuantidade(0);
    setPrecoUnitario(0);
    setCodigoBarra('');
    setProdutoNaoEncontrado(false);
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

    const estabelecimentoInvalido = !estabelecimentoSelecionado;
    const dataInvalida = !dataCompra;

    setErroEstabelecimento(
      estabelecimentoInvalido ? 'Selecione um estabelecimento.' : ''
    );

    setErroData(
      dataInvalida ? 'Selecione a data da compra.' : ''
    );

    if (estabelecimentoInvalido || dataInvalida) {
      return;
    }

    setSalvando(true);

    try {
      const itensParaSalvar = carrinho.map(item => ({
        id_produto: item.idProduto,
        codigo_barra: item.codigoBarra,
        descricao_produto: item.descricao,
        marca_produto: item.marca,
        categoria: item.categoria || 'Geral',
        quantidade: item.quantidade,
        preco_unitario: item.precoUnitario,
        preco_total: item.precoTotalItem
      }));

      const { data: idCompraGerado, error: erroSalvar } = await supabase
        .rpc('salvar_compra_com_itens', {
          p_data_compra: dataCompra,
          p_id_estabelecimento: estabelecimentoSelecionado.id,
          p_nome_estabelecimento: estabelecimentoSelecionado.nome,
          p_valor_total: valorTotalCompra,
          p_itens: itensParaSalvar
        });

      if (erroSalvar) throw erroSalvar;

      console.log('Compra salva com ID:', idCompraGerado);

      setMensagem({
        tipo: 'sucesso',
        texto: 'Compra salva com sucesso!'
      });

      setTimeout(() => {
        setMensagem(null);
      }, 4000);

      setCarrinho([]);
      setDataCompra('');
      setNovoEstabelecimentoSelecionado(null);
    } catch (error) {
      console.error("Erro ao salvar:", error.message);

      setMensagem({
        tipo: 'erro',
        texto: 'Não foi possível salvar a compra.'
      });

      setTimeout(() => {
        setMensagem(null);
      }, 4000);
    } finally {
      setSalvando(false);
    }
  };

  const valorTotalCompra = carrinho.reduce((acc, item) => acc + item.precoTotalItem, 0);

  return (

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
          <span className='compra-subtitle'>
            <span>|</span>
            <span>Mercado</span>
          </span>
        </h2>

        {/* SELEÇÃO DE DATA E ESTABELECIMENTO */}
        <div className="compra-row">
          <div className="input-group flex-1">
            <label className="input-label" htmlFor="data-compra">
              Data da Compra
            </label>
            <input
              id="data-compra"
              type="date"
              value={dataCompra}
              onChange={(e) => {
                setDataCompra(e.target.value);
                setErroData('');
              }}
              className="compra-input"
              required
            />
            {erroData && (
              <span className='campo-erro' role='alert'>
                {erroData}
              </span>
            )}
          </div>

          <div className="input-group flex-1">
            <label className="input-label" htmlFor='estabelecimento-compra'>
              Estabelecimento (Mercado)
            </label>
            <select
              id='estabelecimento-compra'
              value={estabelecimentoSelecionado ? String(estabelecimentoSelecionado.id) : ""}
              onChange={(e) => {
                const valorTexto = e.target.value;
                const eEncontrado = estabelecimentos.find(est => String(est.id) === valorTexto);
                setNovoEstabelecimentoSelecionado(eEncontrado || null);
                setErroEstabelecimento('');
              }}
              className="compra-input"
            >
              <option value="">Selecione o estabelecimento...</option>
              {estabelecimentos.map((e) => (
                <option key={e.id} value={String(e.id)}>{e.nome}</option>
              ))}
            </select>
            {erroEstabelecimento && (
              <span className='campo-erro' role='alert'>
                {erroEstabelecimento}
              </span>
            )}
          </div>
        </div>

        <form onSubmit={adicionarItem} className="compra-form">
          <h3 className="section-title">Adicionar Item</h3>

          {/* CÓDIGO DE BARRAS */}
          <div className='input-group'>
            <span className='input-label'>Código de Barras (EAN)</span>

            <button
              type='button'
              className='btn-scanner'
              onClick={() => buscarProdutoPorCodigo(codigoBarra)}
              disabled={buscandoProduto}
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
                id='codigo-barra-manual'
                type='text'
                value={codigoBarra}
                onChange={(e) => {
                  setCodigoBarra(e.target.value);
                  setProdutoSelecionado(null);
                  setCategoria('');
                  setMarcaSelecionada('');
                  setProdutoNaoEncontrado(false);
                  setErroCodigoBarra('');
                  setMensagemSugestao(null);
                }}
                placeholder='Digite o código de barras...'
                className='compra-input codigo-barra-manual'
                inputMode='numeric'
                disabled={buscandoProduto}
                aria-label='Código de barras manual'
              />
            )}
            {erroCodigoBarra && (
              <span className='campo-erro' role='alert'>
                {erroCodigoBarra}
              </span>
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
                  onClick={() => sugerirCadastroProduto(codigoBarra)}
                >
                  Sugerir cadastro
                </button>
                {mensagemSugestao && (
                  <span
                    className={`mensagem-sugestao mensagem-sugestao-${mensagemSugestao.tipo}`}
                    role='status'
                  >
                    {mensagemSugestao.texto}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* PRODUTO IDENTIFICADO PELO CÓDIGO DE BARRAS */}
          <div className="input-group">
            <label className="input-label" htmlFor='produto-compra'>
              Produto:
            </label>
            <input
              id='produto-compra'
              type="text"
              value={produtoSelecionado?.nome || ""}
              placeholder='Escaneie o código de barras'
              readOnly
              className='compra-input readonly'
            />
            {erroProduto && (
              <span className='campo-erro' role='alert'>
                {erroProduto}
              </span>
            )}
          </div>

          {/* CAMPO CATEGORIA */}
          <div className="input-group">
            <label className="input-label" htmlFor='categoria-compra'>
              Categoria
            </label>
            <input
              id='categoria-compra'
              type="text"
              value={categoria}
              placeholder="Categoria do produto"
              readOnly
              className="compra-input readonly"
            />
          </div>

          {/* SELEÇÃO DA MARCA */}
          <div className="input-group">
            <label className="input-label" htmlFor='marca-compra'>
              Marca:
            </label>
            <select
              id='marca-compra'
              value={marcaSelecionada}
              onChange={(e) => {
                setMarcaSelecionada(e.target.value);
                setErroMarca('');
              }}
              className="compra-input"
              disabled={!produtoSelecionado}
            >
              <option value="">Selecione a marca...</option>
              {marcas.map((m) => (
                <option key={m.id} value={m.nome}>{m.nome}</option>
              ))}
            </select>
            {erroMarca && (
              <span className='campo-erro' role='alert'>
                {erroMarca}
              </span>
            )}
          </div>

          <div className="compra-row">
            <div className="input-group flex-1">
              <label className="input-label" htmlFor='quantidade-compra'>
                Qtd. (Un ou Kg)
              </label>
              <input
                id='quantidade-compra'
                type="number"
                value={quantidade}
                onChange={(e) => {
                  setQuantidade(Number(e.target.value));
                  setErroQuantidade('');
                }}
                min="0.001"
                step="any"
                className="compra-input"
              />
              {erroQuantidade && (
                <span className='campo-erro' role='alert'>
                  {erroQuantidade}
                </span>
              )}

            </div>
            <div className="input-group flex-1">
              <label className="input-label" htmlFor='preco-unitario-compra'>
                Preço Unitário
              </label>
              <input
                id='preco-unitario-compra'
                type="number"
                step="0.01"
                value={precoUnitario}
                onChange={(e) => {
                  setPrecoUnitario(Number(e.target.value));
                  setErroPreco('');
                } }
                placeholder="0,00"
                className="compra-input"
              />
              {erroPreco && (
                <span className='campo-erro' role='alert'>
                  {erroPreco}
                </span>
              )}

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
          <h3 className="section-title carrinho-title">
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
              <rect x="5" y="4" width="14" height="16" rx="2" />
              <path d="M9 4V2h6v2" />
              <path d="M9 9h6" />
              <path d="M9 13h6" />
              <path d="M9 17h4" />
            </svg>

            <span>Itens no Carrinho ({carrinho.length})</span>
          </h3>

          {carrinho.length === 0 ? (
            <p className="empty-text">Nenhum item adicionado ainda.</p>
          ) : (
            <div className="list-container">
              {carrinho.map((item) => (
                <div key={item.idTemp} className="list-item">
                  <div className="list-item-left">
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
                    aria-label="Remover item"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v5" />
                      <path d="M14 11v5" />
                    </svg>
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
            <svg
              className="finalizar-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
              <path d="M17 21v-8H7v8" />
              <path d="M7 3v5h8" />
            </svg>
            {salvando ? 'A guardar no Banco...' : ' Finalizar e Salvar Compra'}
          </button>
        )}

        {mensagem && (
          <div
            className={`compra-mensagem compra-mensagem-${mensagem.tipo}`}
            role='status'
          >
            {mensagem.texto}
          </div>
        )}
      </div>

  );
}