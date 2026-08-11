import React, { useState, useEffect } from "react";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend
} from 'recharts';
import {
    buscarMetricasCards,
    buscarGastosPorCategoria,
    buscarEvolucaoMensal
} from '../services/relatoriosService';
import '../styles/Relatorios.css';

const CORES_CATEGORIAS = [
    '#2563eb', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'
];

export default function Relatorios() {
    const [filtro, setFiltro] = useState('este_mes');
    const [loading, setLoading] = useState(true);

    const [metricas, setMetricas] = useState({ totalGasto: 0, totalItens: 0 });
    const [dadosCategoria, setDadosCategoria] = useState([]);
    const [dadosEvolucao, setDadosEvolucao] = useState([]);

    useEffect(() => {
        carregarDadosRelatorio();
    }, [filtro]);

    const carregarDadosRelatorio = async () => {
        setLoading(true);
        try {
            const [resMetricas, resCategorias, resEvolucao] = await Promise.all([
                buscarMetricasCards(filtro),
                buscarGastosPorCategoria(filtro),
                buscarEvolucaoMensal()
            ]);

            setMetricas(resMetricas);
            setDadosCategoria(resCategorias);
            setDadosEvolucao(resEvolucao);
        } catch (error) {
            console.error("Erro ao carregar dados dos relatórios:", error);
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
        <h2>📊 Relatório Financeiro</h2>
        
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
        <div className="loading-state">Carregando relatórios...</div>
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
                <div style={{ width: '100%', height: 300 }}>
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
                      >
                        {dadosCategoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CORES_CATEGORIAS[index % CORES_CATEGORIAS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatarMoeda(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Gráfico 2: Evolução Mensal */}
            <div className="grafico-card">
              <h3>Evolução Mensal dos Gastos</h3>
              {dadosEvolucao.length === 0 ? (
                <p className="empty-msg">Sem compras registradas até o momento.</p>
              ) : (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={dadosEvolucao} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatarMoeda(value)} />
                      <Bar
                        dataKey="total" 
                        name="Total Gasto" 
                        fill="#2563eb" 
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