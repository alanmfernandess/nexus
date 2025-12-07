/* NEXUS OS v10.6 - STANDALONE CORE
   Lógica portada do Mega Prompt para JavaScript puro.
   Não requer API Key. Funciona Offline.
*/

// --- ESTADO DO SISTEMA ---
const STATE = {
    balance: 1293800,
    base: 'SBJR',
    pilotName: null,
    phase: 'IDLE', // IDLE, PLANNING, TAXI, FLIGHT, DESCENT, LANDED
    currentMission: null,
    startTime: null,
    fleet: {
        'PR-WWA': { type: 'Arrow IV', status: 'DISPONÍVEL' },
        'PR-NEX': { type: 'Warrior II', status: 'DISPONÍVEL' }
    }
};

// --- SIMULAÇÃO DE DADOS ---
const MISSIONS_DB = [
    { client: 'Mercado Livre Log', cargo: 'Eletrônicos (iPhone/Mac)', weight: 320, dest: 'SBCF', dist: 198, price: 4500 },
    { client: 'Hospital Albert Einstein', cargo: 'Tecido Humano (Transplante)', weight: 15, dest: 'SBSP', dist: 185, price: 8200 },
    { client: 'Bayer Pharma', cargo: 'Insumos Refrigerados', weight: 150, dest: 'SBKP', dist: 245, price: 5100 },
    { client: 'Banco Central', cargo: 'Numerário (Malote)', weight: 480, dest: 'SBBR', dist: 490, price: 12000 }
];

// --- ELEMENTOS DOM ---
const els = {
    chat: document.getElementById('chat-container'),
    input: document.getElementById('user-input'),
    sendBtn: document.getElementById('send-btn'),
    btns: document.querySelectorAll('.action-btn'),
    loader: document.getElementById('processing-bar'),
    balance: document.getElementById('balance-display'),
    phase: document.getElementById('phase-display'),
    clock: document.getElementById('clock-display')
};

// --- FUNÇÕES UTILITÁRIAS ---
const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
const delay = (ms) => new Promise(res => setTimeout(res, ms));
const updateUI = () => {
    els.balance.innerText = formatCurrency(STATE.balance);
    els.phase.innerText = STATE.phase;
};

