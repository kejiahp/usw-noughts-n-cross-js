const gameSettingForm = document.getElementById("game-settings-form");

/** @type {HTMLSelectElement} */
const roundTypeInput = document.getElementById("round-type");

/**
 * Handles submission of game settings
 *
 * @param {SubmitEvent} event
 */
function onSubmitGameSettingsHandler(event) {
  event.preventDefault();

  window.localStorage.setItem("roundType", roundTypeInput.value);
}

gameSettingForm.addEventListener("submit", onSubmitGameSettingsHandler);
