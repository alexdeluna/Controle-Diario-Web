// ============================================================
// CONTROLE DIÁRIO — APP.JS Alex de Luna Informática 13/04/2026
// Arquitetura organizada do sistema
// ============================================================
/*
SEÇÕES DO ARQUIVO
1. INICIALIZAÇÃO DO APP
2. UTILIDADES
3. NAVEGAÇÃO DE TELAS
4. GESTÃO DE TURNOS
5. GESTÃO DE CUSTOS
6. RESUMOS E HISTÓRICO
7. RESULTADOS E ESTATÍSTICAS
8. EXPORTAÇÕES
9. METAS
10. EVENTOS E BOTÕES
*/
// ==========================================
// NÚCLEO PROTEGIDO — IMPORTAÇÕES PRINCIPAIS
// NÃO REMOVER NESTA ETAPA DE LIMPEZA
// ==========================================
import { entrar, registrar, sair, observarUsuario, entrarComGoogle } from "./auth.js";
import {
  salvarAbastecimentoFirestore,
  listarAbastecimentosFirestore,
  removerAbastecimentoFirestore,
  salvarOutroCustoFirestore,
  listarOutrosCustosFirestore,
  removerOutroCustoFirestore,
  salvarTurnoAtivoFirestore,
  obterTurnoAtivoFirestore,
  removerTurnoAtivoFirestore,
  salvarTurnoFinalizadoFirestore,
  listarTurnosFirestore,
  removerTurnoFinalizadoFirestore  
} from "./db.js";

// ==========================================
// NÚCLEO PROTEGIDO — ESTADO GLOBAL E NAVEGAÇÃO
// NÃO REMOVER NESTA ETAPA DE LIMPEZA
// ==========================================


let usuarioAtual = null;
let turnoAtivoAtual = null;


const screens = {
    login: document.getElementById('screen-login'),
    menu: document.getElementById('menu-principal'),
    menuTurno: document.getElementById('screen-menu-turno'),
    iniciar: document.getElementById('screen-turno'),
    finalizar: document.getElementById('screen-finalizar-turno'),
    custos: document.getElementById('screen-menu-custos'),
    abastecimento: document.getElementById('screen-abastecimento'),
    outrosCustos: document.getElementById('screen-outros-custos'),
    resumos: document.getElementById('screen-resumos'),
    resumoDiario: document.getElementById('screen-resumo-diario'),
    historicoGeral: document.getElementById('screen-historico-geral'),
    acompanhando: document.getElementById('screen-acompanhando-resultados'),
    metas: document.getElementById('screen-metas'),
    metaMensal: document.getElementById('screen-meta-mensal'),
    metaSemanal: document.getElementById('screen-meta-semanal'),
    metaDiaria: document.getElementById('screen-meta-diaria')
    
};

window.showScreen = showScreen;
window.screens = screens;

function showScreen(screen) {
    Object.values(screens).forEach(s => { if(s) s.classList.add('hidden'); });
    if (screen) screen.classList.remove('hidden');
    window.scrollTo(0, 0);
}

function updateDateTime() {
    const now = new Date();
    const dateEl = document.getElementById('current-date');
    const timeEl = document.getElementById('current-time');
    if(dateEl) dateEl.textContent = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    if(timeEl) timeEl.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateDateTime, 60000);
updateDateTime();


// ============================================================
// 2. UTILIDADES
// ============================================================

function normalizarData(data) {
    const d = new Date(data);
    d.setHours(0, 0, 0, 0);
    return d;
}

function dataBRparaDate(dataBR) {
    if (!dataBR || typeof dataBR !== "string") return null;

    const partes = dataBR.split("/");
    if (partes.length !== 3) return null;

    const [dia, mes, ano] = partes.map(Number);
    const data = new Date(ano, mes - 1, dia);
    data.setHours(0, 0, 0, 0);
    return data;
}

function inicioDaSemana(dataBase) {
    const d = new Date(dataBase);
    const diaSemana = d.getDay();
    const ajuste = diaSemana === 0 ? 6 : diaSemana - 1;
    d.setDate(d.getDate() - ajuste);
    d.setHours(0, 0, 0, 0);
    return d;
}

