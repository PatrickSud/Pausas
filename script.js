const teamMembers = [
    { name: "Patrick Godoy", status: "Testes e análises", time: "00:15:00", comment: "" },
    { name: "Bruna Estevão", status: "Testes e análises", time: "01:15:00", comment: "BD corrompido" },
    { name: "Leonardo da Silva", status: "Ausente (Lanche)", time: "00:05:00", comment: "" },
    { name: "Aloísio dos Santos", status: "Disponível", time: "00:00:00", comment: "" },
    // ... adicione o restante dos membros da equipe aqui
];

const tableBody = document.querySelector("table tbody");
const summaryDiv = document.getElementById("summary");
const statusFilter = document.getElementById("statusFilter");
const themeSwitcher = document.getElementById("theme");

// Paleta de cores para os status
const statusColors = {
    "Testes e análises": "#b10202",
    "Acesso remoto": "#c3584b",
    "Ausente (Lanche)": "#c7943e",
    "Ausente (Outros)": "#c7943e",
    "Pausa rápida": "#0a53a8",
    "Inativo": "#e8eaed",
    "Disponível": "#25d30c"
};


// Inicialização do Pusher (substitua com suas credenciais)
const pusher = new Pusher('3481fa8f1ebb6faff0a0', {
    cluster: 'us2',
    encrypted: true
});

const channel = pusher.subscribe('pausas-channel');

function createTableRow(member) {
    const row = tableBody.insertRow();
    const nameCell = row.insertCell();
    const statusCell = row.insertCell();
    const timeCell = row.insertCell();
    const commentCell = row.insertCell();

    nameCell.textContent = member.name;
    statusCell.setAttribute('aria-label', `Status de ${member.name}: ${member.status}`);

    const statusSelect = document.createElement("select");
    statusSelect.setAttribute('aria-label', `Selecionar status de ${member.name}`);
    const statusOptions = ["Testes e análises", "Acesso remoto", "Ausente (Lanche)", "Ausente (Outros)", "Pausa rápida", "Inativo", "Disponível"];
    statusOptions.forEach(option => {
        const optionElement = document.createElement("option");
        optionElement.value = option;
        optionElement.textContent = option;
        if (option   
 === member.status) {
            optionElement.selected = true;
        }
        statusSelect.appendChild(optionElement);
    });
    statusCell.appendChild(statusSelect);

    const timeInput = document.createElement("input");
    timeInput.type = "text";
    timeInput.value = member.time;
    timeInput.disabled = true;
    timeCell.appendChild(timeInput);

    const commentInput = document.createElement("input");
    commentInput.type = "text";
    commentInput.value = member.comment;
    commentCell.appendChild(commentInput);
    commentInput.addEventListener("blur", () => {
        member.comment = commentInput.value;

        // Enviar evento do Pusher para atualizar o comentário
        channel.trigger('client-comment-update', {
            name: member.name,
            comment: member.comment
        });
    });

    // Aplicar a cor de fundo ao select com base no status
    statusSelect.style.backgroundColor = statusColors[member.status] || "";

    statusSelect.addEventListener("change", () => {
        if (statusSelect.value === "Inativo" || statusSelect.value === "Disponível") {
            timeInput.value = "00:00:00";
            member.time = "00:00:00"; 
        }

        // Atualizar o aria-label e a cor de fundo
        statusCell.setAttribute('aria-label', `Status de ${member.name}: ${statusSelect.value}`);
        statusSelect.style.backgroundColor = statusColors[statusSelect.value] || "";

        member.status = statusSelect.value; 
        updateSummary();

        // Enviar evento do Pusher para atualizar status e tempo
        channel.trigger('client-status-update', {
            name: member.name,
            status: statusSelect.value,
            time: member.time
        });
    });
}

function updateSummary() {
    const pausedCount = teamMembers.filter(member => member.status !== "Disponível" && member.status !== "Inativo").length;
    const availableCount = teamMembers.filter(member => member.status === "Disponível").length;

    summaryDiv.textContent = `Pausados: ${pausedCount} | Disponíveis: ${availableCount}`;
}

function startTimers() {
    setInterval(() => {
        teamMembers.forEach((member, index) => {
            if (member.status !== "Inativo" && member.status !== "Disponível") {
                let [hours, minutes, seconds] = member.time.split(":").map(Number);
                seconds++;
                if (seconds === 60) {
                    seconds = 0;
                    minutes++;
                    if (minutes === 60) {
                        minutes = 0;
                        hours++;
                    }
                }
                member.time = `<span class="math-inline">\{hours\.toString\(\)\.padStart\(2, '0'\)\}\:</span>{minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                tableBody.rows[index].cells[2].firstChild.value = member.time;

                // Enviar evento do Pusher para atualizar o tempo
                channel.trigger('client-time-update', {
                    name: member.name,
                    time: member.time
                });
            }
        });
    }, 1000);
}

function createStatusFilterOptions() {
    const uniqueStatuses = new Set(teamMembers.map(member => member.status));
    uniqueStatuses.forEach(status => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        statusFilter.appendChild(option);
    });
}

function filterTable() {
    const selectedStatus = statusFilter.value;
    Array.from(tableBody.rows).forEach(row => {
        row.style.display = selectedStatus === "" || row.cells[1].firstChild.value === selectedStatus ? "" : "none";
    });
}

function applyTheme(theme) {
    document.body.classList.remove("dark", "blue");
    document.body.classList.add(theme);
}

// Listener para eventos do Pusher (agora escutando 'client-status-update')
channel.bind('client-status-update', (data) => {
    const row = Array.from(tableBody.rows).find(row => row.cells[0].textContent === data.name);

    if (row) {
        row.cells[1].firstChild.value = data.status;
        row.cells[2].firstChild.value = data.time;
        row.cells[1].firstChild.style.backgroundColor = statusColors[data.status] || "";

        const memberIndex = teamMembers.findIndex(member => member.name === data.name);
        if (memberIndex !== -1) {
            teamMembers[memberIndex].status = data.status;
            teamMembers[memberIndex].time = data.time;
        }

        updateSummary();
    }
});

// Listener para eventos do Pusher (agora escutando 'client-comment-update')
channel.bind('client-comment-update', (data) => {
    const row = Array.from(tableBody.rows).find(row => row.cells[0].textContent === data.name);

    if (row) {
        row.cells[3].firstChild.value = data.comment; 

        const memberIndex = teamMembers.findIndex(member => member.name === data.name);
        if (memberIndex !== -1) {
            teamMembers[memberIndex].comment = data.comment; 
        }
    }
});

// Listener para eventos do Pusher (agora escutando 'client-time-update')
channel.bind('client-time-update', (data) => {
    const row = Array.from(tableBody.rows).find(row => row.cells[0].textContent === data.name);

    if (row) {
        row.cells[2].firstChild.value = data.time; 

        const memberIndex = teamMembers.findIndex(member => member.name === data.name);
        if (memberIndex !== -1) {
            teamMembers[memberIndex].time = data.time; 
        }
    }
});

// Cria as linhas da tabela, atualiza o resumo, inicia os cronômetros e cria as opções de filtro
teamMembers.forEach(createTableRow);
updateSummary();
startTimers();
createStatusFilterOptions();

// Adiciona os event listeners para filtro, ordenação e troca de tema
statusFilter.addEventListener("change", filterTable);
themeSwitcher.addEventListener("change", () => {
    applyTheme(themeSwitcher.value);
});

// Aplica o tema inicial (dark mode)
applyTheme("dark");
