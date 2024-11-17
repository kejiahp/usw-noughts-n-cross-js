/**
 * @typedef {Object} PlayerCharacterDetails
 * @property {string} avatar
 * @property {string} name
 * @property {number} score
 * @property {string} color
 * @property {boolean} isAI
 */

/**
 * @typedef {Object} CharacterAvatars
 * @property {string} alt
 * @property {string} src
 * @property {string} playerColor
 */

const PLAYER_USERNAME = "player_username";
const PLAYER_AI = "player_ai";
const AVATAR_BTN = "avatar_btn";

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

/** @type {HTMLButtonElement} */
const nextAvatarSelectionBtn = document.getElementById(
  "next_avatar_selection_btn"
);

/** @type {HTMLParagraphElement} */
const characterSelectReminder = document.querySelector(
  ".character_select_reminder"
);

/** @type {HTMLButtonElement} */
const startBtn = document.getElementById("start_btn");

/** Player avatars
 *
 * `playerColor` is used to uniquely match and avatar to a player
 *
 * @type {CharacterAvatars[]}
 */
let characterAvatar = [
  { alt: "goku", src: "../assets/avatars/goku.png", playerColor: "" },
  { alt: "vegeta", src: "../assets/avatars/vegeta.png", playerColor: "" },
  { alt: "frieza", src: "../assets/avatars/frieza.png", playerColor: "" },
  { alt: "naruto", src: "../assets/avatars/naruto.png", playerColor: "" },
  { alt: "madara", src: "../assets/avatars/madara.png", playerColor: "" },
  { alt: "sasuke", src: "../assets/avatars/sasuke.png", playerColor: "" },
];

/** Array of colors for players */
const playerColors = [
  "#fca5a5",
  "#bef264",
  "#7dd3fc",
  "#d8b4fe",
  "#fcd34d",
  "#cbd5e1",
];

/** Tracks player character selection turns via player index number
 * @type {number | undefined}
 */
let avatarSelectionTurn = 0;

/**
 * Array of player information
 * @type {PlayerCharacterDetails[]} */
let playerCharacterDetails = [];

/** Event listeners to player username input fields & make ai checkboxes
 *
 * Ensuring the global state is always up to date on re-render
 */
function addEventListenerToPlayerInfoFields() {
  for (let i = 0; i < playerCharacterDetails.length; i++) {
    document
      .getElementById(`${PLAYER_USERNAME}_${i + 1}`)
      .addEventListener("input", (e) => setPlayerUsername(e.target.value));

    const isAICheckBox = document.getElementById(`${PLAYER_AI}_${i + 1}`);

    if (isAICheckBox) {
      isAICheckBox.addEventListener("change", (e) =>
        setPlayerAIProp(e.target.checked)
      );
    }
  }
}

/**
 *  Renders player details
 *
 * @param {PlayerCharacterDetails[]} playerDt
 * */
function renderPlayerInfo(playerDt) {
  const playerWrapper = document.querySelector(".player_wrapper");
  playerWrapper.innerHTML = "";

  for (let i in playerDt) {
    const player = playerDt[i];
    const iNum = Number(i);
    const playerDetail = document.createElement("div");
    playerDetail.setAttribute("class", "player_detail");
    playerDetail.setAttribute("id", `player_detail_${iNum + 1}`);
    const aiCheckBox = `<label style="margin:0px 0px" for="${PLAYER_AI}_${
      iNum + 1
    }">
<input disabled ${
      player.isAI ? "checked" : ""
    } type="checkbox" id="${PLAYER_AI}_${iNum + 1}" name="${PLAYER_AI}_${
      iNum + 1
    }" />
<small>Make AI</small>
</label>
`;

    playerDetail.innerHTML = `
              <h5>Player ${iNum + 1}</h5>
            <img style='border-color: ${player.color};' src="${
      player.avatar
    }" alt="player${iNum + 1} image" />
            <label>
              <input disabled id="${PLAYER_USERNAME}_${
      iNum + 1
    }" type="text" placeholder="Player ${iNum + 1} Username" value="${
      player.name
    }" />
            </label>
            ${iNum + 1 !== 1 ? aiCheckBox : "<p style='height:21px;'></p>"}
    `;
    playerWrapper.appendChild(playerDetail);
  }

  // apply event listeners
  addEventListenerToPlayerInfoFields();

  // allow player selection on each render
  allowPlayerSelection();
}

