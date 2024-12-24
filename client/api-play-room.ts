// Función auxiliar para manejar todas las solicitudes de fetch
async function fetchRequest(
  url: string,
  method: string,
  body?: Record<string, unknown>
): Promise<any> {
  try {
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    // Validación de respuesta HTTP
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    // Intentar convertir la respuesta a JSON
    return await response.json();
  } catch (error) {
    console.error(`Fetch error in ${url}:`, error);
    throw error; // Relanza el error para manejarlo externamente
  }
}

// Funciones específicas de la API
async function createNewUser(name: string) {
  return fetchRequest('/player', 'POST', { name });
}

async function createPlayroom(userId: string) {
  return fetchRequest('/playroom', 'POST', { userId });
}

async function enterThePlayRoom(userId: string, keyRoom: number) {
  return fetchRequest(`/playroom/${keyRoom}?userId=${userId}`, 'GET');
}

async function playerCreatorName(name: string, rtdb_Id: number) {
  return fetchRequest('/player-creator', 'POST', { name, rtdb_Id });
}

async function incomingPlayer(name: string, rtdb_Id: number) {
  try {
    return await fetchRequest('/incoming-player', 'POST', { name, rtdb_Id });
  } catch (error) {
    if ((error as Error).message.includes('404')) {
      return 'This player is undefined in this room';
    }
    throw error;
  }
}

async function existRoom(roomId: number) {
  try {
    return await fetchRequest(`/existRoom/${roomId}`, 'GET');
  } catch (error) {
    if ((error as Error).message.includes('404')) {
      return 'This room does not exist';
    }
    throw error;
  }
}

async function gameStateReset(player: string, rtdb_Id: string) {
  return fetchRequest('/start-player', 'POST', { player, rtdb_Id });
}

async function resetAllGame(rtdb_Id: string) {
  return fetchRequest('/reset-all-match', 'POST', { rtdb_Id });
}

async function moveOption(player: string, rtdb_Id: string, move: string) {
  return fetchRequest('/move', 'POST', { move, player, rtdb_Id });
}

async function resetMatchGame(rtdb_Id: string, player: string) {
  return fetchRequest('/reset', 'POST', { rtdb_Id, player });
}

async function getData(rtdb_Id: string, player: string) {
  return fetchRequest('/getdata', 'POST', { rtdb_Id, player });
}

async function resetOnline(rtdb: string, player: string) {
  return fetchRequest('/online', 'POST', { rtdb, player });
}

async function savePointsInDataBase(
  rtdb_Id: string,
  player1: string,
  points1: number,
  player2: string,
  points2: number
) {
  return fetchRequest('/set-points', 'POST', { rtdb_Id, player1, player2, points1, points2 });
}

// Exportar las funciones para usarlas en otras partes del proyecto
export {
  createNewUser,
  createPlayroom,
  enterThePlayRoom,
  playerCreatorName,
  incomingPlayer,
  existRoom,
  gameStateReset,
  moveOption,
  resetMatchGame,
  getData,
  resetOnline,
  savePointsInDataBase,
  resetAllGame,
};