function inicioDoMes(dataBase) {
    const d = new Date(dataBase.getFullYear(), dataBase.getMonth(), 1);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatarMoeda(valor) {
    return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`;
}

function formatarDataBR(data) {
    return data.toLocaleDateString('pt-BR');
}



// ==========================================
// 3. LÓGICA DE TURNOS E SESSÕES
// NÚCLEO PROTEGIDO — NÃO REMOVER NESTA ETAPA
// ==========================================


async function gerenciarEstadoInterface() {
    const statusInd = document.getElementById('status-indicador');
    const btnIni = document.getElementById('btn-iniciar-turno');

    if (!usuarioAtual) {
        if (statusInd) statusInd.textContent = '🔴 Turno inativo';
        if (btnIni) {
            btnIni.disabled = false;
            btnIni.textContent = "Iniciar Turno";
        }
        turnoAtivoAtual = null;
        return;
    }

    try {
        const turnoAtivo = await obterTurnoAtivoFirestore(usuarioAtual.uid);
        turnoAtivoAtual = turnoAtivo;

        if (turnoAtivo && turnoAtivo.ativo) {
            if (statusInd) statusInd.textContent = '🟢 Turno ativo';
            if (btnIni) {
                btnIni.disabled = true;
                btnIni.textContent = "Turno em Andamento";
            }
        } else {
            if (statusInd) statusInd.textContent = '🔴 Turno inativo';
            if (btnIni) {
                btnIni.disabled = false;
                btnIni.textContent = "Iniciar Turno";
            }
        }
    } catch (erro) {
        console.error("Erro ao verificar turno ativo:", erro);
    }
}

document.getElementById('btn-iniciar-turno').onclick = async () => {
    const h = document.getElementById('hora-inicio').value;
    const k = document.getElementById('km-inicial').value;

    if (!h || !k) return alert("Informe Hora e KM inicial!");
    if (!usuarioAtual) return alert("Faça login primeiro.");

    try {
        await salvarTurnoAtivoFirestore(usuarioAtual.uid, {
            ativo: true,
            horaInicio: h,
            kmInicial: parseFloat(k),
            data: new Date().toLocaleDateString('pt-BR')
        });

        document.getElementById('hora-inicio').value = '';
        document.getElementById('km-inicial').value = '';

        await gerenciarEstadoInterface();
        alert("✅ Turno iniciado com sucesso!");
        showScreen(screens.menu);
    } catch (erro) {
        console.error(erro);
        alert("Erro ao iniciar turno no Firebase.");
    }
};

document.getElementById('btn-finalizar-turno').onclick = async () => {
    if (!usuarioAtual) return alert("Faça login primeiro.");

    try {
        const turnoAtivo = await obterTurnoAtivoFirestore(usuarioAtual.uid);

        if (!turnoAtivo || !turnoAtivo.ativo) {
            return alert("⚠️ Erro: Não há turno ativo!");
        }

        const hF = document.getElementById('hora-fim').value;
        const kF = parseFloat(document.getElementById('km-final').value);
        const apu = parseFloat(document.getElementById('apurado').value);

        if (!hF || isNaN(kF) || isNaN(apu)) {
            return alert("Preencha todos os campos!");
        }

        await salvarTurnoFinalizadoFirestore(usuarioAtual.uid, {
            data: turnoAtivo.data,
            hI: turnoAtivo.horaInicio,
            hF: hF,
            kI: turnoAtivo.kmInicial,
            kF: kF,
            apurado: apu
        });

        await removerTurnoAtivoFirestore(usuarioAtual.uid);

        document.getElementById('hora-fim').value = '';
        document.getElementById('km-final').value = '';
        document.getElementById('apurado').value = '';

        await gerenciarEstadoInterface();
		await atualizarResumoGeral();

        alert("✅ Sessão salva no Firebase!");
        showScreen(screens.menu);
    } catch (erro) {
        console.error(erro);
        alert("Erro ao finalizar turno no Firebase.");
    }
};


// ==========================================
// 4. CUSTOS
// NÚCLEO PROTEGIDO — NÃO REMOVER NESTA ETAPA
// ==========================================

document.getElementById('btn-salvar-abastecimento').onclick = async () => {
    const valor = parseFloat(document.getElementById('valor-abastecimento').value);

    if (!valor) return alert("Valor inválido!");
    if (!usuarioAtual) return alert("Faça login primeiro.");

    try {
        await salvarAbastecimentoFirestore(usuarioAtual.uid, valor);

        document.getElementById('valor-abastecimento').value = "";
		
		await atualizarPainelResumoCustos();
        await atualizarListaAbastecimentosFirestoreUI();
		await atualizarResumoGeral();

        alert("Salvo no Firebase!");
    } catch (erro) {
        console.error(erro);
        alert("Erro ao salvar no Firebase.");
    }
};

document.getElementById('btn-salvar-custo-outro').onclick = async () => {
    const tipo = document.getElementById('tipo-custo').value;
    const descInput = document.getElementById('desc-custo-outros');
    const valorInput = document.getElementById('valor-custo-outro');
    const valor = parseFloat(valorInput.value);

    if (!valor) return alert("Insira o valor do custo!");
    if (!usuarioAtual) return alert("Faça login primeiro.");

    const descricao = tipo === 'Outros' ? descInput.value.trim() : tipo;

    if (!descricao) {
        return alert("Informe a descrição do custo.");
    }

    try {
        await salvarOutroCustoFirestore(usuarioAtual.uid, tipo, descricao, valor);

        valorInput.value = '';
        descInput.value = '';
		await atualizarPainelResumoCustos();
        await atualizarListaOutrosCustosFirestoreUI();
		await atualizarResumoGeral();

        alert("Custo adicionado no Firebase!");
    } catch (erro) {
        console.error(erro);
        alert("Erro ao salvar custo no Firebase.");
    }
};


// ==========================================
// 5. RENDERIZAÇÃO DE CARDS (O CORAÇÃO DO APP)
// NÚCLEO PROTEGIDO — NÃO REMOVER NESTA ETAPA
// ==========================================

async function excluirSessao(data, id) {
    if (!usuarioAtual) {
        alert("Faça login primeiro.");
        return;
    }

    if (!confirm("Deseja excluir esta sessão?")) return;

    try {
        await removerTurnoFinalizadoFirestore(usuarioAtual.uid, id);

        await atualizarResumoGeral();

        const telaResumoDiarioAberta =
            screens.resumoDiario &&
            !screens.resumoDiario.classList.contains('hidden');

        const telaHistoricoAberta =
            screens.historicoGeral &&
            !screens.historicoGeral.classList.contains('hidden');

        const telaAcompanhandoAberta =
            screens.acompanhando &&
            !screens.acompanhando.classList.contains('hidden');

        if (telaResumoDiarioAberta) {
            const hoje = new Date().toLocaleDateString('pt-BR');
            const turnos = await listarTurnosFirestore(usuarioAtual.uid);
            const turnosHoje = turnos.filter(t => t.data === hoje);

            const container = document.querySelector('#screen-resumo-diario .resumo-dia');

            if (turnosHoje.length === 0) {
                if (container) {
                    container.innerHTML = `
                        <p style="text-align:center; opacity:0.7;">
                            Nenhuma sessão finalizada hoje.
                        </p>
                    `;
                }
            } else {
                const abastecimentos = await listarAbastecimentosFirestore(usuarioAtual.uid);
                const outrosCustos = await listarOutrosCustosFirestore(usuarioAtual.uid);

                const historicoHoje = {
                    sessoes: turnosHoje.map(t => ({
                        id: t.id,
                        hI: t.hI,
                        hF: t.hF,
                        kI: t.kI,
                        kF: t.kF,
                        apurado: t.apurado
                    }))
                };

                if (container) {
                    container.innerHTML = renderizarDia(
                        hoje,
                        historicoHoje,
                        abastecimentos,
                        outrosCustos
                    );
                }
            }
        }

if (telaHistoricoAberta) {

    const turnos = await listarTurnosFirestore(usuarioAtual.uid);

    const abastecimentos = await listarAbastecimentosFirestore(usuarioAtual.uid);
    const outrosCustos = await listarOutrosCustosFirestore(usuarioAtual.uid);

    const lista = document.getElementById('lista-historico');

    if (!lista) return;

    // AGRUPAR TURNOS POR DATA
    const historicoAgrupado = agruparTurnosPorData(turnos);

    // PEGAR TODAS AS DATAS
    const datas = Object.keys(historicoAgrupado);

    // ORDENAR DATAS (MAIS RECENTE PRIMEIRO)
    datas.sort((a, b) => {

        const [da, ma, aa] = a.split('/');
        const [db, mb, ab] = b.split('/');

        const dataA = new Date(aa, ma - 1, da);
        const dataB = new Date(ab, mb - 1, db);

        return dataB - dataA;

    });

    if (datas.length === 0) {
        lista.innerHTML = "<p style='text-align:center'>Nenhum histórico encontrado.</p>";
        return;
    }

    // RENDERIZAR HISTÓRICO
    lista.innerHTML = datas.map(data =>
        renderizarDia(
            data,
            historicoAgrupado[data],
            abastecimentos,
            outrosCustos
        )
    ).join('');

}

        if (telaAcompanhandoAberta) {
            const tituloAtual = document.getElementById('resultado-acompanhamento')?.innerText || "";

            if (tituloAtual.includes("Resultado Diário")) {
                await atualizarPainelResultados('diario');
            } else if (tituloAtual.includes("Resultado Semanal")) {
                await atualizarPainelResultados('semanal');
            } else if (tituloAtual.includes("Resultado Mensal")) {
                await atualizarPainelResultados('mensal');
            } else {
                await atualizarPainelResultados('total');
            }
        }

        alert("Sessão excluída com sucesso.");
    } catch (erro) {
        console.error("Erro ao excluir sessão:", erro);
        alert("Erro ao excluir sessão.");
    }
}

window.excluirSessao = excluirSessao;

function renderizarDia(data, infoDia, abastecimentos = [], outrosCustos = []) {
    const abast = abastecimentos
    .filter(a => a.data === data)
    .reduce((acc, a) => acc + Number(a.valor), 0);

	const outros = outrosCustos
    .filter(c => c.data === data)
    .reduce((acc, c) => acc + Number(c.valor), 0);
    
    let totalKM = 0;
    let totalApurado = 0;
    let totalMinutos = 0;

    const sessoesHTML = infoDia.sessoes.map((s, index) => {
        const kmSessao = (s.kF - s.kI);
        totalKM += kmSessao;
        totalApurado += s.apurado;
        
        const [hI, mI] = s.hI.split(':').map(Number);
        const [hF, mF] = s.hF.split(':').map(Number);

        let diff = (hF * 60 + mF) - (hI * 60 + mI);
        if (diff < 0) diff += 1440;

        totalMinutos += diff;

        return `
        <div style="font-size: 13px; color: var(--muted); background: rgba(0,0,0,0.1); padding: 8px; border-radius: 8px; margin-bottom: 8px; position: relative;">
            <strong>Sessão ${index + 1}:</strong> ${s.hI} às ${s.hF} | 
            KM: ${kmSessao} | Apur: R$ ${s.apurado.toFixed(2).replace('.', ',')}
			<button 
				class="btn-excluir"
				onclick="excluirSessao('${data}', '${s.id}')">
				Excluir
			</button>
        </div>`;
    }).join('');

    const lucro = totalApurado - abast - outros;
	
	// CUSTOS TOTAIS
const totalCustos = abast + outros;

// CUSTO POR KM
const custoPorKm = totalKM > 0 ? totalCustos / totalKM : 0;

    // -------------------------
    // MÉTRICAS BRUTAS (APURADO)
    // -------------------------
    const valorHoraBruto = totalMinutos > 0 ? totalApurado / (totalMinutos / 60) : 0;
    const valorKmBruto = totalKM > 0 ? totalApurado / totalKM : 0;

    // -------------------------
    // MÉTRICAS LÍQUIDAS (LUCRO)
    // -------------------------
    const valorHoraLiquido = totalMinutos > 0 ? lucro / (totalMinutos / 60) : 0;
    const valorKmLiquido = totalKM > 0 ? lucro / totalKM : 0;

    const intervaloFormatado =
        `${Math.floor(totalMinutos/60).toString().padStart(2,'0')}:` +
        `${(totalMinutos%60).toString().padStart(2,'0')}h`;

    return `
    <div class="resumo-card">
        <div class="card-header">
            <span class="card-title">Resumo Diário</span>
            <span class="card-date">${data}</span>
        </div>

        <div class="card-body">

            <p><span>Intervalo total:</span> <strong>${intervaloFormatado}</strong></p>
            <p><span>KM total rodado:</span> <strong>${totalKM} km</strong></p>
            <p><span>Total Abastecido:</span> <strong>R$ ${abast.toFixed(2).replace('.',',')}</strong></p>
            <p><span>Outros Custos:</span> <strong>R$ ${outros.toFixed(2).replace('.',',')}</strong></p>
            <p><span>Valor Apurado:</span> <strong>R$ ${totalApurado.toFixed(2).replace('.',',')}</strong></p>

            <hr>

            <p style="color: ${lucro >= 0 ? '#4ade80' : '#ef4444'}; font-size: 18px; font-weight: bold;">
                <span>Lucro do Dia:</span> 
                <span>R$ ${lucro.toFixed(2).replace('.', ',')}</span>
            </p>

            <hr>

            <p style="font-size:14px; font-weight:bold; margin-top:10px;">📊 Produtividade Bruta (Apurado)</p>
            <p>Média por Hora: <strong>R$ ${valorHoraBruto.toFixed(2).replace('.',',')}/h</strong></p>
            <p>Valor por KM: <strong>R$ ${valorKmBruto.toFixed(2).replace('.',',')}/km</strong></p>

            <hr>

            <p style="font-size:14px; font-weight:bold; margin-top:10px;">💰 Rentabilidade Líquida (Lucro)</p>
            <p>Média por Hora: <strong>R$ ${valorHoraLiquido.toFixed(2).replace('.',',')}/h</strong></p>
            <p>Valor por KM: <strong>R$ ${valorKmLiquido.toFixed(2).replace('.',',')}/km</strong></p>

            <hr>

            <p style="font-size: 12px; text-transform: uppercase; color: var(--blue); margin-bottom: 10px; font-weight: bold;">
                Detalhamento de Sessões:
            </p>

            <div>${sessoesHTML}</div>
        </div>
    </div>`;
}
   

// ==========================================
// 6. EVENTOS E NAVEGAÇÃO
// ==========================================

document.querySelectorAll('.menu-card').forEach(card => {
    card.onclick = async () => {
        const action = card.dataset.action;
        if (action === 'turno') showScreen(screens.menuTurno);
        
        if (action === 'custos') { 
    atualizarPainelResumoCustos();
    atualizarListaAbastecimentosFirestoreUI();
    atualizarListaOutrosCustosFirestoreUI();
    showScreen(screens.custos);
}
        if (action === 'resumos') showScreen(screens.resumos);
		if (action === 'metas') showScreen(screens.metas);
		if (action === 'acompanhando') {
    document.getElementById('resultado-acompanhamento').innerHTML =
        '<p style="text-align:center; opacity:0.7;">Selecione uma opção para visualizar os resultados.</p>';
    showScreen(screens.acompanhando);
}
    };
});

document.getElementById('btn-resumo-diario').onclick = async () => {
    if (!usuarioAtual) return alert("Faça login primeiro.");

    try {
        const hoje = new Date().toLocaleDateString('pt-BR');
        const turnos = await listarTurnosFirestore(usuarioAtual.uid);
        const turnosHoje = turnos.filter(t => t.data === hoje);

        if (turnosHoje.length === 0) {
            return alert("Nenhuma sessão finalizada hoje!");
        }
	const abastecimentos = await listarAbastecimentosFirestore(usuarioAtual.uid);
	const outrosCustos = await listarOutrosCustosFirestore(usuarioAtual.uid);
			
        const historicoHoje = {
            sessoes: turnosHoje.map(t => ({
                id: t.id,
                hI: t.hI,
                hF: t.hF,
                kI: t.kI,
                kF: t.kF,
                apurado: t.apurado
            }))
        };

        const container = document.querySelector('#screen-resumo-diario .resumo-dia');
        container.innerHTML = renderizarDia(hoje, historicoHoje, abastecimentos, outrosCustos);

        showScreen(screens.resumoDiario);
    } catch (erro) {
        console.error(erro);
        alert("Erro ao carregar resumo diário.");
    }
};

document.getElementById('btn-historico-geral').onclick = async () => {
    if (!usuarioAtual) return alert("Faça login primeiro.");

    try {
        const turnos = await listarTurnosFirestore(usuarioAtual.uid);
        const historicoAgrupado = agruparTurnosPorData(turnos);
		const abastecimentos = await listarAbastecimentosFirestore(usuarioAtual.uid);
		const outrosCustos = await listarOutrosCustosFirestore(usuarioAtual.uid);

		const lista = document.getElementById('lista-historico');
		const chaves = Object.keys(historicoAgrupado);

        if (chaves.length === 0) {
            lista.innerHTML = "<p style='text-align:center'>Nenhum histórico encontrado.</p>";
        } else {
            lista.innerHTML = chaves.map(data =>
			renderizarDia(data, historicoAgrupado[data], abastecimentos, outrosCustos)
			).join('');
        }

        showScreen(screens.historicoGeral);
    } catch (erro) {
        console.error(erro);
        alert("Erro ao carregar histórico do Firebase.");
    }
};

// Botões Auxiliares
document.getElementById('btn-ir-iniciar-turno').onclick = () => showScreen(screens.iniciar);
document.getElementById('btn-ir-finalizar-turno').onclick = () => showScreen(screens.finalizar);
document.getElementById('btn-ir-abastecimento').onclick = () => showScreen(screens.abastecimento);
document.getElementById('btn-ir-outros-custos').onclick = () => showScreen(screens.outrosCustos);
document.getElementById('btn-hora-atual').onclick = () => document.getElementById('hora-inicio').value = new Date().toTimeString().slice(0, 5);
document.getElementById('btn-hora-final-atual').onclick = () => document.getElementById('hora-fim').value = new Date().toTimeString().slice(0, 5);
document.getElementById('tipo-custo').onchange = (e) => document.getElementById('group-desc-outros').classList.toggle('hidden', e.target.value !== 'Outros');
document.getElementById('btn-resultado-total').onclick = () => atualizarPainelResultados('total');
document.getElementById('btn-resultado-mensal').onclick = () => atualizarPainelResultados('mensal');
document.getElementById('btn-resultado-semanal').onclick = () => atualizarPainelResultados('semanal');
document.getElementById('btn-resultado-diario').onclick = () => atualizarPainelResultados('diario');



// Botões Voltar
const botoesVoltar = [
    ['voltar-menu-principal', screens.menu],
	['voltar-menu-turno', screens.menuTurno],
    ['voltar-menu-finalizar', screens.menuTurno],
	['voltar-custos-principal', screens.menu],
    ['voltar-menu-custos-abast', screens.custos],
	['voltar-menu-custos-outros', screens.custos],
    ['voltar-menu-resumos', screens.menu],
	['voltar-resumo-diario', screens.resumos],
	['voltar-historico', screens.resumos],
	['voltar-acompanhando', screens.menu],
	['voltar-metas-mensal', screens.metas],
    ['voltar-metas-semanal', screens.metas],
    ['voltar-metas-diaria', screens.metas]
    
];
botoesVoltar.forEach(([id, screen]) => {
    const btn = document.getElementById(id);
    if(btn) btn.onclick = () => showScreen(screen);
	
});


// ==========================================
// NÚCLEO PROTEGIDO — LISTAS, EXCLUSÕES E RESUMO DE CUSTOS
// ==========================================

async function atualizarListaAbastecimentosFirestoreUI() {
    if (!usuarioAtual) return;

    const lista = await listarAbastecimentosFirestore(usuarioAtual.uid);
    const hoje = new Date().toLocaleDateString('pt-BR');

    const listaHoje = lista.filter(a => a.data === hoje);
    const ul = document.getElementById("lista-abastecimentos-hoje");
    const totalEl = document.getElementById('total-abastecido-dia');

    if (!ul) return;

    ul.innerHTML = listaHoje.map(a => `
        <li style="
            background:#374151;
            padding:10px;
            border-radius:8px;
            margin-bottom:6px;
            display:flex;
            justify-content:space-between;
            align-items:center;
        ">
            <span>
                ⛽ ${a.hora || '--:--'} •
                <strong>R$ ${Number(a.valor).toFixed(2).replace('.', ',')}</strong>
            </span>

            <button
                class="btn-excluir"
                onclick="window.excluirAbastecimentoFirestore('${a.id}')">
                Excluir
            </button>
        </li>
    `).join('');

    const total = listaHoje.reduce((acc, a) => acc + Number(a.valor), 0);
    if (totalEl) {
        totalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }
}

async function atualizarListaOutrosCustosFirestoreUI() {
    if (!usuarioAtual) return;

    const hoje = new Date().toLocaleDateString('pt-BR');
    const custos = await listarOutrosCustosFirestore(usuarioAtual.uid);

    const custosHoje = custos.filter(c => c.data === hoje);

    const total = custosHoje.reduce((acc, c) => acc + Number(c.valor), 0);

    const totalUI = document.getElementById('total-outros-valor');
    const listaUI = document.getElementById('lista-detalhada-custos');

    if (totalUI) {
        totalUI.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    if (listaUI) {
        listaUI.innerHTML = custosHoje.map(c => `
            <li style="background:#374151;padding:10px;border-radius:8px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">
                <span>${c.desc}</span>

                <div style="display:flex;gap:10px;align-items:center;">
                    <strong>R$ ${Number(c.valor).toFixed(2).replace('.', ',')}</strong>

                    <button
                        class="btn-excluir"
                        onclick="window.excluirOutroCustoFirestore('${c.id}')">
                        Excluir
                    </button>
                </div>
            </li>
        `).join('');
    }
}

window.excluirOutroCustoFirestore = async function(id) {
    if (!usuarioAtual) return;
    if (!confirm("Deseja remover este custo?")) return;

    await removerOutroCustoFirestore(usuarioAtual.uid, id);
    await atualizarListaOutrosCustosFirestoreUI();
	await atualizarPainelResumoCustos();
	await atualizarResumoGeral();
};

// ==========================================
// NÚCLEO PROTEGIDO — AUTENTICAÇÃO E SESSÃO
// NÃO REMOVER NESTA ETAPA DE LIMPEZA
// ==========================================


function configurarLogin() {
    const btnEntrar = document.getElementById('btn-entrar');
    const btnRegistrar = document.getElementById('btn-registrar');
    const status = document.getElementById('login-status');
	const btnGoogleLogin = document.getElementById("btnGoogleLogin");

if (btnGoogleLogin) {
  btnGoogleLogin.onclick = async () => {
    try {
      await entrarComGoogle();
    } catch (error) {
      console.error("Erro login Google:", error);
    }
  };
}

    if (btnEntrar) {
        btnEntrar.onclick = async () => {
            const email = document.getElementById('login-email').value.trim();
            const senha = document.getElementById('login-senha').value.trim();

            if (!email || !senha) {
                status.textContent = 'Preencha e-mail e senha.';
                return;
            }

            try {
                status.textContent = 'Entrando...';
                await entrar(email, senha);
                status.textContent = 'Login realizado com sucesso.';
            } catch (erro) {
                status.textContent = 'Erro ao entrar: ' + erro.message;
            }
        };
    }

    if (btnRegistrar) {
        btnRegistrar.onclick = async () => {
            const email = document.getElementById('login-email').value.trim();
            const senha = document.getElementById('login-senha').value.trim();

            if (!email || !senha) {
                status.textContent = 'Preencha e-mail e senha.';
                return;
            }

            try {
                status.textContent = 'Criando conta...';
                await registrar(email, senha);
                status.textContent = 'Conta criada com sucesso.';
            } catch (erro) {
                status.textContent = 'Erro ao registrar: ' + erro.message;
            }
        };
    }

    observarUsuario(async (user) => {
    usuarioAtual = user;

    if (user) {
        showScreen(screens.menu);
		
		await gerenciarEstadoInterface();
        await atualizarPainelResumoCustos();
        await atualizarListaAbastecimentosFirestoreUI();
        await atualizarListaOutrosCustosFirestoreUI();
		await atualizarResumoGeral();
    } else {
		turnoAtivoAtual = null;
        showScreen(screens.login);
    }

	const campoUsuario = document.getElementById("usuarioLogado");

if (user && campoUsuario) {
  campoUsuario.textContent = user.email;
}	
});

const btnLogout = document.getElementById('btn-logout');

if (btnLogout) {
    btnLogout.onclick = async () => {
        try {
            await sair();
            alert("Logout realizado com sucesso.");
        } catch (erro) {
            console.error(erro);
            alert("Erro ao sair da conta.");
        }
    };
}

}

window.excluirAbastecimentoFirestore = async function(id) {
    if (!usuarioAtual) return;
    if (!confirm("Deseja remover este abastecimento?")) return;

    await removerAbastecimentoFirestore(usuarioAtual.uid, id);
    await atualizarListaAbastecimentosFirestoreUI();
	await atualizarPainelResumoCustos();
	await atualizarResumoGeral();
};

// ============================================================
// 1. INICIALIZAÇÃO DO APP
// ============================================================

// NÚCLEO PROTEGIDO — INICIALIZAÇÃO PRINCIPAL DO APP

window.onload = () => {
    configurarLogin();

    if (usuarioAtual) {
        gerenciarEstadoInterface();
    }
};

// NÚCLEO PROTEGIDO — AGRUPAMENTO BASE DO HISTÓRICO

function agruparTurnosPorData(turnos) {
    const agrupado = {};

    turnos.forEach(t => {
        const data = t.data;

        if (!agrupado[data]) {
            agrupado[data] = { sessoes: [] };
        }

        agrupado[data].sessoes.push({
            id: t.id,
            hI: t.hI,
            hF: t.hF,
            kI: t.kI,
            kF: t.kF,
            apurado: t.apurado
        });
    });

    return agrupado;
}
// ==========================================
// 8. EXPORTAÇÃO (PDF E EXCEL) REVISADA
// NÚCLEO PROTEGIDO — NÃO REMOVER NESTA ETAPA
// ==========================================

function dataBRparaDateExportacao(dataStr) {
    if (!dataStr || typeof dataStr !== "string") return null;

    const partes = dataStr.split('/');
    if (partes.length !== 3) return null;

    const [d, m, y] = partes.map(Number);
    const data = new Date(y, m - 1, d);
    data.setHours(0, 0, 0, 0);
    return data;
}

function calcularMinutosSessaoExportacao(hI, hF) {
    if (!hI || !hF) return 0;

    const [horaInicio, minInicio] = hI.split(':').map(Number);
    const [horaFim, minFim] = hF.split(':').map(Number);

    let diff = (horaFim * 60 + minFim) - (horaInicio * 60 + minInicio);
    if (diff < 0) diff += 1440;

    return diff;
}

function formatarMoedaExportacao(valor) {
    return Number(valor || 0).toFixed(2);
}

function formatarTempoExportacao(totalMinutos) {
    const horas = Math.floor(totalMinutos / 60).toString().padStart(2, '0');
    const minutos = (totalMinutos % 60).toString().padStart(2, '0');
    return `${horas}:${minutos}h`;
}

function obterResumoDiaExportacao(data, infoDia, abastecimentos, outrosCustos) {
    const abast = abastecimentos
        .filter(a => a.data === data)
        .reduce((acc, a) => acc + Number(a.valor || 0), 0);

    const outros = outrosCustos
        .filter(c => c.data === data)
        .reduce((acc, c) => acc + Number(c.valor || 0), 0);

    let totalKM = 0;
    let totalApurado = 0;
    let totalMinutos = 0;

    const corpoTabela = infoDia.sessoes.map((s, idx) => {
        const kmSessao = Number(s.kF || 0) - Number(s.kI || 0);
        totalKM += kmSessao;
        totalApurado += Number(s.apurado || 0);
        totalMinutos += calcularMinutosSessaoExportacao(s.hI, s.hF);

        return [
            idx + 1,
            s.hI || '--:--',
            s.hF || '--:--',
            `${kmSessao} km`,
            `R$ ${formatarMoedaExportacao(s.apurado)}`
        ];
    });

    const lucro = totalApurado - abast - outros;
    const horas = totalMinutos / 60;

    return {
        data,
        abast,
        outros,
        totalKM,
        totalApurado,
        totalMinutos,
        lucro,
        valorHoraApurado: horas > 0 ? totalApurado / horas : 0,
        valorKmApurado: totalKM > 0 ? totalApurado / totalKM : 0,
        valorHoraLucro: horas > 0 ? lucro / horas : 0,
        valorKmLucro: totalKM > 0 ? lucro / totalKM : 0,
        corpoTabela
    };
}

// --- EXPORTAR PARA PDF (COM TOTAIS E LUCRO) ---
document.getElementById('export-pdf').onclick = async () => {
    if (!usuarioAtual) return alert("Faça login primeiro.");

    try {
        const [turnos, abastecimentos, outrosCustos] = await Promise.all([
            listarTurnosFirestore(usuarioAtual.uid),
            listarAbastecimentosFirestore(usuarioAtual.uid),
            listarOutrosCustosFirestore(usuarioAtual.uid)
        ]);

        const historico = agruparTurnosPorData(turnos);
        const chaves = Object.keys(historico).reverse();

        if (chaves.length === 0) {
            alert("Não há dados para exportar!");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        let yPos = 20;
        doc.setFontSize(16);
        doc.text("Relatório Detalhado - Controle Diário", 14, yPos);
        yPos += 10;

        chaves.forEach((data) => {
            const infoDia = historico[data];
            const resumoDia = obterResumoDiaExportacao(data, infoDia, abastecimentos, outrosCustos);

            if (yPos > 240) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(11);
            doc.setTextColor(255, 255, 255);
            doc.setFillColor(31, 41, 51);
            doc.rect(14, yPos, 182, 7, 'F');
            doc.text(`DATA: ${data}`, 16, yPos + 5);

            doc.autoTable({
                startY: yPos + 7,
                head: [['Sessão', 'Início', 'Fim', 'KM', 'Apurado']],
                body: resumoDia.corpoTabela,
                theme: 'grid',
                headStyles: { fillColor: [55, 65, 81] },
                styles: { fontSize: 9 },
                margin: { left: 14 }
            });

            yPos = doc.lastAutoTable.finalY + 6;

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);

            const resumo = [
                `Intervalo Total: ${formatarTempoExportacao(resumoDia.totalMinutos)} | KM Total: ${resumoDia.totalKM} km`,
                `Combustível: R$ ${formatarMoedaExportacao(resumoDia.abast)} | Outros Custos: R$ ${formatarMoedaExportacao(resumoDia.outros)}`,
                `Total Apurado: R$ ${formatarMoedaExportacao(resumoDia.totalApurado)}`,
                `Lucro do Dia: R$ ${formatarMoedaExportacao(resumoDia.lucro)}`,
                `Média (Apurado): R$ ${formatarMoedaExportacao(resumoDia.valorHoraApurado)}/h | R$ ${formatarMoedaExportacao(resumoDia.valorKmApurado)}/km`,
                `Média (Lucro): R$ ${formatarMoedaExportacao(resumoDia.valorHoraLucro)}/h | R$ ${formatarMoedaExportacao(resumoDia.valorKmLucro)}/km`
            ];

            resumo.forEach(linha => {
                doc.text(linha, 14, yPos);
                yPos += 5;
            });

            yPos += 7;
        });

        doc.save("Relatorio_Controle_Diario.pdf");
    } catch (erro) {
        console.error("Erro ao exportar PDF:", erro);
        alert("Erro ao exportar PDF.");
    }
};

// --- EXPORTAR PARA EXCEL (CSV DETALHADO) ---
document.getElementById('export-excel').onclick = async () => {
    if (!usuarioAtual) return alert("Faça login primeiro.");

    try {
        const [turnos, abastecimentos, outrosCustos] = await Promise.all([
            listarTurnosFirestore(usuarioAtual.uid),
            listarAbastecimentosFirestore(usuarioAtual.uid),
            listarOutrosCustosFirestore(usuarioAtual.uid)
        ]);

        const historico = agruparTurnosPorData(turnos);
        const chaves = Object.keys(historico).reverse();

        if (chaves.length === 0) {
            alert("Não há dados!");
            return;
        }

        let csv = "Data;Intervalo;KM Total;Abastecimento;Outros;Apurado;Lucro;Media/h Apurado;R$/km Apurado;Media/h Lucro;R$/km Lucro\n";

        let somaKM = 0;
        let somaApurado = 0;
        let somaLucro = 0;
        let somaAbast = 0;
        let somaOutros = 0;
        let somaMin = 0;

        chaves.forEach(data => {
            const infoDia = historico[data];
            const resumoDia = obterResumoDiaExportacao(data, infoDia, abastecimentos, outrosCustos);

            csv += `${data};${formatarTempoExportacao(resumoDia.totalMinutos)};${resumoDia.totalKM};${formatarMoedaExportacao(resumoDia.abast)};${formatarMoedaExportacao(resumoDia.outros)};${formatarMoedaExportacao(resumoDia.totalApurado)};${formatarMoedaExportacao(resumoDia.lucro)};${formatarMoedaExportacao(resumoDia.valorHoraApurado)};${formatarMoedaExportacao(resumoDia.valorKmApurado)};${formatarMoedaExportacao(resumoDia.valorHoraLucro)};${formatarMoedaExportacao(resumoDia.valorKmLucro)}\n`;

            somaKM += resumoDia.totalKM;
            somaApurado += resumoDia.totalApurado;
            somaLucro += resumoDia.lucro;
            somaAbast += resumoDia.abast;
            somaOutros += resumoDia.outros;
            somaMin += resumoDia.totalMinutos;
        });

        const horasTotais = somaMin / 60;

        const mediaHoraApuradoGeral = horasTotais > 0 ? somaApurado / horasTotais : 0;
        const kmApuradoGeral = somaKM > 0 ? somaApurado / somaKM : 0;

        const mediaHoraLucroGeral = horasTotais > 0 ? somaLucro / horasTotais : 0;
        const kmLucroGeral = somaKM > 0 ? somaLucro / somaKM : 0;

        csv += "\n";
        csv += `TOTAL;;${somaKM};${formatarMoedaExportacao(somaAbast)};${formatarMoedaExportacao(somaOutros)};${formatarMoedaExportacao(somaApurado)};${formatarMoedaExportacao(somaLucro)};;;;\n`;
        csv += `MEDIA GERAL;;;;;;;${formatarMoedaExportacao(mediaHoraApuradoGeral)};${formatarMoedaExportacao(kmApuradoGeral)};${formatarMoedaExportacao(mediaHoraLucroGeral)};${formatarMoedaExportacao(kmLucroGeral)}\n`;

        const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, "Relatorio_Controle_Diario.csv");
    } catch (erro) {
        console.error("Erro ao exportar CSV detalhado:", erro);
        alert("Erro ao exportar CSV.");
    }
};

// --- EXPORTAR RELATÓRIO MENSAL ---
document.getElementById('export-mensal').onclick = async () => {
    if (!usuarioAtual) return alert("Faça login primeiro.");

    try {
        const [turnos, abastecimentos, outrosCustos] = await Promise.all([
            listarTurnosFirestore(usuarioAtual.uid),
            listarAbastecimentosFirestore(usuarioAtual.uid),
            listarOutrosCustosFirestore(usuarioAtual.uid)
        ]);

        if (turnos.length === 0) {
            alert("Não há dados!");
            return;
        }

        const historico = agruparTurnosPorData(turnos);
        const meses = {};

        Object.keys(historico).forEach(data => {
            const infoDia = historico[data];
            const resumoDia = obterResumoDiaExportacao(data, infoDia, abastecimentos, outrosCustos);

            const dataObj = dataBRparaDateExportacao(data);
            if (!dataObj) return;

            const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
            const ano = dataObj.getFullYear();
            const chaveMes = `${mes}/${ano}`;

            if (!meses[chaveMes]) {
                meses[chaveMes] = {
                    km: 0,
                    apurado: 0,
                    lucro: 0,
                    abast: 0,
                    outros: 0,
                    minutos: 0
                };
            }

            meses[chaveMes].km += resumoDia.totalKM;
            meses[chaveMes].apurado += resumoDia.totalApurado;
            meses[chaveMes].lucro += resumoDia.lucro;
            meses[chaveMes].abast += resumoDia.abast;
            meses[chaveMes].outros += resumoDia.outros;
            meses[chaveMes].minutos += resumoDia.totalMinutos;
        });

        const chavesMeses = Object.keys(meses).sort((a, b) => {
            const [mesA, anoA] = a.split('/').map(Number);
            const [mesB, anoB] = b.split('/').map(Number);
            return new Date(anoA, mesA - 1, 1) - new Date(anoB, mesB - 1, 1);
        });

        let csv = "Mes;KM Total;Abastecimento;Outros;Apurado;Lucro;Media/h Apurado;R$/km Apurado;Media/h Lucro;R$/km Lucro\n";

        chavesMeses.forEach(chaveMes => {
            const dados = meses[chaveMes];
            const horas = dados.minutos / 60;

            const mediaHoraApurado = horas > 0 ? dados.apurado / horas : 0;
            const kmApurado = dados.km > 0 ? dados.apurado / dados.km : 0;

            const mediaHoraLucro = horas > 0 ? dados.lucro / horas : 0;
            const kmLucro = dados.km > 0 ? dados.lucro / dados.km : 0;

            csv += `${chaveMes};${dados.km};${formatarMoedaExportacao(dados.abast)};${formatarMoedaExportacao(dados.outros)};${formatarMoedaExportacao(dados.apurado)};${formatarMoedaExportacao(dados.lucro)};${formatarMoedaExportacao(mediaHoraApurado)};${formatarMoedaExportacao(kmApurado)};${formatarMoedaExportacao(mediaHoraLucro)};${formatarMoedaExportacao(kmLucro)}\n`;
        });

        const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, "Relatorio_Mensal.csv");
    } catch (erro) {
        console.error("Erro ao exportar relatório mensal:", erro);
        alert("Erro ao exportar relatório mensal.");
    }
};


// Função que realiza as somas (adicione ao final do arquivo)
async function atualizarPainelResumoCustos() {
    if (!usuarioAtual) return;

    try {
        const hoje = new Date().toLocaleDateString('pt-BR');

        const abastecimentos = await listarAbastecimentosFirestore(usuarioAtual.uid);
        const outrosCustos = await listarOutrosCustosFirestore(usuarioAtual.uid);

        const abastecimentosHoje = abastecimentos.filter(a => a.data === hoje);
        const custosHoje = outrosCustos.filter(c => c.data === hoje);

        const totalAbast = abastecimentosHoje.reduce((acc, a) => acc + Number(a.valor), 0);
        const totalOutros = custosHoje.reduce((acc, c) => acc + Number(c.valor), 0);
        const total = totalAbast + totalOutros;

        const abastEl = document.getElementById('resumo-custo-abast');
        const outrosEl = document.getElementById('resumo-custo-outros');
        const totalEl = document.getElementById('resumo-custo-total');

        if (abastEl) abastEl.textContent = `R$ ${totalAbast.toFixed(2).replace('.', ',')}`;
        if (outrosEl) outrosEl.textContent = `R$ ${totalOutros.toFixed(2).replace('.', ',')}`;
        if (totalEl) totalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    } catch (erro) {
        console.error("Erro ao atualizar resumo de custos:", erro);
    }
}

// ==========================================
// 9. LÓGICA DE METAS (PADRÃO VISUAL APP)
// ==========================================

// --- NAVEGAÇÃO DOS BOTÕES DO MENU DE METAS ---
document.getElementById('btn-meta-mensal').onclick = async () => {
    showScreen(screens.metaMensal);
    await atualizarProgressoMeta('mensal');
};

document.getElementById('btn-meta-semanal').onclick = async () => {
    showScreen(screens.metaSemanal);
    await atualizarProgressoMeta('semanal');
};

document.getElementById('btn-meta-diaria').onclick = async () => {
    showScreen(screens.metaDiaria);
    await atualizarProgressoMeta('diario');
};


// --- SALVAR VALORES DAS METAS ---
const salvarMetaSimples = async (tipo) => {
    const input = document.getElementById(`input-meta-${tipo}`);
    if (!input || !input.value) return alert("Insira um valor!");

    localStorage.setItem(`config_meta_${tipo}`, input.value);
    await atualizarProgressoMeta(tipo === 'diaria' ? 'diario' : tipo);
    alert("Meta salva!");
};

if (document.getElementById('btn-salvar-meta-mensal')) {
    document.getElementById('btn-salvar-meta-mensal').onclick = async () => {
        await salvarMetaSimples('mensal');
    };
}

if (document.getElementById('btn-salvar-meta-semanal')) {
    document.getElementById('btn-salvar-meta-semanal').onclick = async () => {
        await salvarMetaSimples('semanal');
    };
}

if (document.getElementById('btn-salvar-meta-diaria')) {
    document.getElementById('btn-salvar-meta-diaria').onclick = async () => {
        await salvarMetaSimples('diaria');
    };
}

// --- ATUALIZAR INTERFACE DE PROGRESSO ---
async function atualizarProgressoMeta(tipo) {
    const chaveMeta = tipo === 'diario' ? 'diaria' : tipo;
    const meta = parseFloat(localStorage.getItem(`config_meta_${chaveMeta}`)) || 0;
    const container = document.getElementById(`progresso-${tipo}`);

    if (!container) return;
    if (!usuarioAtual) {
        container.innerHTML = `<p style="opacity:0.7;">Faça login para visualizar o progresso.</p>`;
        return;
    }

    try {
        const lucro = await calcularLucroParaMeta(tipo);
        const falta = meta - lucro;

        if (tipo === 'diario') {
            const cor = falta <= 0 ? "#4ade80" : "#fbbf24";
            const msg = falta <= 0 ? "🎉 META BATIDA!" : "Meta não batida";

            container.innerHTML = `
                <h2 style="color:${cor}">${msg}</h2>
                <p>Meta configurada: R$ ${meta.toFixed(2).replace('.', ',')}</p>
                <p>Lucro hoje: R$ ${lucro.toFixed(2).replace('.', ',')}</p>
                <p>Faltam: R$ ${falta > 0 ? falta.toFixed(2).replace('.', ',') : '0,00'}</p>
            `;
        } else {
            container.innerHTML = `
                <p>Sua meta: <strong>R$ ${meta.toFixed(2).replace('.', ',')}</strong></p>
                <p>Lucro acumulado: <span style="color:#4ade80">R$ ${lucro.toFixed(2).replace('.', ',')}</span></p>
                <h3 style="margin-top:10px; color:#fbbf24">
                    ${falta <= 0 ? "🎉 Meta Concluída!" : "Faltam: R$ " + falta.toFixed(2).replace('.', ',')}
                </h3>
            `;
        }
    } catch (erro) {
        console.error("Erro ao atualizar progresso da meta:", erro);
        container.innerHTML = `<p style="color:#f87171;">Erro ao carregar progresso da meta.</p>`;
    }
}

// --- LOGICA ESPECIFICA: META POR DATA E VALOR ---



async function calcularLucroAcumuladoAteHoje() {
    if (!usuarioAtual) return 0;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    inicioMes.setHours(0, 0, 0, 0);

    const [turnos, abastecimentos, outrosCustos] = await Promise.all([
        listarTurnosFirestore(usuarioAtual.uid),
        listarAbastecimentosFirestore(usuarioAtual.uid),
        listarOutrosCustosFirestore(usuarioAtual.uid)
    ]);

   
    function estaNoPeriodo(dataItem) {
        return dataItem && dataItem >= inicioMes && dataItem <= hoje;
    }

    let ganhos = 0;
    let custos = 0;

    turnos.forEach(t => {
        const dataTurno = dataBRparaDate(t.data);
        if (estaNoPeriodo(dataTurno)) {
            ganhos += Number(t.apurado || 0);
        }
    });

    abastecimentos.forEach(a => {
        const dataAbast = dataBRparaDate(a.data);
        if (estaNoPeriodo(dataAbast)) {
            custos += Number(a.valor || 0);
        }
    });

    outrosCustos.forEach(c => {
        const dataCusto = dataBRparaDate(c.data);
        if (estaNoPeriodo(dataCusto)) {
            custos += Number(c.valor || 0);
        }
    });

    return ganhos - custos;
}



// --- BOTÕES VOLTAR ---
document.getElementById('voltar-meta-mensal').onclick = () => showScreen(screens.metas);
document.getElementById('voltar-meta-semanal').onclick = () => showScreen(screens.metas);
document.getElementById('voltar-meta-diaria').onclick = () => showScreen(screens.metas);


async function calcularLucroParaMeta(tipo) {
    if (!usuarioAtual) return 0;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const [turnos, abastecimentos, outrosCustos] = await Promise.all([
        listarTurnosFirestore(usuarioAtual.uid),
        listarAbastecimentosFirestore(usuarioAtual.uid),
        listarOutrosCustosFirestore(usuarioAtual.uid)
    ]);

    function dataBRparaDate(dataStr) {
        if (!dataStr || typeof dataStr !== "string") return null;

        const partes = dataStr.split('/');
        if (partes.length !== 3) return null;

        const [d, m, y] = partes.map(Number);
        const data = new Date(y, m - 1, d);
        data.setHours(0, 0, 0, 0);
        return data;
    }

    const inicioSemana = inicioDaSemana(hoje);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    inicioMes.setHours(0, 0, 0, 0);

    function estaNoPeriodo(dataItem) {
        if (!dataItem) return false;

        if (tipo === 'mensal') {
            return dataItem >= inicioMes && dataItem <= hoje;
        }

        if (tipo === 'semanal') {
            return dataItem >= inicioSemana && dataItem <= hoje;
        }

        if (tipo === 'diario' || tipo === 'diaria' || tipo === 'diario') {
            return dataItem.getTime() === hoje.getTime();
        }

        return false;
    }

    let ganhos = 0;
    let custos = 0;

    turnos.forEach(t => {
        const dataTurno = dataBRparaDate(t.data);
        if (estaNoPeriodo(dataTurno)) {
            ganhos += Number(t.apurado || 0);
        }
    });

    abastecimentos.forEach(a => {
        const dataAbast = dataBRparaDate(a.data);
        if (estaNoPeriodo(dataAbast)) {
            custos += Number(a.valor || 0);
        }
    });

    outrosCustos.forEach(c => {
        const dataCusto = dataBRparaDate(c.data);
        if (estaNoPeriodo(dataCusto)) {
            custos += Number(c.valor || 0);
        }
    });

    return ganhos - custos;
}

// ==========================================
// NÚCLEO PROTEGIDO — RESUMO GERAL E RESULTADOS
// NÃO REMOVER NESTA ETAPA DE LIMPEZA
// ==========================================

async function atualizarResumoGeral() {
    if (!usuarioAtual) return;

    try {
        const [turnos, abastecimentos, outrosCustos] = await Promise.all([
            listarTurnosFirestore(usuarioAtual.uid),
            listarAbastecimentosFirestore(usuarioAtual.uid),
            listarOutrosCustosFirestore(usuarioAtual.uid)
        ]);

        let totalApurado = 0;

        turnos.forEach(t => {
            totalApurado += Number(t.apurado || 0);
        });

        const totalAbastecimento = abastecimentos.reduce(
            (acc, a) => acc + Number(a.valor || 0),
            0
        );

        const totalOutros = outrosCustos.reduce(
            (acc, c) => acc + Number(c.valor || 0),
            0
        );

        const totalCustos = totalAbastecimento + totalOutros;
        const totalLucro = totalApurado - totalCustos;

        const apuradoEl = document.getElementById('total-apurado-geral');
        const lucroEl = document.getElementById('total-lucro-geral');

        if (apuradoEl) {
            apuradoEl.textContent = `R$ ${totalApurado.toFixed(2).replace('.', ',')}`;
        }

        if (lucroEl) {
            lucroEl.textContent = `R$ ${totalLucro.toFixed(2).replace('.', ',')}`;
        }
    } catch (erro) {
        console.error("Erro ao atualizar resumo geral:", erro);
    }
}



// ============================================================
// 7. RESULTADOS E ESTATÍSTICAS
// ============================================================

async function atualizarPainelResultados(tipo) {
    if (!usuarioAtual) {
        alert("Faça login primeiro.");
        return;
    }

    const container = document.getElementById('resultado-acompanhamento');
    if (!container) return;

    container.innerHTML = '<p style="text-align:center; opacity:0.7;">Carregando resultados...</p>';

    try {
        const [turnos, abastecimentos, outros] = await Promise.all([
            listarTurnosFirestore(usuarioAtual.uid),
            listarAbastecimentosFirestore(usuarioAtual.uid),
            listarOutrosCustosFirestore(usuarioAtual.uid)
        ]);

        function obterPrimeiraDataComRegistro() {
            const datasTurnos = turnos
                .map(t => dataBRparaDate(t.data))
                .filter(Boolean);

            const datasAbastecimentos = abastecimentos
                .map(a => dataBRparaDate(a.data))
                .filter(Boolean);

            const datasOutros = outros
                .map(c => dataBRparaDate(c.data))
                .filter(Boolean);

            const todasAsDatas = [
                ...datasTurnos,
                ...datasAbastecimentos,
                ...datasOutros
            ].map(normalizarData);

            if (!todasAsDatas.length) return null;

            todasAsDatas.sort((a, b) => a - b);
            return todasAsDatas[0];
        }

        const hoje = normalizarData(new Date());
        let dataInicio = null;
        let dataFim = hoje;
        let titulo = '📊 Resultado Total';

        if (tipo === 'diario') {
            dataInicio = hoje;
            titulo = `☀️ Resultado Diário — ${formatarDataBR(hoje)}`;
        } else if (tipo === 'semanal') {
            dataInicio = inicioDaSemana(hoje);
            titulo = `🗓️ Resultado Semanal — ${formatarDataBR(dataInicio)} à ${formatarDataBR(hoje)}`;
        } else if (tipo === 'mensal') {
            dataInicio = inicioDoMes(hoje);
            titulo = `📅 Resultado Mensal — ${formatarDataBR(dataInicio)} à ${formatarDataBR(hoje)}`;
        } else {
            dataInicio = obterPrimeiraDataComRegistro();

            if (!dataInicio) {
                container.innerHTML = `
                    <p style="text-align:center; opacity:0.7;">
                        Nenhum dado encontrado para exibir resultados.
                    </p>
                `;
                return;
            }

            titulo = `📊 Resultado Total — ${formatarDataBR(dataInicio)} à ${formatarDataBR(hoje)}`;
        }

        let totalApurado = 0;
        let totalKM = 0;
        let totalMin = 0;
        let totalCustos = 0;

        turnos.forEach(t => {
            const dataDia = dataBRparaDate(t.data);
            if (!dataDia) return;

            const dentroDoPeriodo =
                (dataInicio === null || dataDia >= dataInicio) &&
                dataDia <= dataFim;

            if (!dentroDoPeriodo) return;

            const apurado = Number(t.apurado || 0);
            const kI = Number(t.kI || 0);
            const kF = Number(t.kF || 0);

            totalApurado += apurado;
            totalKM += (kF - kI);

            if (t.hI && t.hF) {
                const [hI, mI] = t.hI.split(':').map(Number);
                const [hF, mF] = t.hF.split(':').map(Number);

                let diff = (hF * 60 + mF) - (hI * 60 + mI);
                if (diff < 0) diff += 1440;

                totalMin += diff;
            }
        });

        abastecimentos.forEach(a => {
            const dataCusto = dataBRparaDate(a.data);
            if (!dataCusto) return;

            const dentroDoPeriodo =
                (dataInicio === null || dataCusto >= dataInicio) &&
                dataCusto <= dataFim;

            if (dentroDoPeriodo) {
                totalCustos += Number(a.valor || 0);
            }
        });

        outros.forEach(c => {
            const dataCusto = dataBRparaDate(c.data);
            if (!dataCusto) return;

            const dentroDoPeriodo =
                (dataInicio === null || dataCusto >= dataInicio) &&
                dataCusto <= dataFim;

            if (dentroDoPeriodo) {
                totalCustos += Number(c.valor || 0);
            }
        });

        const totalLucro = totalApurado - totalCustos;
        const horas = totalMin / 60;

        const horaApurado = horas > 0 ? totalApurado / horas : 0;
        const horaLucro = horas > 0 ? totalLucro / horas : 0;
        const kmApurado = totalKM > 0 ? totalApurado / totalKM : 0;
        const kmLucro = totalKM > 0 ? totalLucro / totalKM : 0;

        container.innerHTML = `
            <h3 style="margin-bottom:10px;">${titulo}</h3>

            <p>Apurado Total:</p>
            <h2 style="color:#60a5fa;">${formatarMoeda(totalApurado)}</h2>

            <p>Lucro Total:</p>
            <h2 style="color:#4ade80;">${formatarMoeda(totalLucro)}</h2>

            <p>Custos Totais:</p>
            <h2 style="color:#f87171;">${formatarMoeda(totalCustos)}</h2>

            <hr>

            <p>KM Total Rodado:</p>
            <h2>${totalKM} km</h2>

            <hr>

            <p>Média por Hora (Apurado):</p>
            <h2>${formatarMoeda(horaApurado)}/h</h2>

            <p>Apurado por KM:</p>
            <h2>${formatarMoeda(kmApurado)}/km</h2>

            <hr>

            <p>Média por Hora (Lucro):</p>
            <h2>${formatarMoeda(horaLucro)}/h</h2>

            <p>Lucro por KM:</p>
            <h2>${formatarMoeda(kmLucro)}/km</h2>
        `;
    } catch (erro) {
        console.error("Erro ao atualizar painel de resultados:", erro);
        container.innerHTML = `
            <p style="text-align:center; color:#f87171;">
                Erro ao carregar os resultados.
            </p>
        `;
    }
}





