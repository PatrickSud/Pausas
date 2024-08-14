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
const sortByNameButton = document.getElementById("sortByName");
const themeSwitcher = document.getElementById("theme");

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
        if (option === member.status) {
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

    // Campo de comentário editável
    const commentInput = document.createElement("input");
    commentInput.type = "text";
    commentInput.value = member.comment;
    commentCell.appendChild(commentInput);
    commentInput.addEventListener("blur", () => {
        member.comment = commentInput.value;
    });

    statusSelect.addEventListener("change", () => {
        if (statusSelect.value === "Inativo" || statusSelect.value === "Disponível") {
            timeInput.value = "00:00:00";
            member.time = "00:00:00"; 
        }
        statusCell.setAttribute('aria-label', `Status de ${member.name}: ${statusSelect.value}`);
        member.status = statusSelect.value; 
        updateSummary();
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
                member.time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                tableBody.rows[index].cells[2].firstChild.value = member.time;
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

function sortTableByName() {
    const rows = Array.from(tableBody.rows);
    rows.sort((a, b) => a.cells[0].textContent.localeCompare(b.cells[0].textContent));
    rows.forEach(row => tableBody.appendChild(row));
}

function applyTheme(theme) {
    document.body.classList.remove("dark", "blue");
    document.body.classList.add(theme);
}

// Cria as linhas da tabela, atualiza o resumo, inicia os cronômetros e cria as opções de filtro
teamMembers.forEach(createTableRow);
updateSummary();
startTimers();
createStatusFilterOptions();

// Adiciona os event listeners para filtro, ordenação e troca de tema
statusFilter.addEventListener("change", filterTable);
sortByNameButton.addEventListener("click", sortTableByName);
themeSwitcher.addEventListener("change", () => {
    applyTheme(themeSwitcher.value);
});

// Aplica o tema inicial (dark mode)
applyTheme("dark"); 
