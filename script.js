const QUESTION_BANK = {
  "2026-02-28": {
    prompt: "Sydney Swans top disposal getters in 2025",
    subtitle: "Type full name or surname.",
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
  questionTitle.textContent = "No question yet.";
  questionSubtitle.textContent = "Add one in QUESTION_BANK.";
  submitButton.disabled = true;
  answerInput.disabled = true;
  resetButton.disabled = true;
} else {
  questionTitle.textContent = currentQuestion.prompt;
  questionSubtitle.textContent = currentQuestion.subtitle;
}

const answerMatcher = buildAnswerMatcher(currentQuestion?.answers || []);
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
  setStatus("Reset.");
  answerInput.focus();
});

function submitGuess() {
  if (!currentQuestion) {
    return;
  }

  const rawGuess = answerInput.value.trim();
  if (!rawGuess) {
    setStatus("Type a player.", "warning");
    animateMiss();
    return;
  }

  const guess = normalize(rawGuess);
  const match = answerMatcher.get(guess);

  if (match?.type === "ambiguous") {
    setStatus("Surname matches multiple players. Use full name.", "warning");
    animateMiss();
    answerInput.select();
    return;
  }

  if (!match || match.type !== "exact") {
    setStatus("Not on the board.", "warning");
    animateMiss();
    answerInput.select();
    return;
  }

  if (foundAnswers.has(match.answer)) {
    setStatus("Already found.", "warning");
    animateMiss();
    answerInput.select();
    return;
  }

  foundAnswers.add(match.answer);
  persistProgress();
  renderBoard();

  if (foundAnswers.size === currentQuestion.answers.length) {
    setStatus("You got all 10.", "success");
  } else {
    setStatus(`${foundAnswers.size}/${currentQuestion.answers.length}`);
  }

  answerInput.value = "";
  answerInput.focus();
}

function buildAnswerMatcher(answers) {
  const fullNameMap = new Map();
  const surnameMap = new Map();

  answers.forEach((answer) => {
    const normalizedFull = normalize(answer);
    fullNameMap.set(normalizedFull, answer);

    const surname = getSurname(answer);
    if (!surname) {
      return;
    }

    const normalizedSurname = normalize(surname);
    const existing = surnameMap.get(normalizedSurname) || [];
    existing.push(answer);
    surnameMap.set(normalizedSurname, existing);
  });

  const matcher = new Map();

  fullNameMap.forEach((answer, normalizedFull) => {
    matcher.set(normalizedFull, { type: "exact", answer });
  });

  surnameMap.forEach((answersBySurname, normalizedSurname) => {
    if (answersBySurname.length === 1) {
      matcher.set(normalizedSurname, { type: "exact", answer: answersBySurname[0] });
    } else {
      matcher.set(normalizedSurname, { type: "ambiguous", answers: answersBySurname });
    }
  });

  return matcher;
}

function getSurname(name) {
  const parts = name.trim().split(/\s+/);
  return parts.at(-1) || "";
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
      item.textContent = "•";
    }

    answerBoard.appendChild(item);
  });
}

function refreshStatus() {
  if (!currentQuestion) {
    setStatus("No active question.", "warning");
    return;
  }

  setStatus(`${foundAnswers.size}/${currentQuestion.answers.length}`);
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

function animateMiss() {
  answerInput.classList.remove("shake");
  void answerInput.offsetWidth;
  answerInput.classList.add("shake");
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
