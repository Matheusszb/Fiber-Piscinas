const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwn9TZ4Q9GimhneotKz_l2nkcyiHpgBn5INbGXmCX4Yda1_lLdy1cVMtIfj7kjnFAKIdQ/exec";
const WHATSAPP_ATENDIMENTO = "5532998167347";
const CIDADES_MG_API_URL = "https://servicodados.ibge.gov.br/api/v1/localidades/estados/MG/municipios?orderBy=nome";

const piscinas = {
  pequeno: {
    nome: "Praia 04",
    info: "3,30 x 2,00 x 0,80m - Ideal para espa\u00e7os pequenos",
    img: "img/destaque/praia.jpg"
  },
  medio: {
    nome: "Nado Livre 5",
    info: "5,00 x 2,40 x 1,35m - \u00d3timo custo-benef\u00edcio",
    img: "img/destaque/379291-piscina-nado-livre.jpg"
  },
  grandeSimples: {
    nome: "Praia 31",
    info: "8,00 x 3,80 x 1,40m - Grande e confort\u00e1vel",
    img: "img/destaque/praia.jpg"
  },
  grandeLuxo: {
    nome: "Prime 35",
    info: "10,67 x 4,14 x 1,84m - Linha premium com spa",
    img: "img/destaque/379254-swimmingpool-prime.jpg"
  }
};

const form = document.getElementById("form");
const nomeInput = document.getElementById("nomeInput");
const whatsappInput = document.getElementById("whatsappInput");
const cidadeInput = document.getElementById("cidade");
const cidadeSugestoes = document.getElementById("cidadeSugestoes");
const statusElement = document.getElementById("formStatus");
const submitButton = document.getElementById("submitButton");
const selectAbertos = new Set();
const poolPreviewImage = document.getElementById("poolPreviewImage");
const poolPreviewName = document.getElementById("poolPreviewName");
const colorButtons = document.querySelectorAll(".cor-card[data-pool-image]");

let cidadesMg = [];
let cidadesMgCarregadas = false;
let carregamentoCidadesMg = null;

inicializarSelectsCustomizados();
inicializarSimuladorDeCores();

whatsappInput.addEventListener("input", function formatarWhatsapp(event) {
  let valor = event.target.value.replace(/\D/g, "").slice(0, 11);

  if (valor.length > 6) {
    valor = valor.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
  } else if (valor.length > 2) {
    valor = valor.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
  } else if (valor.length > 0) {
    valor = valor.replace(/^(\d{0,2})/, "($1");
  }

  event.target.value = valor;
});

cidadeInput.addEventListener("input", async function atualizarSugestoesCidade() {
  await garantirCidadesMg();
  const termo = normalizarTexto(cidadeInput.value.trim());

  if (termo.length < 2) {
    esconderSugestoesCidade();
    return;
  }

  const sugestoes = cidadesMg
    .filter(function(cidade) {
      return normalizarTexto(cidade).includes(termo);
    })
    .slice(0, 6);

  renderizarSugestoesCidade(sugestoes);
});

cidadeInput.addEventListener("focus", async function() {
  await garantirCidadesMg();

  if (cidadeInput.value.trim().length >= 2) {
    const termo = normalizarTexto(cidadeInput.value.trim());
    const sugestoes = cidadesMg
      .filter(function(cidade) {
        return normalizarTexto(cidade).includes(termo);
      })
      .slice(0, 6);

    renderizarSugestoesCidade(sugestoes);
  }
});

cidadeInput.addEventListener("keydown", function(event) {
  if (event.key === "Escape") {
    esconderSugestoesCidade();
  }
});

