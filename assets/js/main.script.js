/**
 * @typedef {Object} PlayerCharacterDetails
 * @property {string} avatar
 * @property {string} name
 * @property {number} score
 * @property {string} color
 * @property {boolean} isAI
 */

const gameSettingForm = document.getElementById("game-settings-form");

/** @type {HTMLSelectElement} */
const roundTypeInput = document.getElementById("round-type");

const playerCount = document.getElementById("player_count");

/** @type {HTMLSelectElement} */
const boardSize = document.getElementById("board_size");

/** @type {HTMLInputElement} */
const rowsNo = document.getElementById("rows_no");

/** @type {HTMLInputElement} */
const columnsNo = document.getElementById("columns_no");

/**
 * Determines wether the form can be submitted or not
 * @type {boolean}
 */
const canSubmit = false;

/** Player avatars */
const characterAvatar = [
  { alt: "frieza", src: "../assets/avatars/frieza.png" },
  { alt: "goku", src: "../assets/avatars/goku.png" },
  { alt: "madara", src: "../assets/avatars/madara.png" },
  { alt: "naruto", src: "../assets/avatars/naruto.png" },
  { alt: "sasuke", src: "../assets/avatars/sasuke.png" },
  { alt: "vegeta", src: "../assets/avatars/vegeta.png" },
];

/**
 * Array of player information
 * @type {PlayerCharacterDetails[]} */
const playerCharacterDetails = [];

/**
 * Handles changes in board size options
 * @param {Event} e
 */
function onChangeBoardSizeHandler(e) {
  const boardCust = document.querySelector(".board_cust");
  if (e.target.value === "custom") {
    boardCust.classList.remove("hidden");
  } else {
    if (!boardCust.classList.contains("hidden")) {
      boardCust.classList.add("hidden");
    }
  }
}

/**
 * Handles inputs into custom board size fields
 * @param {Event} e
 */
function onInputCustomSizeEntry(e) {
  const value = Number(e.target.value);
  console.log("e.target.id", e.target.id);
  const errorTag = getInputErrorParagraph(e.target.id);
  if (value > 12) {
    errorTag.textContent = "Maximum of 12 rows";
  } else if (value < 1) {
    errorTag.textContent = "Minimum of 1 rows";
  } else {
    errorTag.textContent = "";
  }
}

/**
 * Returns the error paragraph element based on the input field id
 *
 * @param {"rows_no" | "columns_no"} id
 * @returns {HTMLParagraphElement}
 */
function getInputErrorParagraph(id) {
  if (id === "columns_no") {
    return document.querySelector(".columns_no_error");
  } else {
    return document.querySelector(".rows_no_error");
  }
}

rowsNo.addEventListener("input", onInputCustomSizeEntry);

columnsNo.addEventListener("input", onInputCustomSizeEntry);

boardSize.addEventListener("change", onChangeBoardSizeHandler);

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
