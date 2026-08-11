import { supabase } from './supabaseClient';

/**
 * Retorna as datas de início e fim no formato YYYY-MM-DD (compatível com a coluna 'data_compra')
 */
export const obterDatasFiltro = (tipoFiltro) => {
  const agora = new Date();
  let inicio = new Date();
  let fim = new Date();

  if (tipoFiltro === 'este_mes') {
    inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
    fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
  } else if (tipoFiltro === 'mes_passado') {
    inicio = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
    fim = new Date(agora.getFullYear(), agora.getMonth(), 0);
  } else if (tipoFiltro === 'ultimos_3_meses') {
    inicio = new Date(agora.getFullYear(), agora.getMonth() - 2, 1);
    fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
  } else if (tipoFiltro === 'este_ano') {
    inicio = new Date(agora.getFullYear(), 0, 1);
    fim = new Date(agora.getFullYear(), 11, 31);
  }

  // Formata para 'YYYY-MM-DD'
  const formatarData = (d) => d.toISOString().split('T')[0];

  return {
    inicioData: formatarData(inicio),
    fimData: formatarData(fim)
  };
};

/**
 * 1. MÉTRICAS DOS CARDS (Total Gasto e Quantidade de Itens no Período)
 */
export const buscarMetricasCards = async (tipoFiltro) => {
  const { inicioData, fimData } = obterDatasFiltro(tipoFiltro);

  // Busca compras no intervalo da data_compra trazendo também os itens
  const { data: compras, error } = await supabase
    .from('compras')
    .select(`
      valor_total,
      data_compra,
      itens_compra ( quantidade )
    `)
    .gte('data_compra', inicioData)
    .lte('data_compra', fimData);

  if (error) {
    console.error('Erro ao buscar métricas:', error.message);
    return { totalGasto: 0, totalItens: 0 };
  }

  // Total gasto somando valor_total da tabela compras
  const totalGasto = compras.reduce((acc, c) => acc + (Number(c.valor_total) || 0), 0);

  // Soma de itens comprados cruzando com a tabela relacional
  let totalItens = 0;
  compras.forEach(compra => {
    if (compra.itens_compra && Array.isArray(compra.itens_compra)) {
      compra.itens_compra.forEach(item => {
        totalItens += Number(item.quantidade) || 0;
      });
    }
  });

  return { totalGasto, totalItens };
};

/**
 * 2. GASTOS AGRUPADOS POR CATEGORIA (Gráfico de Rosca/Pizza)
 */
export const buscarGastosPorCategoria = async (filtroPeriodo = 'este_mes') => {
  try {
    const { inicioData, fimData } = obterDatasFiltro(filtroPeriodo);

    // Busca compras filtradas diretamente na consulta do Supabase
    const { data: compras, error } = await supabase
      .from('compras')
      .select(`
        data_compra,
        itens_compra (
          categoria,
          preco_total
        )
      `)
      .gte('data_compra', inicioData)
      .lte('data_compra', fimData);

    if (error) throw error;
    if (!compras) return [];

    // Agrupa os valores por categoria
    const categoriasAgrupadas = {};

    compras.forEach((compra) => {
      if (compra.itens_compra && Array.isArray(compra.itens_compra)) {
        compra.itens_compra.forEach((item) => {
          const nomeCategoria = item.categoria || 'Sem Categoria';
          const valor = Number(item.preco_total) || 0;

          if (!categoriasAgrupadas[nomeCategoria]) {
            categoriasAgrupadas[nomeCategoria] = 0;
          }

          categoriasAgrupadas[nomeCategoria] += valor;
        });
      }
    });

    // Formata para o Recharts ({ name, value })
    return Object.keys(categoriasAgrupadas).map((cat) => ({
      name: cat,
      value: Number(categoriasAgrupadas[cat].toFixed(2)),
    }));
  } catch (error) {
    console.error('Erro ao buscar gastos por categoria:', error.message);
    return [];
  }
};

/**
 * 3. EVOLUÇÃO MENSAL DOS GASTOS (Gráfico de Barras)
 */
export const buscarEvolucaoMensal = async () => {
  const { data, error } = await supabase
    .from('compras')
    .select('data_compra, valor_total')
    .order('data_compra', { ascending: true });

  if (error) {
    console.error('Erro ao buscar evolução mensal:', error.message);
    return [];
  }

  const agrupadoPorMes = {};

  data.forEach(compra => {
    if (!compra.data_compra) return;
    
    // Tratamento para evitar problemas de fuso horário na data
    const [ano, mes, dia] = compra.data_compra.split('-');
    const dataObj = new Date(ano, mes - 1, dia);
    const mesAno = dataObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    
    const valor = Number(compra.valor_total) || 0;

    if (!agrupadoPorMes[mesAno]) {
      agrupadoPorMes[mesAno] = 0;
    }
    agrupadoPorMes[mesAno] += valor;
  });

  return Object.keys(agrupadoPorMes).map((mes) => ({
    mes: mes.replace('.', '').toUpperCase(),
    total: Number(agrupadoPorMes[mes].toFixed(2))
  }));
};