form.addEventListener("submit", async function enviarFormulario(event) {
  event.preventDefault();

  const nome = nomeInput.value.trim();
  const whatsapp = whatsappInput.value.trim();
  const cidade = cidadeInput.value.trim();
  const whatsappNumeros = whatsapp.replace(/\D/g, "");

  if (nome.length < 3) {
    mostrarStatus("Digite seu nome completo ou ao menos um nome v\u00e1lido.", true);
    nomeInput.focus();
    return;
  }

  if (whatsappNumeros.length < 10 || whatsappNumeros.length > 11) {
    mostrarStatus("Digite um WhatsApp v\u00e1lido com DDD.", true);
    whatsappInput.focus();
    return;
  }

  if (cidade.length < 2) {
    mostrarStatus("Informe sua cidade para continuar.", true);
    cidadeInput.focus();
    return;
  }

  const espaco = document.getElementById("espaco").value;
  const tipo = document.getElementById("tipo").value;
  const orcamento = document.getElementById("orcamento").value;
  const espacoPronto = document.getElementById("espacoPronto").value;
  const prazoCompra = document.getElementById("prazoCompra").value;
  const piscina = escolherPiscina(espaco, tipo);
  const qualificacao = classificarLead(prazoCompra, orcamento, espacoPronto);

  const payload = {
    nome,
    whatsapp,
    cidade,
    espaco,
    tipo,
    orcamento,
    espacoPronto,
    prazoCompra,
    qualificacao,
    piscina: piscina.nome,
    detalhesPiscina: piscina.info,
    data: new Date().toLocaleString("pt-BR")
  };

  submitButton.disabled = true;
  mostrarStatus("Salvando contato...", false);

  try {
    await salvarNoGoogleSheets(payload);
    mostrarStatus("Contato salvo com sucesso. Exibindo recomenda\u00e7\u00e3o...", false);
    recomendar(piscina, nome, cidade, qualificacao);
    form.reset();
  } catch (error) {
    console.error(error);
    mostrarStatus("N\u00e3o foi poss\u00edvel salvar no Google Sheets. Configure a URL do Apps Script.", true);
  } finally {
    submitButton.disabled = false;
  }
});

function escolherPiscina(espaco, tipo) {
  if (espaco === "pequeno") {
    return piscinas.pequeno;
  }

  if (espaco === "medio") {
    return piscinas.medio;
  }

  return tipo === "luxo" ? piscinas.grandeLuxo : piscinas.grandeSimples;
}

function classificarLead(prazoCompra, orcamento, espacoPronto) {
  if (prazoCompra === "agora" || prazoCompra === "1a3meses") {
    if (orcamento === "acima40mil" || espacoPronto === "sim") {
      return "Vermelho";
    }

    return "Laranja";
  }

  if (prazoCompra === "mais3meses") {
    return "Amarelo";
  }

  return "Verde";
}

function obterSinalizacaoLead(classificacao) {
  const sinalizacoes = {
    Vermelho: "\ud83d\udd34 Vermelho",
    Laranja: "\ud83d\udfe0 Laranja",
    Amarelo: "\ud83d\udfe1 Amarelo",
    Verde: "\ud83d\udfe2 Verde"
  };

  return sinalizacoes[classificacao] || classificacao;
}

function recomendar(piscina, nomeCliente, cidadeCliente, qualificacao) {
  const sinalizacaoLead = obterSinalizacaoLead(qualificacao);

  document.getElementById("imgPiscina").src = piscina.img;
  document.getElementById("imgPiscina").alt = piscina.nome;
  document.getElementById("nomePiscina").innerText = piscina.nome;
  document.getElementById("infoPiscina").innerText = `${piscina.info} | Cidade: ${cidadeCliente} | Sinaliza\u00e7\u00e3o: ${sinalizacaoLead}`;

  const mensagem = `Ol\u00e1, meu nome \u00e9 ${nomeCliente} e sou de ${cidadeCliente}. Tenho interesse na ${piscina.nome} (${piscina.info}). Sinaliza\u00e7\u00e3o para atendimento: ${sinalizacaoLead}.`;
  const link = `https://wa.me/${WHATSAPP_ATENDIMENTO}?text=${encodeURIComponent(mensagem)}`;

  document.getElementById("whatsapp-modal").href = link;

  const resultado = document.getElementById("resultado");
  resultado.classList.add("ativo");
  document.body.classList.add("modal-aberto");
}

async function salvarNoGoogleSheets(payload) {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("COLE_AQUI")) {
    throw new Error("URL do Google Apps Script n\u00e3o configurada.");
  }

  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Falha ao enviar dados para o Google Sheets.");
  }
}

function mostrarStatus(mensagem, isError) {
  statusElement.textContent = mensagem;
  statusElement.classList.toggle("erro", isError);
  statusElement.classList.toggle("sucesso", !isError && mensagem !== "");
}

function fecharModal() {
  document.getElementById("resultado").classList.remove("ativo");
  document.body.classList.remove("modal-aberto");
}

document.addEventListener("click", function(event) {
  const resultado = document.getElementById("resultado");

  if (resultado.classList.contains("ativo") && event.target === resultado) {
    fecharModal();
  }

  if (!event.target.closest(".cidade-autocomplete")) {
    esconderSugestoesCidade();
  }

  if (!event.target.closest(".select-custom")) {
    fecharTodosSelects();
  }
});

function renderizarSugestoesCidade(sugestoes) {
  if (!sugestoes.length) {
    esconderSugestoesCidade();
    return;
  }

  cidadeSugestoes.innerHTML = "";

  sugestoes.forEach(function(cidade) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "cidade-sugestao";
    botao.textContent = cidade;
    botao.addEventListener("click", function() {
      cidadeInput.value = cidade;
      esconderSugestoesCidade();
      cidadeInput.focus();
    });
    cidadeSugestoes.appendChild(botao);
  });

  cidadeSugestoes.hidden = false;
}