/** Renders avatar exhibition listing
 *
 * @param {CharacterAvatars[]} characterAv
 */
function renderAvatarExhibition(characterAv) {
  /** @type {HTMLDivElement} */
  const avatarExhibition = document.querySelector(".avatar_exhibition");
  avatarExhibition.innerHTML = "";
  for (let i in characterAv) {
    const charAvt = characterAv[i];
    const iNum = Number(i);

    const avatarButton = document.createElement("button");
    avatarButton.type = "button";
    avatarButton.style.borderColor = charAvt.playerColor;
    avatarButton.id = `${AVATAR_BTN}_${iNum + 1}`;
    avatarButton.innerHTML = `
  <img src=${charAvt.src} alt=${charAvt.alt} />
  `;
    if (charAvt.playerColor) {
      avatarButton.disabled = true;
    }
    avatarButton.addEventListener("click", (e) => {
      if (e.target.disabled === true) {
        return;
      }
      if (avatarSelectionTurn === undefined) {
        return;
      }

      setPlayerAvatar(e.target.getAttribute("src"));

      /** To ensure players can preview multiple avatars during their selections
       *
       * Unselects previous avatar selections for choosing player
       */
      unselectPreviousAvatarSelection(
        playerCharacterDetails[avatarSelectionTurn].color
      );

      if (avatarSelectionTurn !== undefined) {
        setAvatarColor(iNum, playerCharacterDetails[avatarSelectionTurn].color);
      }
    });
    avatarExhibition.appendChild(avatarButton);
  }
}

/** removes avatar selection color */
function unselectPreviousAvatarSelection(color) {
  characterAvatar.forEach((item) => {
    if (item.playerColor === color) {
      item.playerColor = "";
    }
  });
}

/** Disables all avatars prevent avatar selection */
function disableAvatarButtons() {
  const avatarExhibition = document.querySelector(".avatar_exhibition");

  for (const i of avatarExhibition.childNodes) {
    if (i.tagName === "BUTTON") {
      i.disabled = true;
    }
  }
}

/** sets players avatar
 *
 * @param {string} src
 */
function setPlayerAvatar(src) {
  if (avatarSelectionTurn === undefined) {
    return;
  }
  playerCharacterDetails[avatarSelectionTurn] = {
    ...playerCharacterDetails[avatarSelectionTurn],
    avatar: src,
  };
  renderPlayerInfo(playerCharacterDetails);
}

/** sets `playerColor` to avatars, ensuring avatar uniqueness
 *
 * @param {string} color
 * @param {number} index
 */
function setAvatarColor(index, color) {
  characterAvatar[index] = {
    ...characterAvatar[index],
    playerColor: color,
  };

  renderAvatarExhibition(characterAvatar);
}

/** function to set players username, `name` property
 *
 * @param {string} username
 */
function setPlayerUsername(username) {
  if (avatarSelectionTurn === undefined) {
    return;
  }
  playerCharacterDetails[avatarSelectionTurn] = {
    ...playerCharacterDetails[avatarSelectionTurn],
    name: username,
  };
}

/** function to set players `isAI` property
 * @params {boolean} checked
 */
function setPlayerAIProp(checked) {
  if (avatarSelectionTurn === undefined) {
    return;
  }
  playerCharacterDetails[avatarSelectionTurn] = {
    ...playerCharacterDetails[avatarSelectionTurn],
    isAI: checked,
  };
}

/**
 * Handles changes in player count
 *
 * And initially renders the playerInformation
 * @param {Event | undefined} e
 */
