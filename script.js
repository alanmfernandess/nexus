import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// ---------------------------------------------------------
// 1. CONFIGURAÇÃO E ESTADO
// ---------------------------------------------------------
let genAI = null;
let model = null;
let chat = null;

// ELEMENTOS DOM
const els = {
    modal: document.getElementById('auth-modal'),
    keyInput: document.getElementById('api-key-input'),
    connectBtn: document.getElementById('connect-btn'),
    chatContainer: document.getElementById('chat-container'),
    userInput: document.getElementById('user-input'),
    sendBtn: document.getElementById('send-btn'),
    quickBtns: document.querySelectorAll('.action-btn'),
    loader: document.getElementById('processing-bar'),
    clock: document.getElementById('clock-display')
};

// ---------------------------------------------------------
// 2. KERNEL NEXUS (MEGA PROMPT v10.6)
// ---------------------------------------------------------
const SYSTEM_INSTRUCTION = `
*** SYSTEM KERNEL INJECTION: NEXUS OS v10.6 (SILENT CCO EDITION - WEB OPTIMIZED) ***

[DIRETRIZ DE SISTEMA - NÍVEL 0]
ATUE COMO: "CCO NEXUS", sistema de gestão de LOGÍSTICA AÉREA e SIMULADOR DE CARREIRA.
TIPO DE OPERAÇÃO: CARGA PURA (CARGO ONLY). Proibido transporte de passageiros.
HIERARQUIA: O USUÁRIO É O COMANDANTE. O CCO APENAS ACONSELHA.
PROIBIÇÃO ATC: NUNCA aja como Torre/Controle. Não peça "Visual da pista" ou "Reporte posição". Fale apenas de LOGÍSTICA, FÍSICA e MOTOR.
INTERFACE: TEXTO PURO COM MARKDOWN. Use tabelas para dados. Seja conciso (Radio Brevity).
BASE OPERACIONAL: Jacarepaguá (RRJ/SBJR).
REGRA DE HORÁRIO: Se o horário real (UTC-3) for > 22:00 ou < 06:00, a base MUDA para Galeão (SBGL) Terminal de Cargas.

=== 1. A FROTA CARGUEIRA (HARD DATA) ===
A. HEAVY LOGISTICS SQUAD (Arrow IV - Turbo): PR-WWA, WWB, WWC.
   - Specs: MTOW 2900 lbs | Cruise 160 KTAS | Fuel 72 Gal.
   - Física: MP Constante (Turbo), Shock Cooling.

B. FEEDER LOGISTICS SQUAD (Warrior II - Aspirado): PR-NEX, NEY, NEZ.
   - Specs: MTOW 2440 lbs | Cruise 115 KTAS | Fuel 48 Gal.
   - Física: Perda por Densidade, Hélice Passo Fixo.

=== 2. MÓDULOS DE LÓGICA (SIMULADOS VIA TEXTO) ===
1. Meteo: Ao planejar ou descer, SIMULE a busca de dados reais ou use conhecimento interno para criar condições realistas do Rio de Janeiro agora.
2. Economia: Cotação Dólar e Brent baseada em valores reais recentes.
3. Caos (Matriz 50): 5% chance de injetar evento logístico via texto (ex: "Atraso no caminhão").
4. Cronometragem: Use o tempo real decorrido entre as mensagens do usuário para calcular custos.

=== 3. PROTOCOLO DE GATILHOS ===

1. [PLANEJAMENTO] "Qual a minha missão?"
   > OUTPUT FORMAT:
   ### 📋 MANIFESTO DE CARGA
   | Item | Detalhe |
   | :--- | :--- |
   | **Cliente** | [Nome] |
   | **Carga** | [Tipo] ([Kg]) |
   | **Rota** | [Origem] > [Destino] |
   | **Distância** | [NM] |
   | **Sugestão FL** | [FL] |
   > Finalize: "Aguardando decisão."

2. [SOLO] "Acionado"
   > OUTPUT: Inicie Block Time. Pergunte Combustível.

3. [DECOLAGEM] "Fora do solo"
   > OUTPUT:
   ### 🛫 FLIGHT TIME INICIADO
   - **Horário:** [HH:MM] Local
   - **Instrução:** Monitore CHT/TIT na subida. Sem instrução de tráfego.

4. [DESCIDA] "Iniciei descida"
   > OUTPUT:
   ### 📉 PREPARO PARA CHEGADA
   - **Meteo Destino:** [Simule METAR]
   - **Alerta:** Shock Cooling.
   - **Logística:** Solo QAP.

5. [POUSO] "No solo"
   > OUTPUT: Pare Flight Time. Pergunte: "Turnaround Standard (45m) ou Express (20m)?"

6. [CORTE] "Corte"
   > OUTPUT:
   ### 🛑 CORTE CONFIRMADO
   - **Tempo Voo:** [HH:MM]
   - **Auditoria:** Reporte Combustível e Qualidade Pouso.

7. [STATUS] "Status Report"
   > OUTPUT: Tabela financeira e lista de frota.

MANTENHA SEMPRE O FORMATO MARKDOWN.
`;

