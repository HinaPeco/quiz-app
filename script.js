/* 共通変数 */
let questions = [];
let currentIndex = 0;
let correctCount = 0;
let results = [];

/* ユーティリティ */
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  a = a.slice().sort();
  b = b.slice().sort();
  return a.every((v, i) => v === b[i]);
}

/* DOM読み込み後にページ判定して処理 */
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (path.includes("quiz.html")) {
    initQuizPage();
  }

  if (path.includes("result.html")) {
    renderResultPage();
  }
});

function initQuizPage() {
  const qEl = document.getElementById("question");
  const choicesDiv = document.getElementById("choices");
  const feedback = document.getElementById("feedback");
  const submitBtn = document.getElementById("submitBtn");
  const nextBtn = document.getElementById("nextBtn");

  currentIndex = 0;
  correctCount = 0;
  results = [];

  // --- ★ モードによって読み込む問題ファイルを切り替える ---
  const mode = localStorage.getItem("quizMode") || "basic";

  // モードに応じて問題ファイルを決定
  let questionFile = "basic_questions.json";
  if (mode === "advanced") {
    questionFile = "advanced_questions.json";
  } else if (mode === "advanced_doublestar") {
    questionFile = "advanced_doublestar_questions.json";
  }

  // --- 質問データ読み込み（ランダム10問） ---
  fetch(questionFile)
    .then(response => response.json())
    .then(data => {
      questions = data.sort(() => 0.5 - Math.random()).slice(0, 10);
      showQuestion();
    })
    .catch(err => {
      qEl.textContent = "問題の読み込みに失敗しました。";
      console.error(err);
    });

  submitBtn.addEventListener("click", () => {
    checkAnswer();
  });

  nextBtn.addEventListener("click", () => {
    const anyChecked = document.querySelectorAll('input[name="choice"]:checked').length > 0;
    if (!anyChecked && !submitBtn.disabled) {
      const q = questions[currentIndex];
      results.push({
        question: q.question,
        choices: q.choices,
        yourAnswerIndexes: [],
        correctIndexes: Array.isArray(q.answer) ? q.answer : [q.answer],
        isCorrect: false
      });
      feedback.textContent = `❌ 回答されませんでした。正解は「${results[results.length-1].correctIndexes.map(i=>q.choices[i]).join(", ")}」です。`;
      submitBtn.disabled = true;
    } else if (!submitBtn.disabled) {
      checkAnswer();
    }

    currentIndex++;
    if (currentIndex < questions.length) {
      showQuestion();
    } else {
      // 結果を保存（モードも一緒に保存）
      localStorage.setItem("quizResult", JSON.stringify({
        correctCount,
        total: questions.length,
        results,
        mode
      }));
      window.location.href = "result.html";
    }
  });
}



/* 問題表示 */
function showQuestion() {
  const q = questions[currentIndex];
  const qEl = document.getElementById("question");
  const choicesDiv = document.getElementById("choices");
  const feedback = document.getElementById("feedback");
  const submitBtn = document.getElementById("submitBtn");
  const nextBtn = document.getElementById("nextBtn");

  // 問題文を表示
  qEl.textContent = `Q${currentIndex + 1}. ${q.question}`;

  // 画像がある場合だけ表示する
  const imageContainer = document.getElementById("question-image");
  if (q.image) {
    imageContainer.innerHTML = `<img src="${q.image}" alt="問題画像" class="question-img">`;
  } else {
    imageContainer.innerHTML = "";
  }

  choicesDiv.innerHTML = "";

  // 複数解ありの場合と単一解で input type を分ける
  const multiple = Array.isArray(q.answer);

  q.choices.forEach((choice, index) => {
    const label = document.createElement("label");
    label.className = "choice-label";

    const input = document.createElement("input");
    input.type = multiple ? "checkbox" : "radio";
    input.name = "choice";
    input.value = index;

    label.appendChild(input);
    const span = document.createElement("span");
    span.textContent = choice;
    label.appendChild(span);

    choicesDiv.appendChild(label);
  });

  feedback.textContent = "";
  submitBtn.disabled = false;
  nextBtn.disabled = false;
}