function onChangePlayerCount(e) {
  // if e.target.value is undefined assigne the 2 to constant `value`
  const value = Number(e?.target?.value ?? 2);
  playerCharacterDetails = [];
  /** Creates an array with length provided, all array elements are undefined */
  const undefinedArr = Array.from({ length: value });
  undefinedArr.forEach((_, index) => {
    playerCharacterDetails.push({
      avatar: "",
      name: "",
      score: 0,
      color: playerColors[index],
      isAI: false,
    });
  });

  characterAvatar.forEach((item) => {
    item.playerColor = "";
  });

  /** @type {HTMLDivElement} */
  const avatarExhibition = document.querySelector(".avatar_exhibition");
  if (avatarExhibition.classList.contains("hidden")) {
    avatarExhibition.classList.remove("hidden");
  }
  if (nextAvatarSelectionBtn.classList.contains("hidden")) {
    nextAvatarSelectionBtn.classList.remove("hidden");
  }

  avatarSelectionTurn = 0;
  nextAvatarSelectionBtn.textContent = "Next Player";
  /** Disable start button */
  startBtn.disabled = true;
  /**INITIAL AVATAR EXHIBITION RENDER */
  renderAvatarExhibition(characterAvatar);
  /**INITIAL PLAYER INFO RENDER */
  renderPlayerInfo(playerCharacterDetails);
}

/** initialize player selection */
onChangePlayerCount(undefined);

playerCount.addEventListener("change", onChangePlayerCount);

/**Controls the rendering of player selections */
function renderCharacterSelectionReminder() {
  characterSelectReminder.textContent =
    avatarSelectionTurn !== undefined
      ? `
  "Player ${avatarSelectionTurn + 1}" choose your avatar and enter your details
  `
      : "";
}

/** Base on selection turn; enable input fields and buttons allowing a player to select their avatar details  */
function allowPlayerSelection() {
  if (avatarSelectionTurn === undefined) {
    return;
  }
  /** @type {HTMLInputElement} */
  const inputFld = document.getElementById(
    `${PLAYER_USERNAME}_${avatarSelectionTurn + 1}`
  );
  /** @type {HTMLInputElement | null} */
  const aiBtn = document.getElementById(
    `${PLAYER_AI}_${avatarSelectionTurn + 1}`
  );
  inputFld.disabled = false;
  /** The first player cannot be AI, hence the check */
  if (aiBtn) {
    aiBtn.disabled = false;
  }

  /** Initial render of reminder */
  renderCharacterSelectionReminder();
}

/** Check player details for player entries with the same username
 *
 * @param {PlayerCharacterDetails[]} plyDet
 * @return {boolean}
 */
function checkForSameUsername(plyDet) {
  const nameCounts = {};

  for (const obj of plyDet) {
    const name = obj.name;

    // Skip empty strings
    if (!name || name.trim() === "") {
      continue;
    }

    const lowerCaseName = name.toLowerCase();

    if (nameCounts[lowerCaseName]) {
      return true; // Found a duplicate
    }
    nameCounts[lowerCaseName] = 1;
  }

  return false; // No duplicates found
}

/** Changes the avater selection turn
 * @param {Event} e
 */
function nextPlayerSelectionTurnHandler(e) {
  e.preventDefault();

  if (avatarSelectionTurn === undefined) {
    return;
  }

  /** @type {HTMLInputElement} */
  const inputFld = document.getElementById(
    `${PLAYER_USERNAME}_${avatarSelectionTurn + 1}`
  );
  /** @type {HTMLInputElement | null} */
  const aiBtn = document.getElementById(
    `${PLAYER_AI}_${avatarSelectionTurn + 1}`
  );

  if (playerCharacterDetails[avatarSelectionTurn].avatar === "") {
    alert(`Player ${avatarSelectionTurn + 1}'s avatar is required`);
    return;
  }

  if (inputFld.value === "") {
    alert(`Player ${avatarSelectionTurn + 1}'s username is required`);
    return;
  } else if (inputFld.value.length < 3) {
    alert(
      `Player ${
        avatarSelectionTurn + 1
      }'s username must be a minimum of 3 characters`
    );
    return;
  }

  /** Destructure (unpack) return object */
  const isSameNameFound = checkForSameUsername(playerCharacterDetails);

  if (isSameNameFound) {
    alert(`Player ${avatarSelectionTurn + 1}'s username must be unique`);
    return;
  }

  playerCharacterDetails[avatarSelectionTurn] = {
    ...playerCharacterDetails[avatarSelectionTurn],
    isAI: aiBtn?.checked ?? false,
    name: inputFld.value,
  };

  /** if avatar selection is on the last element player assign undefined to `avatarSelectionTurn` */
  if (avatarSelectionTurn === playerCharacterDetails.length - 1) {
    if (nextAvatarSelectionBtn.textContent === "Save") {
      /** Enable start button */
      startBtn.disabled = false;
    }

    avatarSelectionTurn = undefined;
    // hide the next player button when their are no more selection turns
    nextAvatarSelectionBtn.classList.add("hidden");

    disableAvatarButtons();

    // hide the character exhibition listing
    /** @type {HTMLDivElement} */
    const avatarExhibition = document.querySelector(".avatar_exhibition");
    avatarExhibition.classList.add("hidden");
  } else {
    avatarSelectionTurn += 1;

    if (avatarSelectionTurn === playerCharacterDetails.length - 1) {
      nextAvatarSelectionBtn.textContent = "Save";
    }

    renderAvatarExhibition(characterAvatar);
  }

  renderPlayerInfo(playerCharacterDetails);
  renderCharacterSelectionReminder();
}

