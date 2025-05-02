export {startNewGame,throwDie,holdDice,selectField, resetThrowCount}

/**
 * Fetches the current list of players from the server.
 * If the session is invalid, redirects to /welcome/.
 *
 * @returns {Promise<object[]>} Resolves to an array of player objects.
 */
async function startNewGame() {
    const response = await fetch('/yatzy/');
    if (response.status === 401) {
        window.location.href = "/welcome/";
     }
    const players = await response.json();
    return players;
}

/**
 * Sends a request to roll all non-held dice for the current player.
 *
 * @returns {Promise<object[]>} Resolves to an updated array of player objects.
 */
async function throwDie() {
    const response = await fetch('/throwdice/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    const players = await response.json();
    return players;
}

/**
 * Sends an array indicating which dice should be held.
 *
 * @param {boolean[]} holdDicesArray - Array of 5 booleans indicating hold status.
 * @returns {Promise<object[]>} Resolves to an updated array of player objects.
 */
async function holdDice(holdDicesArray) {
    const response = await fetch('/holddice/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdDices: holdDicesArray })
    });
    const players = await response.json();
    return players;
}

/**
 * Selects a field to be locked for the current player.
 *
 * @param {string} selectedField - The field name to be marked as used.
 * @returns {Promise<object[]>} Resolves to an updated array of player objects.
 */
async function selectField(selectedField) {
    const response = await fetch('/selectfield/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedField })
    });
    const players = await response.json();
    return players;
}

/**
 * Resets the player's throw count on the server to 0.
 *
 * @returns {Promise<object[]>} Resolves to an updated array of player objects.
 */
async function resetThrowCount() {
    const response = await fetch('/resetthrowcount/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    const players = await response.json();
    return players;
}