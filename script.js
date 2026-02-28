const QUESTION_BANK = {
  "2026-02-28": {
    prompt: "Sydney Swans top disposal getters in 2025",
    subtitle: "Guess the 10 players with the most disposals for Sydney in 2025.",
    answers: [
      "Errol Gulden",
      "Chad Warner",
      "Isaac Heeney",
      "James Rowbottom",
      "Jake Lloyd",
      "Nick Blakey",
      "Callum Mills",
      "Brodie Grundy",
      "Justin McInerney",
      "Will Hayward"
    ]
  }
};

const STORAGE_PREFIX = "afl-tenable-progress:";

const questionTitle = document.getElementById("question-title");
const questionSubtitle = document.getElementById("question-subtitle");
const answerInput = document.getElementById("answer-input");
const submitButton = document.getElementById("submit-answer");
const answerBoard = document.getElementById("answer-board");
const statusMessage = document.getElementById("status-message");
const resetButton = document.getElementById("reset-progress");

const todayKey = new Date().toISOString().slice(0, 10);
const selectedKey = QUESTION_BANK[todayKey] ? todayKey : Object.keys(QUESTION_BANK).sort().at(-1);
const currentQuestion = QUESTION_BANK[selectedKey];

if (!currentQuestion) {
  questionTitle.textContent = "No daily question is configured yet.";
  questionSubtitle.textContent = "Add an entry in QUESTION_BANK to start playing.";
  submitButton.disabled = true;
  answerInput.disabled = true;
  resetButton.disabled = true;
} else {
  questionTitle.textContent = currentQuestion.prompt;
  questionSubtitle.textContent = currentQuestion.subtitle;
}

const normalizedAnswerLookup = new Map(
  (currentQuestion?.answers || []).map((answer, index) => [normalize(answer), { answer, index }])
);
const storageKey = `${STORAGE_PREFIX}${selectedKey}`;
const foundAnswers = new Set(loadSavedProgress());

renderBoard();
refreshStatus();

submitButton.addEventListener("click", submitGuess);
answerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    submitGuess();
  }
});

resetButton.addEventListener("click", () => {
  foundAnswers.clear();
  persistProgress();
  renderBoard();
  setStatus("Progress reset. Start guessing again.");
  answerInput.focus();
});

function submitGuess() {
  if (!currentQuestion) {
    return;
  }

  const rawGuess = answerInput.value.trim();
  if (!rawGuess) {
    setStatus("Enter a player name first.", "warning");
    return;
  }

  const guess = normalize(rawGuess);
  const match = normalizedAnswerLookup.get(guess);

  if (!match) {
    setStatus(`“${rawGuess}” is not on the board.`, "warning");
    answerInput.select();
    return;
  }

  if (foundAnswers.has(match.answer)) {
    setStatus(`${match.answer} is already revealed.`, "warning");
    answerInput.select();
    return;
  }

  foundAnswers.add(match.answer);
  persistProgress();
  renderBoard();

  if (foundAnswers.size === currentQuestion.answers.length) {
    setStatus("Perfect! You found all 10 answers.", "success");
  } else {
    setStatus(`Correct! ${currentQuestion.answers.length - foundAnswers.size} to go.`);
  }

  answerInput.value = "";
  answerInput.focus();
}

function renderBoard() {
  answerBoard.innerHTML = "";

  (currentQuestion?.answers || []).forEach((answer) => {
    const item = document.createElement("li");
    item.className = "answer-slot";

    if (foundAnswers.has(answer)) {
      item.textContent = answer;
      item.classList.add("revealed");
    } else {
      item.textContent = "—";
    }

    answerBoard.appendChild(item);
  });
}

function refreshStatus() {
  if (!currentQuestion) {
    setStatus("No active question.", "warning");
    return;
  }

  setStatus(`${foundAnswers.size} / ${currentQuestion.answers.length} found.`);
}

function setStatus(message, tone) {
  statusMessage.textContent = message;
  statusMessage.classList.remove("success", "warning");

  if (tone) {
    statusMessage.classList.add(tone);
  }
}

function persistProgress() {
  localStorage.setItem(storageKey, JSON.stringify([...foundAnswers]));
}

function loadSavedProgress() {
  if (!currentQuestion) {
    return [];
  }

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return saved.filter((name) => currentQuestion.answers.includes(name));
  } catch {
    return [];
  }
}

function normalize(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