/* 正誤判定 */
function checkAnswer() {
  const q = questions[currentIndex];
  const checked = Array.from(document.querySelectorAll('input[name="choice"]:checked'))
                       .map(input => parseInt(input.value));

  const correctAnswers = Array.isArray(q.answer) ? q.answer : [q.answer];
  const isCorrect = arraysEqual(checked, correctAnswers);

  const feedback = document.getElementById("feedback");
  if (isCorrect) {
    feedback.textContent = "✅ 正解！";
    correctCount++;
  } else {
    feedback.textContent = `❌ 不正解。正解は「${correctAnswers.map(i => q.choices[i]).join(", ")}」です。`;
    // 強調：選択されている箇所を赤に、正解を緑に（見た目）
    // （既に next に進むときにページ更新されるので視認用）
  }

  // 結果配列に保存
  results.push({
    question: q.question,
    choices: q.choices,
    yourAnswerIndexes: checked,
    correctIndexes: correctAnswers,
    isCorrect
  });

  // submit を無効にして二重送信防止
  document.getElementById("submitBtn").disabled = true;

  // ビジュアルで強調（選択肢の色付け）
  // まず全ラベルをリセット
  document.querySelectorAll("#choices label").forEach((lab, idx) => {
    lab.classList.remove("correct-choice", "wrong-choice");
    const input = lab.querySelector("input");
    const i = parseInt(input.value);
    if (correctAnswers.includes(i)) lab.classList.add("correct-choice");
    if (checked.includes(i) && !correctAnswers.includes(i)) lab.classList.add("wrong-choice");
  });
}

/* ========== 結果ページの描画 ========== */
function renderResultPage() {
  const raw = localStorage.getItem("quizResult");
  const list = document.getElementById("results-list");
  const summary = document.getElementById("scoreSummary");
  const retry = document.getElementById("retry-btn");
  const home = document.getElementById("home-btn");

  if (!raw) {
    list.innerHTML = "<p>結果データが見つかりません。クイズを最初から実行してください。</p>";
    summary.textContent = "-";
    retry.onclick = () => window.location.href = "quiz.html";
    home.onclick = () => window.location.href = "index.html";
    return;
  }

  const data = JSON.parse(raw);
  summary.textContent = `${data.correctCount} / ${data.total}`;

  list.innerHTML = "";
  data.results.forEach((item, idx) => {
    const block = document.createElement("div");
    block.className = "question-block";

    const header = document.createElement("div");
    header.className = "question-header";
    header.textContent = `Q${idx+1}: ${item.question}`;

    const answerSection = document.createElement("div");
    answerSection.className = "answer-section";

    const mark = document.createElement("div");
    mark.className = "mark " + (item.isCorrect ? "correct" : "incorrect");
    mark.textContent = item.isCorrect ? "✔" : "✖";

    const optionsDiv = document.createElement("div");
    optionsDiv.className = "options";

    item.choices.forEach((choiceText, i) => {
      const opt = document.createElement("div");
      opt.className = "option-item";
      if (item.correctIndexes.includes(i)) opt.classList.add("correct-option");
      if (item.yourAnswerIndexes.includes(i) && !item.correctIndexes.includes(i)) opt.classList.add("wrong-selected");

      const input = document.createElement("input");
      input.type = "checkbox";
      input.disabled = true;
      if (item.yourAnswerIndexes.includes(i)) input.checked = true;
      opt.appendChild(input);

      const label = document.createElement("label");
      label.style.marginLeft = "6px";
      label.textContent = choiceText;
      opt.appendChild(label);

      optionsDiv.appendChild(opt);
    });

    answerSection.appendChild(mark);
    answerSection.appendChild(optionsDiv);

    block.appendChild(header);
    block.appendChild(answerSection);

    list.appendChild(block);
  });

  retry.onclick = () => {
    // もう一度やるなら以前の結果は消すが、モードは維持
    const data = JSON.parse(localStorage.getItem("quizResult"));
    const mode = data?.mode || "basic";
    localStorage.setItem("quizMode", mode);
    localStorage.removeItem("quizResult");
    window.location.href = "quiz.html";
  };
  home.onclick = () => window.location.href = "index.html";
}
