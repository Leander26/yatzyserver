export { gameState, throwDie, holdDice, selectField, resetThrowCount, startNewGame, leaveGame };

/**
 * Fetches the current list of players from the server.
 * If the session is invalid, redirects to /welcome/.
 *
 * @returns {Promise<object[]>} Resolves to an array of player objects.
 */
async function gameState() {
    try {
        const response = await fetch('/yatzy/');
        if (response.status === 401) {
            window.location.href = "/welcome/";
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Unknown error getting gameState");
        }
        const players = await response.json();
        return players;
    } catch (err) {
        alert(err.message);
        window.location.href = "/welcome/";
    }
}

/**
 * Sends a request to roll all non-held dice for the current player.
 *
 * @returns {Promise<object[]>} Resolves to an updated array of player objects.
 */
async function throwDie() {
    try {
        const response = await fetch('/throwdice/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Unknown error during throw");
        }
        const players = await response.json();
        return players;
    } catch (err) {
        alert(err.message);
        window.location.href = "/welcome/";
    }
}

/**
 * Sends an array indicating which dice should be held.
 *
 * @param {boolean[]} holdDicesArray - Array of 5 booleans indicating hold status.
 * @returns {Promise<object[]>} Resolves to an updated array of player objects.
 */
async function holdDice(holdDicesArray) {
    try {
        const response = await fetch('/holddice/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ holdDices: holdDicesArray })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Unknown error during holde dice");
        }
        const players = await response.json();
        return players;
    } catch (err) {
        alert(err.message);
        window.location.href = "/welcome/";
    }
}

/**
 * Selects a field to be locked for the current player.
 *
 * @param {string} selectedField - The field name to be marked as used.
 * @returns {Promise<object[]>} Resolves to an updated array of player objects.
 */
async function selectField(selectedField) {
    try {
        const response = await fetch('/selectfield/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selectedField })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Unknown error during select field");
        }
        const players = await response.json();
        return players;
    } catch (err) {
        alert(err.message);
        window.location.href = "/welcome/";
    }
}

/**
 * Resets the player's throw count on the server to 0.
 *
 * @returns {Promise<object[]>} Resolves to an updated array of player objects.
 */
async function resetThrowCount() {
    try {
        const response = await fetch('/resetthrowcount/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Unknown error during select reset throw count");
        }
        const players = await response.json();
        return players;
    } catch (err) {
        alert(err.message);
        window.location.href = "/welcome/";
    }
}

/**
 * Starts a new game by sending a request to the server.
 *
 * @returns {Promise<object[]>} Resolves to an array of player objects.
 */
async function startNewGame() {
    try {
        const response = await fetch('/startnewgame/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Unknown error during start new game");
        }
        const players = await response.json();
        return players;
    } catch (err) {
        alert(err.message);
        window.location.href = "/welcome/";
    }
}

/**
 * Leaves the current game by sending a request to the server.
 * If the session is invalid, redirects to /welcome/.
 * 
 */
async function leaveGame() {
    try {
        const response = await fetch('/leavegame/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.status !== 200) {
            const error = await response.json();
            throw new Error(error.error || "Unknown error during leave game");
        }
    }
    catch (err) {
        //alert(err.message);
        window.location.href = "/welcome/";
    }
}