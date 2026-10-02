import React, { useState, useEffect } from "react";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Sector,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts';
import {
    buscarMetricasCards,
    buscarGastosPorCategoria,
    buscarEvolucaoMensal,
    buscarGastosPorEstabelecimento
} from '../services/relatoriosService';
import {
  ReportIcon,
  LegendDotIcon,
} from '../components/icons';
import EstabelecimentoAxisTick from '../components/charts/EstabelecimentoAxisTick';
import '../styles/Relatorios.css';

const CORES_CATEGORIAS = [
  '#126337', '#2563eb', '#d97706',
  '#dc2626', '#7c3aed', '#db2777',
  '#0891b2', '#65a30d', '#ea580c',
  '#4f46e5', '#0f766e', '#9333ea',
  '#be123c', '#0369a1', '#a16207',
  '#475569'
];

const obterCorCategoria = (index) => {
  return CORES_CATEGORIAS[index % CORES_CATEGORIAS.length];
}

const renderizarSetorCategoria = (props) => {
  const { index } = props;

  return (
    <Sector
      {...props}
      fill={obterCorCategoria(index)}
    />
  );
}

export default function Relatorios() {
    const [filtro, setFiltro] = useState('este_mes');
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState('');

    const [metricas, setMetricas] = useState({ totalGasto: 0, totalItens: 0 });
    const [dadosCategoria, setDadosCategoria] = useState([]);
    const [dadosEvolucao, setDadosEvolucao] = useState([]);
    const [dadosEstabelecimento, setDadosEstabelecimento] = useState([]);

    useEffect(() => {
        carregarDadosRelatorio();
    }, [filtro]);

    const carregarDadosRelatorio = async () => {
        setLoading(true);
        setErro('');

        try {
            const [resMetricas, resCategorias, resEvolucao, resEstabelecimentos] = await Promise.all([
                buscarMetricasCards(filtro),
                buscarGastosPorCategoria(filtro),
                buscarEvolucaoMensal(),
                buscarGastosPorEstabelecimento(filtro)
            ]);

            setMetricas(resMetricas);
            setDadosCategoria(resCategorias);
            setDadosEvolucao(resEvolucao);
            setDadosEstabelecimento(resEstabelecimentos);
        } catch (error) {
            console.error("Erro ao carregar dados dos relatórios:", error);
            setErro(
              'Não foi possível carregar os relatórios. Tente novamente.'
            );

            setMetricas({ totalGasto: 0, totalItens: 0 });
            setDadosCategoria([]);
            setDadosEvolucao([]);
            setDadosEstabelecimento([]);
        } finally {
            setLoading(false);
        }
    };

    const formatarMoeda = (valor) => {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
    <div className="relatorios-container">
      {/* ---------------- CABEÇALHO COM FILTRO ---------------- */}
      <div className="relatorios-header">
        <h2 className="relatorios-title">
          <ReportIcon />
          <span>Relatório Financeiro</span>
        </h2>
        
        <div className="filtro-group">
          <label htmlFor="filtro-periodo">Período:</label>
          <select 
            id="filtro-periodo"
            value={filtro} 
            onChange={(e) => setFiltro(e.target.value)}
            className="select-filtro"
          >
            <option value="este_mes">Este Mês</option>
            <option value="mes_passado">Mês Passado</option>
            <option value="ultimos_3_meses">Últimos 3 Meses</option>
            <option value="este_ano">Este Ano</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          Carregando relatórios...
        </div>
      ) : erro ? (
        <div className="erro-container" role="alert">
          <strong>Não foi possível carregar os relatórios</strong>

          <span>{erro}</span>

          <button
          type="button"
          onClick={carregarDadosRelatorio}
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          {/* ---------------- CARDS SUPERIORES ---------------- */}
          <div className="cards-grid">
            <div className="metric-card">
              <span className="card-label">Total Gasto</span>
              <h3 className="card-value highlight">{formatarMoeda(metricas.totalGasto)}</h3>
            </div>

            <div className="metric-card">
              <span className="card-label">Itens Comprados</span>
              <h3 className="card-value">{metricas.totalItens} un</h3>
            </div>

            <div className="metric-card">
              <span className="card-label">Média por Item</span>
              <h3 className="card-value">
                {metricas.totalItens > 0 
                  ? formatarMoeda(metricas.totalGasto / metricas.totalItens) 
                  : 'R$ 0,00'}
              </h3>
            </div>
          </div>

          {/* ---------------- SEÇÃO DE GRÁFICOS ---------------- */}
          <div className="graficos-grid">
            
            {/* Gráfico 1: Por Categoria */}
            <div className="grafico-card">
              <h3>Gastos por Categoria</h3>
              {dadosCategoria.length === 0 ? (
                <p className="empty-msg">Nenhum registro encontrado neste período.</p>
              ) : (
                <div className="graficos-categorias-wrapper">
                  <div className="graficos-categorias-chart">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={dadosCategoria}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                          shape={renderizarSetorCategoria}
                        />
                        <Tooltip formatter={(value) => formatarMoeda(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="legenda-categorias">
                    {dadosCategoria.map((item, index) => (
                      <div
                        key={item.name}
                        className="legenda-categoria-item"
                      >
                        <LegendDotIcon
                          color={obterCorCategoria(index)}
                          className="legenda-categoria-cor"
                        />
                        <span className="legenda-categoria-nome">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Gráfico 2: Gastos por Estabelecimento */}
            <div className="grafico-card">
              <h3>Gastos por Estabelecimento</h3>
              {dadosEstabelecimento.length === 0 ? (
                <p className="empty-msg">Nenhum registro encontrado neste período.</p>
              ) : (
                <div className="chart-wrapper">
                  <ResponsiveContainer>
                    <BarChart
                      layout="vertical"
                      data={dadosEstabelecimento}
                      margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="nome" 
                        type="category" 
                        width={75} 
                        tickLine={false}
                        axisLine={false}
                        tick={<EstabelecimentoAxisTick />}
                      />
                      <Tooltip formatter={(value) => formatarMoeda(value)} />
                     <Bar
                      dataKey="valor"
                      name="Total Gasto"
                      fill="#126337"
                      radius={[0, 6, 6, 0]}
                      maxBarSize={35}
                     /> 
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Gráfico 3: Evolução Mensal */}
            <div className="grafico-card">
              <h3>Evolução Mensal dos Gastos</h3>
              {dadosEvolucao.length === 0 ? (
                <p className="empty-msg">Sem compras registradas até o momento.</p>
              ) : (
                <div className="chart-wrapper">
                  <ResponsiveContainer>
                    <BarChart data={dadosEvolucao} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="mes" />
                      <YAxis
                        width={96} 
                        tickFormatter={(value) => formatarMoeda(value)}
                      />
                      <Tooltip
                        formatter={(value) => formatarMoeda(value)} />
                      <Bar
                        dataKey="total" 
                        name="Total Gasto" 
                        fill="#126337" 
                        radius={[6, 6, 0, 0]}
                        maxBarSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  );
}