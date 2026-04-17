// Espera o conteúdo da página carregar
document.addEventListener('DOMContentLoaded', InitGamePage);

function InitGamePage() {
  const backButton = document.getElementById('back-button');

  if (backButton) {
    backButton.addEventListener('click', HandleBackButton);
  }

  FetchLeaderboard();
}

function HandleBackButton(event) {
  // Impede o link de tentar navegar para #
  event.preventDefault(); 
  
  // Executa a ação que antes estava "in-line"
  window.history.back();
}

async function FetchLeaderboard() {
  try {
    // Obter gameId da URL (ex: /game/1)
    const urlParts = window.location.pathname.split('/');
    const gameId = urlParts[urlParts.length - 1];

    if (!gameId || isNaN(Number(gameId))) return;

    const apiUrl = window.API_URL || "http://localhost:3001";
    
    // O endpoint de Leaderboard retorna arrays dessa nova entidade Score.
    const response = await fetch(`${apiUrl}/leaderboard/${gameId}`);
    
    if (!response.ok) {
        console.error("Erro ao buscar leaderboard.");
        RenderErrorLeaderboard("Não foi possível carregar os recordes no momento. O servidor pode estar em manutenção. Tente novamente mais tarde.");
        return;
    }

    const resData = await response.json();
    const scores = resData.content || resData;

    RenderLeaderboard(scores);
  } catch (error) {
    console.error("Erro no FetchLeaderboard:", error);
    RenderErrorLeaderboard("Não foi possível carregar os recordes no momento. O servidor pode estar em manutenção. Tente novamente mais tarde.");
  }
}

function RenderLeaderboard(scores) {
  const leaderboardRoot = document.getElementById('leaderboard-root');
  if (!leaderboardRoot) return;

  const section = document.createElement('section');
  section.id = 'leaderboard';
  
  const title = document.createElement('h2');
  title.innerText = 'Leaderboard';
  section.appendChild(title);

  if (!scores || scores.length === 0) {
    const p = document.createElement('p');
    p.innerText = 'Nenhuma pontuação registrada ainda.';
    section.appendChild(p);
    leaderboardRoot.appendChild(section);
    return;
  }

  const containerDiv = document.createElement('div');
  containerDiv.className = 'leaderboard-container';

  const table = document.createElement('table');
  
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Rank', 'Jogador', 'Pontuação', 'Data'].forEach(text => {
    const th = document.createElement('th');
    th.innerText = text;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  
  scores.forEach((score, index) => {
    const tr = document.createElement('tr');
    
    const rankTd = document.createElement('td');
    rankTd.innerText = index + 1;
    tr.appendChild(rankTd);

    const playerTd = document.createElement('td');
    const playerName = score.playerName || 'Jogador Desconhecido';
    playerTd.innerText = playerName;
    tr.appendChild(playerTd);

    const scoreTd = document.createElement('td');
    scoreTd.innerText = score.highestScore ?? '-';
    tr.appendChild(scoreTd);

    const dateTd = document.createElement('td');
    let dateText = '-';
    if (score.lastPlayed) {
      const d = new Date(score.lastPlayed);
      if (!isNaN(d.getTime())) {
        dateText = d.toLocaleDateString();
      }
    }
    dateTd.innerText = dateText;
    tr.appendChild(dateTd);

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  containerDiv.appendChild(table);
  section.appendChild(containerDiv);

  leaderboardRoot.appendChild(section);
}

function RenderErrorLeaderboard(message) {
  const leaderboardRoot = document.getElementById('leaderboard-root');
  if (!leaderboardRoot) return;

  const section = document.createElement('section');
  section.id = 'leaderboard';
  
  const title = document.createElement('h2');
  title.innerText = 'Leaderboard';
  section.appendChild(title);

  const table = document.createElement('table');
  const tbody = document.createElement('tbody');
  const tr = document.createElement('tr');
  const td = document.createElement('td');
  td.innerText = message;
  td.style.textAlign = "center";
  td.style.color = "#ff6b6b"; 
  tr.appendChild(td);
  tbody.appendChild(tr);
  table.appendChild(tbody);
  section.appendChild(table);

  leaderboardRoot.appendChild(section);
}