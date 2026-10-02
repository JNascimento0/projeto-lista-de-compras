const quebrarNome = (nome, limite = 18) => {
  if (!nome) return [];

  const palavras = nome.trim().split(/\s+/);
  const linhas = [];
  let linhaAtual = '';

  palavras.forEach((palavra) => {
    const novaLinha = linhaAtual
      ? `${linhaAtual} ${palavra}`
      : palavra;

    if (novaLinha.length <= limite) {
      linhaAtual = novaLinha;
    } else {
      if (linhaAtual) {
        linhas.push(linhaAtual);
      }

      linhaAtual = palavra;
    }
  });

  if (linhaAtual) {
    linhas.push(linhaAtual);
  }

  return linhas;
};

export default function EstabelecimentoAxisTick({
  x,
  y,
  payload,
}) {
  const nome = payload?.value || '';
  const linhas = quebrarNome(nome);

  const deslocamentoInicial = -((linhas.length - 1) * 7);

  return (
    <text
      className="eixo-estabelecimento-texto"
      x={x}
      y={y}
      dy={deslocamentoInicial}
      textAnchor="end"
    >
      {linhas.map((linha, index) => (
        <tspan
          key={`${linha}-${index}`}
          x={x}
          dy={index === 0 ? 0 : 14}
        >
          {linha}
        </tspan>
      ))}
    </text>
  );
}