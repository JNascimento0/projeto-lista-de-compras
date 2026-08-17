import { supabase } from './supabaseClient';

/**
 * Retorna as datas de início e fim no formato YYYY-MM-DD sem distorção de fuso horário
 */
export const obterDatasFiltro = (tipoFiltro) => {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = agora.getMonth();

  let inicio, fim;

  if (tipoFiltro === 'este_mes') {
    inicio = new Date(ano, mes, 1);
    fim = new Date(ano, mes + 1, 0);
  } else if (tipoFiltro === 'mes_passado') {
    inicio = new Date(ano, mes - 1, 1);
    fim = new Date(ano, mes, 0);
  } else if (tipoFiltro === 'ultimos_3_meses') {
    inicio = new Date(ano, mes - 2, 1);
    fim = new Date(ano, mes + 1, 0);
  } else if (tipoFiltro === 'este_ano') {
    inicio = new Date(ano, 0, 1);
    fim = new Date(ano, 11, 31);
  } else {
    inicio = new Date(ano, mes, 1);
    fim = new Date(ano, mes + 1, 0);
  }

  // Formatação garantida YYYY-MM-DD considerando horário local
  const formatarDataLocal = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return {
    inicioData: formatarDataLocal(inicio),
    fimData: formatarDataLocal(fim)
  };
};

/**
 * 1. MÉTRICAS DOS CARDS (Total Gasto e Quantidade de Itens no Período)
 */
export const buscarMetricasCards = async (tipoFiltro) => {
  try {
    const { inicioData, fimData } = obterDatasFiltro(tipoFiltro);

    const { data: compras, error } = await supabase
      .from('compras')
      .select(`
        valor_total,
        data_compra,
        itens_compra ( quantidade )
      `)
      .gte('data_compra', inicioData)
      .lte('data_compra', fimData);

    if (error) throw error;
    if (!compras) return { totalGasto: 0, totalItens: 0 };

    const totalGasto = compras.reduce((acc, c) => acc + (Number(c.valor_total) || 0), 0);

    let totalItens = 0;
    compras.forEach(compra => {
      if (compra.itens_compra && Array.isArray(compra.itens_compra)) {
        compra.itens_compra.forEach(item => {
          const qtd = Number(item.quantidade) || 0;

          if (qtd > 100 || (qtd > 0 && qtd < 1)) {
            totalItens += 1;
          } else {
            totalItens += Math.round(qtd);
          }
        });
      }
    });

    return { totalGasto, totalItens };
  } catch (error) {
    console.error('Erro ao buscar métricas:', error.message || error);
    return { totalGasto: 0, totalItens: 0 };
  }
};

/**
 * 2. GASTOS AGRUPADOS POR CATEGORIA (Gráfico de Rosca/Pizza)
 */
export const buscarGastosPorCategoria = async (filtroPeriodo = 'este_mes') => {
  try {
    const { inicioData, fimData } = obterDatasFiltro(filtroPeriodo);

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

    return Object.keys(categoriasAgrupadas).map((cat) => ({
      name: cat,
      value: Number(categoriasAgrupadas[cat].toFixed(2)),
    }));
  } catch (error) {
    console.error('Erro ao buscar gastos por categoria:', error.message || error);
    return [];
  }
};

 /* 3. GASTOS POR ESTABELECIMENTO
 */
export const buscarGastosPorEstabelecimento = async (filtroPeriodo = 'este_mes') => {
  try {
    const { inicioData, fimData } = obterDatasFiltro(filtroPeriodo);

    const { data: compras, error } = await supabase
      .from('compras')
      .select('nome_estabelecimento, valor_total')
      .gte('data_compra', inicioData)
      .lte('data_compra', fimData);

    if (error) throw error;
    if (!compras) return [];

    const agrupado = {};

    compras.forEach(c => {

      const nome = c.nome_estabelecimento && c.nome_estabelecimento.trim() !==''
        ? c.nome_estabelecimento.trim()
        : 'Outros / Não informado';
        
      const valor = Number(c.valor_total) || 0;

      if (!agrupado[nome]) agrupado[nome] = 0;
      agrupado[nome] += valor;
    });

    return Object.keys(agrupado).map(nome => ({
      nome,
      valor: Number(agrupado[nome].toFixed(2))
    }));

  } catch (error) {
    console.error("Erro ao buscar gastos por estabelecimento:", error.message || error);
    return [];
  }
};

/**
 * 4. EVOLUÇÃO MENSAL DOS GASTOS (Gráfico de Barras)
 */
export const buscarEvolucaoMensal = async () => {
  try {
    const { data, error } = await supabase
      .from('compras')
      .select('data_compra, valor_total')
      .order('data_compra', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    const agrupadoPorMes = {};

    data.forEach(compra => {
      if (!compra.data_compra) return;
      
      const [ano, mes, dia] = compra.data_compra.split('-');
      const dataObj = new Date(Number(ano), Number(mes) - 1, Number(dia));
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
  } catch (error) {
    console.error('Erro ao buscar evolução mensal:', error.message || error);
    return [];
  }
};