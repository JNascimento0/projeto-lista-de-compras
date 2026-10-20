import React, { useState, useEffect} from "react";
import { supabase } from "../services/supabaseClient";
import '../styles/Cadastros.css';
import '../styles/Compra.css';
import {
    StoreIcon,
    ScannerIcon,
    ProductIcon,
    TagIcon,
} from '../components/icons';

export default function Cadastros() {
    const [codigoBarra, setCodigoBarra] = useState('');
    const [buscandoEan, setBuscandoEan] = useState(false);
    const [novaMarca, setNovaMarca] = useState('');
    const [marcas, setMarcas] = useState([]);
    const [novoEstabelecimento, setNovoEstabelecimento] = useState('');
    const [estabelecimentos, setEstabelecimentos] = useState([]);
    const [salvandoEstabelecimento, setSalvandoEstabelecimento] = useState(false);
    const [novoProduto, setNovoProduto] = useState('');
    const [categoriaProduto, setCategoriaProduto] = useState('');
    const [produtos, setProdutos] = useState([]);
    
    const [salvandoMarca, setSalvandoMarca] = useState(false);
    const [salvandoProduto, setSalvandoProduto] = useState(false);
    const [mensagem, setMensagem] = useState(null);
    const [errosCampos, setErrosCampos] = useState({});

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
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
        
        const resProdutos = await supabase
            .from('produtos_base')
            .select('*')
            .order('nome', { ascending: true });
        if (resProdutos.data) setProdutos(resProdutos.data);
    };

    const handleBuscarEan = async (e) => {
        e?.preventDefault();
        if (!codigoBarra.trim()) return;

        setBuscandoEan(true);
        setMensagem(null);
 
        try {
            const { data, error } = await supabase.functions.invoke('buscar-produto-ean', {
                body: { ean: codigoBarra },
            });

            if (error) {
                console.error('Erro ao buscar EAN:', error);

                let texto = 'Não foi possível consultar o produto. Tente novamente';
                try {
                    const corpo = await error.context.json();
                    if (corpo?.mensagem) texto = corpo.mensagem;
                } catch {
                    // corpo ausente ou que não é JSON: mantém a mensagem genérica
                }

                setMensagem({
                    secao: 'produto',
                    tipo: 'erro',
                    texto
                });
                return;
            }

            if (data.encontrado) {
                setNovoProduto(data.nome);
                setNovaMarca(data.marca);
                setCategoriaProduto(data.categoria || 'Geral');
            } else {
                setMensagem({
                    secao: 'produto',
                    tipo: 'erro',
                    texto: data.mensagem || 'Produto não encontrado.'
                });
            }
        } catch (err) {
            console.error('Erro inesperado ao buscar EAN:', err);
            setMensagem({
                secao: 'produto',
                tipo: 'erro',
                texto: 'Não foi possível consultar o produto. Tente novamente.'
            });
        } finally {
            setBuscandoEan(false);
            setTimeout(() => setMensagem(null), 4000);
        }
    };

    const handleSalvarMarca = async (e) => {
        e.preventDefault();
        
        setErrosCampos({});
        setMensagem(null);

        if (!novaMarca.trim()) {
            setErrosCampos({ marca: 'Digite o nome da marca!' });
            return;
        }

        setSalvandoMarca(true);
        try {
            const { error } = await supabase
                .from('marcas_base')
                .insert([{ nome: novaMarca.trim() }]);
            if (error) throw error;

            setMensagem({
                secao: 'marca',
                tipo: 'sucesso',
                texto: 'Marca cadastrada com sucesso!'
            });

            setTimeout(() => {
                setMensagem(null);
            }, 4000);

            setNovaMarca('');
            carregarDados();
        } catch (error) {
                console.error('Erro ao cadastrar marca:', error);

                setMensagem({
                    secao: 'marca',
                    tipo: 'erro',
                    texto: 'Erro ao cadastrar marca. Tente novamente.'
                });

                setTimeout(() => {
                    setMensagem(null);
                }, 4000);
        } finally {
            setSalvandoMarca(false);
        }
    };

   const handleSalvarEstabelecimento = async (e) => {
    e.preventDefault();

    setErrosCampos({});
    setMensagem(null);

    if (!novoEstabelecimento.trim()) {
        setErrosCampos({ estabelecimento: 'Digite o nome do estabelecimento!' });
        return;
    }

    setSalvandoEstabelecimento(true);
    try {
        const { error } = await supabase
            .from('estabelecimentos_base')
            .insert([{ nome: novoEstabelecimento.trim() }]);
        if (error) throw error;

        setMensagem({
            secao: 'estabelecimento',
            tipo: 'sucesso',
            texto: 'Estabelecimento cadastrado com sucesso!'
        });

        setTimeout(() => {
            setMensagem(null);
        }, 4000);
            
        setNovoEstabelecimento('');
        carregarDados();
    } catch (error) {
        console.error('Erro ao cadastrar estabelecimento:', error);

        setMensagem({
            secao: 'estabelecimento',
            tipo: 'erro',
            texto: 'Erro ao cadastrar estabelecimento. Tente novamente.'
        });

        setTimeout(() => {
            setMensagem(null);
        }, 4000);
    } finally {
        setSalvandoEstabelecimento(false);
    }
   };

    const handleSalvarProduto = async (e) => {
        e.preventDefault();

        setErrosCampos({});
        setMensagem(null);

        const erros = {};
        
        if (!novoProduto.trim()) {
            erros.produto = 'Digite o nome do produto!';
        }

        if (!categoriaProduto.trim()) {
            erros.categoria = 'Digite a categoria do produto!';
        }

        if (Object.keys(erros).length > 0) {
            setErrosCampos(erros);
            return;
        }

        setSalvandoProduto(true);
        try {
            const { error } = await supabase
                .from('produtos_base')
                .insert([
                    {
                      nome: novoProduto.trim(),
                      categoria: categoriaProduto.trim(),
                      codigo_barra: codigoBarra.trim() || null  
                    }
                ]);
            
            if (error) {
                if (error.code === '23505') {
                if (error.message.includes('produtos_base_nome_key')) {
                    setErrosCampos({ produto: 'Já existe um produto com este nome.'});
                } else if (error.message.includes('produtos_base_codigo_barra_unique')) {
                    setErrosCampos({ codigoBarra: 'Este código de barras já pertence a outro produto.'});
                } else {
                    setMensagem({
                        secao: 'produto',
                        tipo: 'erro',
                        texto: 'Este produto ou código de barras já está cadastrado.'
                    });
                    
                    setTimeout(() => {
                        setMensagem(null);
                    }, 4000);
                }
                return;
                }
            throw error;
            }

            setMensagem({
                secao: 'produto',
                tipo: 'sucesso',
                texto: 'Produto cadastrado com sucesso!'
            });

            setTimeout(() => {
                setMensagem(null);
            }, 4000);

            setNovoProduto('');
            setCategoriaProduto('');
            setCodigoBarra('');
            carregarDados();
        } catch (error) {
            console.error('Erro ao cadastrar produto:', error);

            setMensagem({
                secao: 'produto',
                tipo: 'erro',
                texto: 'Erro ao cadastrar produto. Tente novamente.'
            });
            setTimeout(() => {
                setMensagem(null);
            }, 4000);
        } finally {
            setSalvandoProduto(false);
        }
    };

    return (
        <div className="cadastros-card">
            <h2 className="cadastros-title">Cadastros do Sistema</h2>
            
            {/* ---------------- SEÇÃO 1: CADASTRAR MARCA ---------------- */}
            <div className="cadastro-secao">
                    <h3 className="secao-titulo">
                        <TagIcon /> Cadastrar Marca
                    </h3>
                    <form onSubmit={handleSalvarMarca} className="cadastros-form">
                        <div className="input-group">
                            <label 
                                className="input-label"
                                htmlFor="nome-marca"
                            >
                                Nome da Marca
                            </label>
                            <input
                                id="nome-marca"
                                type="text"
                                value={novaMarca}
                                onChange={(e) => {
                                    setNovaMarca(e.target.value);
                                    setErrosCampos({ ...errosCampos, marca: '' });
                                }}
                                placeholder="Ex: Nestlé, Coca-Cola..."
                                className="compra-input"
                            />
                            {errosCampos.marca && (
                                <span className="campo-erro" role="alert">
                                    {errosCampos.marca}
                                </span>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={salvandoMarca}
                            className="button-action"
                        >
                            {salvandoMarca ? 'Salvando...' : 'Cadastrar Marca'}
                        </button>
                    </form>

                    {mensagem?.secao === 'marca' && (
                        <div
                            className={`compra-mensagem compra-mensagem-${mensagem.tipo}`}
                            role="status"
                        >
                            {mensagem.texto}
                        </div>
                    )}

                    {/* Lista de marcas já cadastradas no banco */}
                    {marcas.length > 0 && (
                        <div className="lista-tags">
                            <span className="subtitulo-lista">Marcas no banco:</span>
                            <div className="tags-container">
                                {marcas.map((m) => (
                                    <span key={m.id} className="tag-item">{m.nome}</span>
                                ))}
                            </div>
                        </div>
                    )}
            </div>

            {/* ---------------- SEÇÃO 2: CADASTRAR ESTABELECIMENTO ---------------- */}
            <div className="cadastro-secao">
                    <h3 className="secao-titulo">
                        <StoreIcon /> Cadastrar Estabelecimento (Mercado)
                    </h3>
                    <form onSubmit={handleSalvarEstabelecimento} className="cadastros-form">
                        <div className="input-group">
                            <label 
                                className="input-label"
                                htmlFor="nome-estabelecimento"
                            >
                                Nome do Estabelecimento
                            </label>
                            <input
                                id="nome-estabelecimento"
                                type="text"
                                value={novoEstabelecimento}
                                onChange={(e) => {
                                    setNovoEstabelecimento(e.target.value);
                                    setErrosCampos({ ...errosCampos, estabelecimento: '' });
                                }}
                                placeholder="Ex: Atacadão, Carrefour, Mercadinho da Vila..."
                                className="compra-input"
                            />
                            {errosCampos.estabelecimento && (
                                <span className="campo-erro" role="alert">
                                    {errosCampos.estabelecimento}
                                </span>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={salvandoEstabelecimento}
                            className="button-action"
                        >
                            {salvandoEstabelecimento ? 'Salvando...' : 'Cadastrar Estabelecimento'}
                        </button>
                    </form>
                    
                    {mensagem?.secao === 'estabelecimento' && (
                        <div
                            className={`compra-mensagem compra-mensagem-${mensagem.tipo}`}
                            role="status"
                        >
                            {mensagem.texto}
                        </div>
                    )}

                    {estabelecimentos.length > 0 && (
                        <div className="lista-tags">
                            <span className="subtitulo-lista">Estabelecimentos no banco:</span>
                            <div className="tags-container">
                                {estabelecimentos.map((e) => (
                                    <span key={e.id} className="tag-item">{e.nome}</span>
                                ))}
                            </div>
                        </div>
                    )}
            </div>

            {/* ---------------- SEÇÃO 3: CADASTRAR PRODUTO E CATEGORIA ---------------- */}
            <div className="cadastro-secao">
                    <h3 className="secao-titulo">
                        <ProductIcon /> Cadastrar Produtos
                    </h3>
                    <form onSubmit={handleSalvarProduto} className="cadastros-form">
                        
                        {/* CAMPO DE CONSULTA POR CÓDIGO DE BARRAS / EAN */}
                        <div className="input-group">
                            <label
                                className="input-label"
                                htmlFor="codigo-barra-produto"
                            >
                                Código de Barras (EAN)
                            </label>
                            <div className="ean-acoes">
                                <input
                                    id="codigo-barra-produto"
                                    type="text"
                                    value={codigoBarra}
                                    onChange={(e) => {
                                        setCodigoBarra(e.target.value);
                                        setErrosCampos({ ...errosCampos, codigoBarra: '' });
                                    }}
                                    placeholder="Digite ou escaneie o código de barras..."
                                    className="compra-input"
                                />
                                <button
                                    type="button"
                                    onClick={handleBuscarEan}
                                    disabled={buscandoEan}
                                    className="button-action botao-pesquisar-ean"
                                >
                                    {buscandoEan ? 'Buscando...' : <><ScannerIcon size={20} /> Pesquisar EAN</>}
                                </button>
                            </div>
                            {errosCampos.codigoBarra && (
                                <span
                                    className="campo-erro"
                                    role="alert"
                                >
                                    {errosCampos.codigoBarra}
                                </span>
                            )}
                        </div>

                        {/* NOME DO PRODUTO (Preenchido automaticamente se achado pela API) */}
                        <div className="input-group">
                            <label
                                className="input-label"
                                htmlFor="nome-produto"
                            >
                                Nome do Produto
                            </label>
                            <input
                                id="nome-produto"
                                type="text"
                                value={novoProduto}
                                onChange={(e) => {
                                    setNovoProduto(e.target.value);
                                    setErrosCampos({ ...errosCampos, produto: '' });
                                }}
                                placeholder="Ex: Arroz Integral, Sabão em Pó..."
                                className="compra-input"
                            />
                            {errosCampos.produto && (
                                <span
                                    className="campo-erro"
                                    role="alert"
                                >
                                    {errosCampos.produto}
                                </span>
                            )}
                        </div>

                        {/* CAMPO DE DADOS LIVRE DA CATEGORIA */}
                        <div className="input-group">
                            <label
                                className="input-label"
                                htmlFor="categoria-produto"
                            >
                                Categoria do Produto
                            </label>
                            <input
                                id="categoria-produto" 
                                type="text"
                                value={categoriaProduto}
                                onChange={(e) => {
                                    setCategoriaProduto(e.target.value);
                                    setErrosCampos({ ...errosCampos, categoria: '' });
                                }}
                                placeholder="Ex: Mercearia, Limpeza, Frios..."
                                className="compra-input"
                            />
                            {errosCampos.categoria && (
                                <span
                                    className="campo-erro"
                                    role="alert"
                                >
                                    {errosCampos.categoria}
                                </span>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={salvandoProduto}
                            className="button-action"
                        >
                            {salvandoProduto ? 'Salvando...' : 'Cadastrar Produto'}
                        </button>
                    </form>

                    {mensagem?.secao === 'produto' && (
                        <div
                            className={`compra-mensagem compra-mensagem-${mensagem.tipo}`}
                            role="status"
                        >
                            {mensagem.texto}
                        </div>
                    )}

                    {/* Lista de produtos e categorias cadastrados no banco */}
                    {produtos.length > 0 && (
                        <div className="produtos-lista">
                            <span className="subtitulo-lista">Produtos no banco:</span>
                            <div className="produtos-container">
                                {produtos.map((p) => (
                                    <div key={p.id} className="produto-item">
                                        <span className="produto-nome">{p.nome}</span>
                                        <span className="produto-categoria">{p.categoria}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                
            </div>
        </div>
    );
}