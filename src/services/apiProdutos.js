const COSMOS_TOKEN = import.meta.env.VITE_COSMOS_TOKEN;
const APILAYER_KEY = import.meta.env.VITE_APILAYER_KEY

const buscarOpenFoodFacts = async (eanLimpo) => {
    try {
        const response = await fetch(`https://br.openfoodfacts.org/api/v2/product/${eanLimpo}.json`);
        if (!response.ok) return { encontrado: false };

        const data =await response.json();
        if (data.status === 0 || !data.product) return { encontrado: false};

        const produto = data.product;
        return {
            encontrado: true,
            codigoBarra: eanLimpo,
            nome: produto.product_name || produto.product_name_pt || "Produto sem Nome",
            marca: produto.brands || "Marca Não Informada",
            categoria: produto.categories_tags?.[0]?.replace('pt:', '').replace(/-/g, ' ') || "Geral",
            imagemUrl: produto.image_front_url || null,
            fonte: "OpenFoodFacts"
        }
    } catch {
        return { encontrado: false };
    }
};

const buscarCosmos = async (eanLimpo) => {
    if (!COMSMOS_TOKEN) return { encontrado: false };

    try {
        const response = await fetch(`https://api.cosmos.bluesoft.com.br/gtins/${eanLimpo}.json`,{
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Cosmos-API-Request',
                'X-Cosmos-Token': COSMOS_TOKEN
            }
        });

        if (!response.ok) return {encontrado: false };

        const data = await response.json();
        if (!data.description) return { encontrado: false };

        return {
            encontrado: true,
            codigoBarra: eanLimpo,
            nome: data.description || "Produto sem Nome",
            marca: data.brand?.name || "Marca não Informada",
            categoria: data.category?.description || "Geral",
            imagemUrl: data.thumbnail || null,
            fonte: "Cosmos"
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

        if (!response.ok) return {encontrado: false };

        const data = await response.json();
        const item = data.product || data.products?.[0];

        if (!item || !item.title) return { encontrado: false };

        return {
            encontrado: true,
            codigoBarra: eanLimpo,
            nome: item.title || "Produto sem Nome",
            marca: item.brand || item.manufacturer || "Marca Não Informada",
            categoria: item.category || "Geral",
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
            return { encontrado: false, mensagem: "Código de barras inválido."};
        }

        let resultado = await buscarOpenFoodFacts(eanLimpo);
        if (resultado.encontrado) return resultado;

        resultado = await buscarCosmos(eanLimpo);
        if (resultado.encontrado) return resultado;

        resultado = await buscarApiLayer(eanLimpo);
        if (resultado.encontrado) return resultado;

        return {
            encontrado: false,
            mensagem: "Produto não encontrado nas bases externas. Preencha os dados manualmente."
        };
    } catch (error) {
        console.error("Erro na busco por EAN:", error);
        return { encontrado: false, mensagem: error.message || "Erro de conexão."};
    }
};