nextAvatarSelectionBtn.addEventListener(
  "click",
  nextPlayerSelectionTurnHandler
);

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
 * Returns a boolean when the custom row size or column size validation fails
 *
 * @param {"rows_no" | "columns_no"} id
 * @param {number} value
 *
 * @returns {boolean}
 */
const validateCustomBoardFields = (id, value) => {
  const errorTag = getInputErrorParagraph(id);
  if (value > 12) {
    errorTag.textContent = "Maximum of 12 rows";
    return false;
  } else if (value < 1) {
    errorTag.textContent = "Minimum of 1 rows";
    return false;
  } else {
    errorTag.textContent = "";
    return true;
  }
};

/**
 *
 * @param {number} plyCnt
 * @param {PlayerCharacterDetails[]} plyDet
 *
 * @returns {{isValid:Boolean, details:String | undefined}}
 */
function validateUserDetails(plyCnt, plyDet) {
  if (plyDet.length !== plyCnt) {
    return { isValid: false, details: "Invalid player count" };
  }

  /** Destructure (unpack) return object */
  const isSameNameFound = checkForSameUsername(plyDet);

  if (isSameNameFound) {
    alert(`Player usernames must be unique`);
    return;
  }

  for (let i = 0; i < plyDet.length; i++) {
    const ply = plyDet[i];
    if (ply.avatar === "") {
      return {
        isValid: false,
        details: `Player ${i + 1}'s avatar is required`,
      };
    } else if (ply.name === "") {
      return {
        isValid: false,
        details: `Player ${i + 1}'s username is required`,
      };
    } else if (ply.name.length < 3) {
      return {
        isValid: false,
        details: `Player ${i + 1}'s username must be a minimum of 3 characters`,
      };
    }
  }

  return { isValid: true, details: undefined };
}

/**
 * Handles submission of game settings
 *
 * @param {SubmitEvent} event
 */
function onSubmitGameSettingsHandler(event) {
  event.preventDefault();

  if (boardSize.value === "custom") {
    const rowValue = Number(rowsNo.value);
    const columnValue = Number(columnsNo.value);
    const isColValid = validateCustomBoardFields("columns_no", columnValue);
    const isRowValid = validateCustomBoardFields("rows_no", rowValue);
    if (!isColValid || !isRowValid) {
      return;
    }
  }

  /** Destructuring (unpacking) the validation function return object */
  const { isValid, details } = validateUserDetails(
    Number(playerCount.value),
    playerCharacterDetails
  );

  if (!isValid) {
    alert("Validation Failed:" + "\n\n" + details);
    return;
  }

  const gameSettings = {
    playerCount: playerCharacterDetails.length,
    playerDetails: playerCharacterDetails,
    boardSize:
      boardSize.value !== "custom"
        ? boardSize.value
        : `${rowsNo.value}#${columnsNo.value}`,
    roundType: roundTypeInput.value,
  };

  window.localStorage.setItem("gameSettings", JSON.stringify(gameSettings));
  location.href = "./main.html";
}

gameSettingForm.addEventListener("submit", onSubmitGameSettingsHandler);
