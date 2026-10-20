import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

type Produto = {
  encontrado: true;
  codigoBarra: string;
  nome: string;
  marca: string;
  categoria: string;
  imagemUrl: string | null;
  fonte: string;
};

type Resultado =
  | { status: "encontrado"; produto: Produto }
  | { status: "nao_encontrado" }
  | { status: "falha" };

const formatarTexto = (texto?: string) =>
  (texto ?? "")
    .trim()
    .toLowerCase()
    .split(" ")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");

async function buscarCosmos(ean: string): Promise<Resultado> {
 const token = Deno.env.get("COSMOS_TOKEN");
 if (!token) {
  console.error("COSMOS_TOKEN não configurado.");
  return { status: "falha" };
 } 

 try {
  const resposta = await fetch(
    `https://api.cosmos.bluesoft.com.br/gtins/${ean}.json`,
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Cosmos-API-Request",
        "X-Cosmos-Token": token,
      },
    },
  );

  if (resposta.status === 404) return { status: "não_encontrado" };

  if (!resposta.ok) {
    const corpo = await resposta.text();
    console.error("Cosmos respondeu com status", resposta.status, corpo);
    return { status: "falha" };
  }

  const data = await resposta.json();
  if (!data.description) return { status: "nao_encontrado" };

  let categoria: string =
    data.category?.name ||
    data.category_description ||
    data.gpc?.description ||
    data.gpc?.name ||
    "";
  if (categoria.includes("/")) categoria = categoria.split("/")[0].trim();
  if (!categoria) categoria = "Geral";

  return {
    status: "encontrado",
    produto: {
      encontrado: true,
      codigoBarra: ean,
      nome: formatarTexto(data.description),
      marca: formatarTexto(data.brand?.name || "Marca Não Informada"),
      categoria: formatarTexto(categoria),
      imagemUrl: data.thumbnail ?? null,
      fonte: "Cosmos",
    },
  };
 } catch (erro) {
  console.error("Erro na busca Cosmos:", erro);
  return { status: "falha" };
 }
}

async function buscarOpenFoodFacts(ean: string): Promise<Resultado> {
  try {
    const resposta = await fetch(
      `https://br.openfoodfacts.org/api/v2/product/${ean}.json`,
      { headers: { "User-Agent": "MeuMercado/1.0" } },
    );

    if (resposta.status === 404) return { status: "nao_encontrado" };

    if (!resposta.ok) {
      console.error("OpenFoodFacts respondeu com status", resposta.status);
      return { status: "falha" };
    }

    const data = await resposta.json();
    if (data.status === 0 || !data.product) return { status: "nao_encontrado" };

    const p = data.product;
    const nome = p.product_name || p.product_name_pt;
    if (!nome) return { status: "nao_encontrado" };

    let categoria: string = (p.categories_tags?.[0] ?? "")
      .replace(/^[a-z]{2}:/, "")
      .replace(/-/g, " ");
    if (!categoria) categoria = "Geral";

    return {
      status: "encontrado",
      produto: {
        encontrado: true,
        codigoBarra: ean,
        nome: formatarTexto(nome),
        marca: formatarTexto(p.brands || "Marca Não Informada"),
        categoria: formatarTexto(categoria),
        imagemUrl: p.image_front_url ?? null,
        fonte: "OpenFoodFacts",
      },
    };
  } catch (erro) {
    console.error("Erro na busca OpenFoodFacts:", erro);
    return { status: "falha" };
  }
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req) => {
    const { ean } = await req.json();

    const eanLimpo = String(ean ?? "").replace(/\D/g, "");

    if (!eanLimpo) {
      return Response.json(
        { encontrado: false, mensagem: "Código de barras inválido." },
        { status: 400},
      );
    }

    const cosmos = await buscarCosmos(eanLimpo);
    if (cosmos.status === "encontrado") return Response.json(cosmos.produto);

    const off = await buscarOpenFoodFacts(eanLimpo);
    if (off.status === "encontrado") return Response.json(off.produto);

    if (cosmos.status === "falha" || off.status === "falha") {
      return Response.json(
        { encontrado: false, mensagem: "Falha ao consultar as bases de produtos." },
        { status: 502 },
      );
    }

    return Response.json({ encontrado: false, mensagem: "Produto não encontrado." });
  }),
};