// --- MOTOR DE LÓGICA (SIMULANDO O GEMINI) ---
async function processCommand(text) {
    text = text.toLowerCase();
    let response = "";

    // 1. LOGIN
    if (!STATE.pilotName) {
        if (text.includes('login') || text.includes('cadastrar')) {
            STATE.pilotName = text.split(' ').pop().toUpperCase();
            return `
Bem-vindo, Comandante **${STATE.pilotName}**.
Identificação confirmada. O sistema NEXUS está pronto para operação de Carga.

**Base Atual:** ${STATE.base}
**Status:** FROTA OPERACIONAL

_Envie "Qual a minha missão?" para iniciar._
            `;
        } else {
            return `Acesso negado. Identifique-se com **"Login [Sobrenome]"**.`;
        }
    }

    // 2. GATILHOS DE MISSÃO
    if (text.includes('missão') || text.includes('escala')) {
        if (STATE.phase !== 'IDLE') return "Missão já em andamento. Complete o voo atual.";
        
        STATE.phase = 'PLANNING';
        const mission = MISSIONS_DB[Math.floor(Math.random() * MISSIONS_DB.length)];
        STATE.currentMission = mission;
        
        // Simula busca de meteo
        const windDir = Math.floor(Math.random() * 360);
        const windSpd = Math.floor(Math.random() * 15) + 3;
        
        return `
### 📋 MANIFESTO DE CARGA (GERADO)
| Item | Detalhe |
| :--- | :--- |
| **Cliente** | ${mission.client} |
| **Carga** | ${mission.cargo} |
| **Peso Total** | ${mission.weight} kg |
| **Rota** | ${STATE.base} > ${mission.dest} |
| **Distância** | ${mission.dist} NM |
| **Receita Est.** | ${formatCurrency(mission.price)} |

**Análise Meteo:** Vento ${windDir}°/${windSpd}kt. Céu Claro.
**Sugestão FL:** FL080 (Vento de proa menor).

> **Aguardando sua decisão de Nível (ex: "Vou de FL080").**
        `;
    }

    // 3. APROVAÇÃO
    if (text.includes('fl') || text.includes('vou de') || text.includes('aprovado')) {
        if (STATE.phase !== 'PLANNING') return "Nenhuma missão planejada.";
        STATE.phase = 'PRE-FLIGHT';
        return `
### 🛫 BRIEFING OPERACIONAL
Plano Aprovado.
- **Combustível Mín:** 45 Galões
- **TOLD (SBJR):** Pista Seca. Vr 65kt.
- **Aeronave:** PR-WWC (Turbo Arrow IV)
- **Status:** Carga sendo embarcada.

> **Reporte "Acionado" para iniciar.**
        `;
    }

    // 4. SOLO
    if (text.includes('acionado') || text.includes('taxi')) {
        if (STATE.phase !== 'PRE-FLIGHT') return "Comando inválido nesta fase.";
        STATE.phase = 'TAXI';
        return `
**Block Time INICIADO.**
Pressão do óleo: Verde.
Magnetos: Checados.

Logística: O caminhão liberou o pátio.
> **Reporte "Fora do solo" na decolagem.**
        `;
    }

    // 5. DECOLAGEM
    if (text.includes('fora do solo') || text.includes('decol')) {
        if (STATE.phase !== 'TAXI') return "Você precisa taxiar antes.";
        STATE.phase = 'FLIGHT';
        STATE.startTime = new Date();
        const now = STATE.startTime.toLocaleTimeString();
        return `
### 🛫 FLIGHT TIME INICIADO
- **Horário:** ${now}
- **Instrução:** Mantenha MP 35" e 2500 RPM na subida.
- **Monitoramento:** CHT estável. Carga segura.

_(Modo CCO Silencioso Ativo)_
        `;
    }

    // 6. CRUZEIRO
    if (text.includes('nivelado')) {
        if (STATE.phase !== 'FLIGHT') return "Você não está voando.";
        return `
**Copiado, Nivelado.**
Parâmetros recebidos via telemetria:
- MP: 30" | RPM: 2400
- Temp Óleo: 180°F (Ideal)

Auditoria: Verifique consumo de combustível.
        `;
    }

    // 7. DESCIDA
    if (text.includes('descida') || text.includes('descendo')) {
        if (STATE.phase !== 'FLIGHT') return "Comando inválido.";
        STATE.phase = 'DESCENT';
        return `
### 📉 PREPARO PARA CHEGADA
Buscando dados de ${STATE.currentMission.dest}...

- **METAR:** 14008KT CAVOK 28/22 Q1015
- **Alerta:** Cuidado com **Shock Cooling**. Reduza potência suavemente.
- **Logística:** Equipe de solo posicionada no TECA.

> **Reporte "No solo".**
        `;
    }

    // 8. POUSO
    if (text.includes('no solo') || text.includes('pouso')) {
        if (STATE.phase !== 'DESCENT') return "Você precisa descer antes.";
        STATE.phase = 'LANDED';
        return `
**Pouso Confirmado.** Flight Time Parado.
Bem-vindo a ${STATE.currentMission.dest}.

Logística:
- Box de Carga: 04
- Desembarque iniciado.

> **Reporte "Corte" para finalizar.**
        `;
    }

    // 9. CORTE E PAGAMENTO
    if (text.includes('corte')) {
        if (STATE.phase !== 'LANDED') return "Aeronave em movimento ou voo.";
        STATE.phase = 'IDLE';
        
        // Cálculos Financeiros
        const receita = STATE.currentMission.price;
        const custoCombustivel = Math.floor(receita * 0.3); // Simulado 30%
        const salario = 350 + (STATE.currentMission.dist * 0.5);
        const lucro = receita - custoCombustivel - salario;
        
        STATE.balance += lucro;
        updateUI();

        return `
### 🛑 CORTE CONFIRMADO & FECHAMENTO
Auditoria realizada com sucesso.

| Categoria | Valor |
| :--- | :--- |
| **Receita Frete** | +${formatCurrency(receita)} |
| **Combustível** | -${formatCurrency(custoCombustivel)} |
| **Salário Piloto** | -${formatCurrency(salario)} |
| **LUCRO MISSÃO** | **${formatCurrency(lucro)}** |

**Saldo Atual:** ${formatCurrency(STATE.balance)}
> **Aeronave pronta para retorno.**
        `;
    }

    // STATUS GERAL
    if (text.includes('status')) {
        return `
### 📊 RELATÓRIO GERAL
- **Comandante:** ${STATE.pilotName || 'N/A'}
- **Saldo:** ${formatCurrency(STATE.balance)}
- **Fase Atual:** ${STATE.phase}
- **Base:** ${STATE.base}

**Frota:**
- PR-WWA: Em Voo
- PR-NEX: Disponível
        `;
    }

    // DEFAULT
    return "Comando não reconhecido pelo protocolo CCO. Tente 'Status' ou verifique o checklist.";
}

// --- INTERFACE ---
function addMessage(sender, text) {
    const div = document.createElement('div');
    div.className = `message ${sender === 'user' ? 'user-msg' : 'system-msg'}`;
    
    if (sender === 'system') {
        const header = `<div class="msg-header">🤖 CCO NEXUS (LOCAL)</div>`;
        const body = `<div class="msg-body">${marked.parse(text)}</div>`;
        div.innerHTML = header + body;
    } else {
        div.innerText = text;
    }
    
    els.chat.appendChild(div);
    els.chat.scrollTop = els.chat.scrollHeight;
}

async function handleSend() {
    const text = els.input.value.trim();
    if (!text) return;
    
    addMessage('user', text);
    els.input.value = '';
    
    // Simula tempo de processamento
    els.loader.style.display = 'flex';
    els.sendBtn.disabled = true;
    
    await delay(800 + Math.random() * 1000); // 0.8s a 1.8s de delay
    
    const reply = await processCommand(text);
    addMessage('system', reply);
    
    els.loader.style.display = 'none';
    els.sendBtn.disabled = false;
    els.input.focus();
}

// Event Listeners
els.sendBtn.addEventListener('click', handleSend);
els.input.addEventListener('keypress', e => { if(e.key === 'Enter') handleSend(); });
els.btns.forEach(btn => btn.addEventListener('click', () => {
    els.input.value = btn.getAttribute('data-cmd');
    handleSend();
}));

// Init
setInterval(() => {
    els.clock.innerText = new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
}, 1000);

// Mensagem Inicial
setTimeout(() => {
    addMessage('system', `
Sistema NEXUS OS v10.6 (Standalone) carregado.
Modo Offline Ativo. Sem dependência de API.

**Identifique-se:** Digite "Login [Sobrenome]".
    `);
}, 500);
