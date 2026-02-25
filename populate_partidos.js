const SUPABASE_URL = 'https://wvvxstgpjodmfxpekhkf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2dnhzdGdwam9kbWZ4cGVraGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTczNjQsImV4cCI6MjA4NjczMzM2NH0.Ei2Q1NMMpFPmlzGzHz_9ZU2OpbjaGkoaNTozyv-06kQ';

const partidos = [
    { sigla: 'REPUBLICANOS', nome: 'Republicanos', numero: 10 },
    { sigla: 'PP', nome: 'Progressistas', numero: 11 },
    { sigla: 'PDT', nome: 'Partido Democrático Trabalhista', numero: 12 },
    { sigla: 'PT', nome: 'Partido dos Trabalhadores', numero: 13 },
    { sigla: 'MDB', nome: 'Movimento Democrático Brasileiro', numero: 15 },
    { sigla: 'PSTU', nome: 'Partido Socialista dos Trabalhadores Unificado', numero: 16 },
    { sigla: 'REDE', nome: 'Rede Sustentabilidade', numero: 18 },
    { sigla: 'PODEMOS', nome: 'Podemos', numero: 20 },
    { sigla: 'PCB', nome: 'Partido Comunista Brasileiro', numero: 21 },
    { sigla: 'PL', nome: 'Partido Liberal', numero: 22 },
    { sigla: 'CIDADANIA', nome: 'Cidadania', numero: 23 },
    { sigla: 'PRD', nome: 'Partido Renovação Democrática', numero: 25 },
    { sigla: 'DC', nome: 'Democracia Cristã', numero: 27 },
    { sigla: 'PRTB', nome: 'Partido Renovador Trabalhista Brasileiro', numero: 28 },
    { sigla: 'PCO', nome: 'Partido da Causa Operária', numero: 29 },
    { sigla: 'NOVO', nome: 'Partido Novo', numero: 30 },
    { sigla: 'PMN', nome: 'Partido da Mobilização Nacional', numero: 33 },
    { sigla: 'PMB', nome: 'Partido da Mulher Brasileira', numero: 35 },
    { sigla: 'AGIR', nome: 'Agir', numero: 36 },
    { sigla: 'PSB', nome: 'Partido Socialista Brasileiro', numero: 40 },
    { sigla: 'PV', nome: 'Partido Verde', numero: 43 },
    { sigla: 'UNIÃO', nome: 'União Brasil', numero: 44 },
    { sigla: 'PSDB', nome: 'Partido da Social Democracia Brasileira', numero: 45 },
    { sigla: 'PSOL', nome: 'Partido Socialismo e Liberdade', numero: 50 },
    { sigla: 'PSD', nome: 'Partido Social Democrático', numero: 55 },
    { sigla: 'PCdoB', nome: 'Partido Comunista do Brasil', numero: 65 },
    { sigla: 'AVANTE', nome: 'Avante', numero: 70 },
    { sigla: 'SOLIDARIEDADE', nome: 'Solidariedade', numero: 77 },
    { sigla: 'UP', nome: 'Unidade Popular', numero: 80 },
];

async function populate() {
    console.log(`Inserindo ${partidos.length} partidos...`);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/partidos_politicos`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
        },
        body: JSON.stringify(partidos),
    });

    const body = await res.text();

    if (!res.ok) {
        console.error(`Erro ${res.status}:`, body);
    } else {
        const data = JSON.parse(body);
        console.log(`${data.length} partidos inseridos com sucesso!`);
    }
}

populate();