// ---------------------------------------------------------
// 3. INICIALIZAÇÃO
// ---------------------------------------------------------

// Relógio em Tempo Real
setInterval(() => {
    const now = new Date();
    els.clock.innerText = now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
}, 1000);

// Autenticação
els.connectBtn.addEventListener('click', async () => {
    const key = els.keyInput.value.trim();
    if (!key) return alert('Insira uma chave API válida.');
    
    try {
        genAI = new GoogleGenerativeAI(key);
        model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-pro",
            systemInstruction: SYSTEM_INSTRUCTION
        });
        
        chat = model.startChat({ history: [] });
        
        // Teste de conexão silencioso
        // await chat.sendMessage("Ping system check");
        
        els.modal.style.display = 'none';
        console.log("NEXUS KERNEL: CONECTADO.");
    } catch (error) {
        alert('Erro ao conectar: ' + error.message);
    }
});

// ---------------------------------------------------------
// 4. LÓGICA DE CHAT
// ---------------------------------------------------------

async function handleSend() {
    const text = els.userInput.value.trim();
    if (!text) return;

    // UI Updates
    appendMessage('user', text);
    els.userInput.value = '';
    setLoading(true);

    try {
        // Envia para o Gemini
        const result = await chat.sendMessage(text);
        const response = await result.response;
        const replyText = response.text();
        
        appendMessage('system', replyText);
    } catch (error) {
        console.error(error);
        appendMessage('system', `**ERRO CRÍTICO:** Falha de comunicação com o servidor.\n_${error.message}_`);
    } finally {
        setLoading(false);
        els.userInput.focus();
    }
}

function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender === 'user' ? 'user-msg' : 'system-msg'}`;
    
    if (sender === 'system') {
        // Renderiza Markdown e cria cabeçalho
        const header = `<div class="msg-header">🤖 CCO NEXUS</div>`;
        const body = `<div class="msg-body">${marked.parse(text)}</div>`;
        msgDiv.innerHTML = header + body;
    } else {
        msgDiv.innerText = text;
    }

    els.chatContainer.appendChild(msgDiv);
    els.chatContainer.scrollTop = els.chatContainer.scrollHeight;
}

function setLoading(active) {
    els.sendBtn.disabled = active;
    els.loader.style.display = active ? 'flex' : 'none';
    els.userInput.disabled = active;
}

// ---------------------------------------------------------
// 5. EVENT LISTENERS
// ---------------------------------------------------------

els.sendBtn.addEventListener('click', handleSend);

els.userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});

// Botões Rápidos
els.quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const cmd = btn.getAttribute('data-cmd');
        els.userInput.value = cmd;
        handleSend();
    });
});
