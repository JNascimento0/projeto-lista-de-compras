import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";
import "../styles/MeuPerfil.css"

export default function MeuPerfil({ usuario, setUsuario }) {
    const [loading, setLoading] = useState(false);
    const [nome, setNome] = useState(usuario?.user_metadata?.nome || "");
    const [mensagem, setMensagem] = useState({ tipo: "", texto: ""});

    const avatarUrlAtual = usuario?.user_metadata?.avatar_url;

    const handleUploadFoto = async (e) => {
        try {
            setLoading(true);
            setMensagem({ tipo: "", texto: ""});

            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith("image/")) {
                setMensagem({ tipo: "erro", texto: "Por favor, selecione uma imagem válida."});
                return;
            }

            const extensao = file.name.split(".").pop();
            const filePath = `${usuario.id}/avatar.${extensao}`;
            
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });
            
            if (uploadError) throw uploadError;

            const { data: { publicUrl }} = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

                await salvarAlteracoesPerfil(nome, publicUrl);
        } catch (error) {
            setMensagem({ tipo: "erro", texto: "Erro ao enviar imagem: " + error.message });
        } finally {
            setLoading(false);
        }
    };

    const salvarAlteracoesPerfil = async (novoNome, novaFotoUrl) => {
        try {
            setLoading(true);
            const urlFinal = novaFotoUrl !== undefined ? novaFotoUrl : avatarUrlAtual;

            const { data: { user }, error: authError } = await supabase.auth.updateUser({
                data: {
                    nome: novoNome,
                    avatar_url: urlFinal
                }
            });

            if (authError) throw authError;

            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    nome: novoNome,
                    avatar_url: urlFinal
                })
                .eq('id', usuario.id);

            if (profileError) throw profileError;

            setUsuario(user);
            setMensagem({ tipo: "sucesso", texto: "Perfil atualizado com sucesso!" });
        } catch (error) {
            setMensagem({ tipo: "erro", texto: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="meu-perfil-container">
            <h2 className="meu-perfil-title">Meu Perfil</h2>

            {mensagem.texto && (
                <div
                    className={`meu-perfil-mensagem ${
                        mensagem.tipo === "sucesso"
                            ? "meu-perfil-mensagem-sucesso"
                            : "meu-perfil-mensagem-erro" 
                    }`}
                >
                    {mensagem.texto}
                </div>
            )}
            {/* ÁREA DA FOTO DE PERFIL */}
            <div className="avatar-section">
                {avatarUrlAtual ? (
                    <img
                        src={avatarUrlAtual}
                        alt="Foto de Perfil"
                        className="avatar-preview-img"
                    />
                ) : (
                    <div className="avatar-preview-circle">
                        {nome ? nome.charAt(0).toUpperCase() : "U"}
                    </div>
                )}

                <div className="upload-button-wrapper">
                    <label
                        htmlFor="input-avatar"
                        className={`btn-upload-label ${loading ? "disabled" : ""}`}
                    >
                        {loading ? (
                            "Enviando..."
                        ) : (
                            <>
                              <svg
                                className="btn-upload-icon"
                                viewBox="0 0 24 24"
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <rect x="3" y="7" width="18" height="12" rx="2.5" />
                                <path d="M8 7l1.5-2h5L16 7" />
                                <circle cx="12" cy="13" r="3" />
                                <circle cx="18" cy="10" r="0.7" fill="currentColor" stroke="none" />
                            </svg> 

                                <span>Alterar Foto</span> 
                            </>
                        )}
                    </label>
                    <input
                        id="input-avatar"
                        type="file"
                        accept="image/*"
                        onChange={handleUploadFoto}
                        disabled={loading}
                        style={{ display: "none" }}
                    />
                </div>
            </div>

            {/* FORMULÁRIO DE DADOS */}
            <form onSubmit={(e) => { e.preventDefault(); salvarAlteracoesPerfil(nome); }}>
                <div className="perfil-form-group">
                    <label htmlFor="input-nome">Nome Completo</label>
                    <input
                        id="input-nome"
                        type="text"
                        className="perfil-input"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="btn-salvar-perfil"
                    disabled={loading}
                >
                    {loading ? "Salvando..." : "Salvar Alterações"}
                </button>
            </form>
        </div>
    )
}
