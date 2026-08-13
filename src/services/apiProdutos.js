const COSMOS_TOKEN = import.meta.env.VITE_COSMOS_TOKEN || 'rSFbVsmEf_f6DxZZ5t_Pkg';
const APILAYER_KEY = import.meta.env.VITE_APILAYER_KEY || '2a90c4577d19dedb2e4bdc6b56bcc68b';

// Helper para formatar texto (Ex: "SOYA ALIMENTOS" -> "Soya Alimentos")
const formatarTexto = (texto) => {
    if (!texto) return '';
    return texto
        .trim()
        .toLowerCase()
        .split(' ')
        .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
        .join(' ');
};

// Dedução automática de categoria com base no nome do produto
const deduzirCategoria = (nomeProduto) => {
    if (!nomeProduto) return "Geral";
    const nome = nomeProduto.toLowerCase();

    if (nome.includes("café") || nome.includes("cafe") || nome.includes("chá") || nome.includes("cha")) return "Café e Chá";
    if (nome.includes("óleo") || nome.includes("oleo") || nome.includes("arroz") || nome.includes("feijão") || nome.includes("feijao") || nome.includes("açúcar") || nome.includes("acucar") || nome.includes("sal") || nome.includes("farinha") || nome.includes("massa") || nome.includes("macarrão")) return "Mercearia";
    if (nome.includes("leite") || nome.includes("queijo") || nome.includes("requeijão") || nome.includes("manteiga") || nome.includes("iogurte")) return "Laticínios";
    if (nome.includes("sabão") || nome.includes("sabao") || nome.includes("detergente") || nome.includes("amaciante") || nome.includes("desinfetante") || nome.includes("papel higiênico")) return "Limpeza";
    if (nome.includes("shampoo") || nome.includes("condicionador") || nome.includes("sabonete") || nome.includes("creme dental") || nome.includes("desodorante")) return "Higiene Pessoal";
    if (nome.includes("refrigerante") || nome.includes("suco") || nome.includes("cerveja") || nome.includes("água") || nome.includes("agua")) return "Bebidas";
    if (nome.includes("biscoito") || nome.includes("bolacha") || nome.includes("chocolate") || nome.includes("snack")) return "Biscoitos e Snacks";

    return "Geral";
};

const buscarCosmos = async (eanLimpo) => {
    if (!COSMOS_TOKEN) return { encontrado: false };

    try {
        const response = await fetch(`https://api.cosmos.bluesoft.com.br/gtins/${eanLimpo}.json`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Cosmos-API-Request',
                'X-Cosmos-Token': COSMOS_TOKEN
            }
        });

        if (!response.ok) return { encontrado: false };

        const data = await response.json();
        if (!data.description) return { encontrado: false };

        const nomeProduto = data.description || "";

        // Extrai o campo de categoria tratando gpc, category ou fallback inteligente
        let categoriaBruta = data.category?.name || data.category_description || data.gpc?.description || data.gpc?.name || "";

        if (categoriaBruta.includes('/')) {
            categoriaBruta = categoriaBruta.split('/')[0].trim();
        }

        if (!categoriaBruta || categoriaBruta === "Geral") {
            categoriaBruta = deduzirCategoria(nomeProduto);
        }

        return {
            encontrado: true,
            codigoBarra: eanLimpo,
            nome: formatarTexto(nomeProduto),
            marca: formatarTexto(data.brand?.name || "Marca Não Informada"),
            categoria: formatarTexto(categoriaBruta),
            imagemUrl: data.thumbnail || null,
            fonte: "Cosmos"
        };
    } catch (err) {
        console.error("Erro na busca Cosmos:", err);
        return { encontrado: false };
    }
};

const buscarOpenFoodFacts = async (eanLimpo) => {
    try {
        const response = await fetch(`https://br.openfoodfacts.org/api/v2/product/${eanLimpo}.json`);
        if (!response.ok) return { encontrado: false };

        const data = await response.json();
        if (data.status === 0 || !data.product) return { encontrado: false };

        const produto = data.product;
        const nomeBruto = produto.product_name || produto.product_name_pt || "Produto sem Nome";
        const marcaBruta = produto.brands || "Marca Não Informada";
        
        let categoriaBruta = produto.categories_tags?.[0]?.replace('pt:', '').replace(/-/g, ' ') || "";

        if (!categoriaBruta || categoriaBruta === "Geral") {
            categoriaBruta = deduzirCategoria(nomeBruto);
        }

        return {
            encontrado: true,
            codigoBarra: eanLimpo,
            nome: formatarTexto(nomeBruto),
            marca: formatarTexto(marcaBruta),
            categoria: formatarTexto(categoriaBruta),
            imagemUrl: produto.image_front_url || null,
            fonte: "OpenFoodFacts"
        };
    } catch {
        return { encontrado: false };
    }
};

const buscarApiLayer = async (eanLimpo) => {
    if (!APILAYER_KEY) return { encontrado: false };

    try {
        const response = await fetch(`https://api.apilayer.com/barcode/lookup?barcode=${eanLimpo}`, {
            method: 'GET',
            headers: {
                'apikey': APILAYER_KEY
            }
        });

        if (!response.ok) return { encontrado: false };

        const data = await response.json();
        const item = data.product || data.products?.[0];

        if (!item || !item.title) return { encontrado: false };

        const nomeBruto = item.title || "Produto sem Nome";
        let categoriaBruta = item.category || deduzirCategoria(nomeBruto);

        return {
            encontrado: true,
            codigoBarra: eanLimpo,
            nome: formatarTexto(nomeBruto),
            marca: formatarTexto(item.brand || item.manufacturer || "Marca Não Informada"),
            categoria: formatarTexto(categoriaBruta),
            imagemUrl: item.images?.[0] || null,
            fonte: "Apilayer"
        };
    } catch {
        return { encontrado: false };
    }
};

export const buscarProdutoPorEan = async (codigoBarra) => {
    try {
        const eanLimpo = codigoBarra.trim().replace(/\D/g, '');

        if (!eanLimpo) {
            return { encontrado: false, mensagem: "Código de barras inválido." };
        }

        // 1º Tenta a API do Cosmos (Melhor qualidade para produtos brasileiros)
        let resultado = await buscarCosmos(eanLimpo);
        if (resultado.encontrado) return resultado;

        // 2º Tenta OpenFoodFacts
        resultado = await buscarOpenFoodFacts(eanLimpo);
        if (resultado.encontrado) return resultado;

        // 3º Tenta ApiLayer
        resultado = await buscarApiLayer(eanLimpo);
        if (resultado.encontrado) return resultado;

        return {
            encontrado: false,
            mensagem: "Produto não encontrado nas bases externas. Preencha os dados manualmente."
        };
    } catch (error) {
        console.error("Erro na busca por EAN:", error);
        return { encontrado: false, mensagem: error.message || "Erro de conexão." };
    }
};