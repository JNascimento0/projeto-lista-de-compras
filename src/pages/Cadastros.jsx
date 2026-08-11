import React, { useState, useEffect} from "react";
import { supabase } from "../services/supabaseClient";
import '../styles/Cadastros.css';

export default function Cadastros() {
    const [novaMarca, setNovaMarca] = useState('');
    const [marcas, setMarcas] = useState([]);
    const [novoProduto, setNovoProduto] = useState('');
    const [categoriaProduto, setCategoriaProduto] = useState('');
    const [produtos, setProdutos] = useState([]);
    
    const [salvandoMarca, setSalvandoMarca] = useState(false);
    const [salvandoProduto, setSalvandoProduto] = useState(false);

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        const resMarcas = await supabase
            .from('marcas_base')
            .select('*')
            .order('nome', { ascending: true });
        if (resMarcas.data) setMarcas(resMarcas.data);
        
        const resProdutos = await supabase
            .from('produtos_base')
            .select('*')
            .order('nome', { ascending: true });
        if (resProdutos.data) setProdutos(resProdutos.data);

        /* 🔍 ABRA O CONSOLE (F12) PARA VER ESTA LINHA:
    console.log("RESPOSTA PRODUTOS:", resProdutos);

    if (resProdutos.data) setProdutos(resProdutos.data);
    */
    };

    const handleSalvarMarca = async (e) => {
        e.preventDefault();
        if (!novaMarca.trim()) {
            alert("Digite o nome da marca!");
            return;
        }

        setSalvandoMarca(true);
        try {
            const { error } = await supabase
                .from('marcas_base')
                .insert([{ nome: novaMarca.trim() }]);
            if (error) throw error;

            alert("🏷️ Marca cadastrada com sucesso!");
            setNovaMarca('');
            carregarDados();
        } catch (error) {
                alert("Erro ao cadastrar marca: " + error.message);
        } finally {
                setSalvandoMarca(false);
        }
    };

    const handleSalvarProduto = async (e) => {
        e.preventDefault();
        if (!novoProduto.trim() || !categoriaProduto.trim()) {
            alert("Por favor, informe tanto o nome do produto quanto a categoris!");
            return;
        }

        setSalvandoProduto(true);
        try {
            const { error } = await supabase
                .from('produtos_base')
                .insert([
                    {
                      nome: novoProduto.trim(),
                      categoria: categoriaProduto.trim()  
                    }
                ]);
            
            if (error) throw error;

            alert("📦 Produto cadastrado com sucesso!");
            setNovoProduto('');
            setCategoriaProduto('');
            carregarDados();
        } catch (error) {
            alert("Erro ao cadastrar produto: " + error.message);
        } finally {
            setSalvandoProduto(false);
        }
    };

    return (
        <div>
            <div>
                <h2></h2>

                {/* ---------------- SEÇÃO 1: CADASTRAR MARCA ---------------- */}
                <div className="cadastro-secao">
                    <h3 className="secao-titulo">🏷️ Cadastrar Marca</h3>
                    <form onSubmit={handleSalvarMarca} className="cadastros-form">
                        <div className="input-group">
                            <label className="input-label">Nome da Marca</label>
                            <input
                                type="text"
                                value={novaMarca}
                                onChange={(e) => setNovaMarca(e.target.value)}
                                placeholder="Ex: Nestlé, Coca-Cola..."
                                className="compra-input"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={salvandoMarca}
                            className="button-action"
                        >
                            {salvandoMarca ? 'Salvando...' : 'Cadastrar Marca'}
                        </button>
                    </form>

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

                <hr className="divider" />

                {/* ---------------- SEÇÃO 2: CADASTRAR PRODUTO E CATEGORIA ---------------- */}
                <div className="cadastro-secao">
                    <h3 className="secao-titulo">📦 Cadastrar Produto Base</h3>
                    <form onSubmit={handleSalvarProduto} className="cadastros-form">
                        <div className="input-group">
                            <label className="input-label">Nome do Produto</label>
                            <input 
                                type="text"
                                value={novoProduto}
                                onChange={(e) => setNovoProduto(e.target.value)}
                                placeholder="Ex: Arroz Integral, Sabão em Pó..."
                                className="compra-input"
                            />
                        </div>

                        {/* CAMPO DE DADOS LIVRE DA CATEGORIA */}
                        <div className="input-group">
                            <label className="input-label">Categoria do Produto</label>
                            <input 
                                type="text"
                                value={categoriaProduto}
                                onChange={(e) => setCategoriaProduto(e.target.value)}
                                placeholder="Ex: Mercearia, Limpeza, Frios..."
                                className="compra-input"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={salvandoProduto}
                            className="button-action"
                        >
                            {salvandoProduto ? 'Salvando...' : 'Cadastrar Produto'}
                        </button>
                    </form>

                    {/* Lista de produtos e categorias cadastrados no banco */}
                    {produtos.length > 0 && (
                        <div>
                            <span></span>
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
        </div>
    );
}