function esconderSugestoesCidade() {
  cidadeSugestoes.hidden = true;
  cidadeSugestoes.innerHTML = "";
}

async function garantirCidadesMg() {
  if (cidadesMgCarregadas) {
    return;
  }

  if (carregamentoCidadesMg) {
    await carregamentoCidadesMg;
    return;
  }

  carregamentoCidadesMg = (async function() {
    try {
      const response = await fetch(CIDADES_MG_API_URL);

      if (!response.ok) {
        throw new Error("Falha ao carregar cidades de MG.");
      }

      const data = await response.json();
      cidadesMg = data.map(function(cidade) {
        return `${cidade.nome} - MG`;
      });
      cidadesMgCarregadas = true;
    } catch (error) {
      console.error(error);
      cidadesMg = [
        "Belo Horizonte - MG",
        "Contagem - MG",
        "Betim - MG",
        "Juiz de Fora - MG",
        "Uberl\u00e2ndia - MG",
        "Uberaba - MG",
        "Governador Valadares - MG",
        "Montes Claros - MG",
        "Ipatinga - MG",
        "Divin\u00f3polis - MG",
        "Sete Lagoas - MG",
        "Varginha - MG",
        "Barbacena - MG",
        "Muria\u00e9 - MG",
        "Po\u00e7os de Caldas - MG"
      ];
    } finally {
      carregamentoCidadesMg = null;
    }
  })();

  await carregamentoCidadesMg;
}

function inicializarSelectsCustomizados() {
  document.querySelectorAll("select").forEach(function(select, index) {
    select.classList.add("select-native");

    const wrapper = document.createElement("div");
    wrapper.className = "select-custom";
    wrapper.dataset.selectId = select.id || `select-${index}`;

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "select-trigger";
    trigger.setAttribute("aria-expanded", "false");

    const value = document.createElement("span");
    value.className = "select-value";
    value.textContent = select.options[select.selectedIndex]?.textContent || "Selecione";

    const icon = document.createElement("span");
    icon.className = "select-icon";
    icon.innerHTML = "&#9662;";

    trigger.appendChild(value);
    trigger.appendChild(icon);

    const options = document.createElement("div");
    options.className = "select-options";
    options.hidden = true;

    Array.from(select.options).forEach(function(option) {
      const optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.className = "select-option";
      optionButton.textContent = option.textContent;
      optionButton.dataset.value = option.value;

      if (option.selected) {
        optionButton.classList.add("ativo");
      }

      optionButton.addEventListener("click", function() {
        select.value = option.value;
        value.textContent = option.textContent;
        options.querySelectorAll(".select-option").forEach(function(item) {
          item.classList.toggle("ativo", item.dataset.value === option.value);
        });
        fecharSelect(wrapper, options, trigger);
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });

      options.appendChild(optionButton);
    });

    trigger.addEventListener("click", function() {
      const estaAberto = wrapper.classList.contains("aberto");
      fecharTodosSelects();

      if (!estaAberto) {
        wrapper.classList.add("aberto");
        options.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        selectAbertos.add(wrapper);
      }
    });

    select.insertAdjacentElement("afterend", wrapper);
    wrapper.appendChild(trigger);
    wrapper.appendChild(options);
  });
}

function fecharSelect(wrapper, options, trigger) {
  wrapper.classList.remove("aberto");
  options.hidden = true;
  trigger.setAttribute("aria-expanded", "false");
  selectAbertos.delete(wrapper);
}

function fecharTodosSelects() {
  selectAbertos.forEach(function(wrapper) {
    const options = wrapper.querySelector(".select-options");
    const trigger = wrapper.querySelector(".select-trigger");
    fecharSelect(wrapper, options, trigger);
  });
}

function normalizarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function inicializarSimuladorDeCores() {
  if (!poolPreviewImage || !poolPreviewName || !colorButtons.length) {
    return;
  }

  colorButtons.forEach(function(botao) {
    botao.addEventListener("click", function() {
      const imagePath = botao.dataset.poolImage;
      const colorName = botao.dataset.colorName || "Cor selecionada";

      poolPreviewImage.src = imagePath;
      poolPreviewImage.alt = `Visualização da piscina na cor ${colorName}`;
      poolPreviewName.textContent = colorName;

      colorButtons.forEach(function(item) {
        item.classList.toggle("ativo", item === botao);
      });
    });
  });
}
