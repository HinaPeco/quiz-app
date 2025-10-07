let questions = [];
let currentIndex = 0;
let correctCount = 0;
let results = [];

// JSONファイルから問題を取得してランダム10問抽出
fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    questions = data.sort(() => 0.5 - Math.random()).slice(0, 10);
    if (window.location.pathname.includes("quiz.html")) {
      showQuestion();
    }
  });

// ---------------------
// 問題表示
// ---------------------
function showQuestion() {
  const q = questions[currentIndex];
  document.getElementById("question").textContent = `Q${currentIndex + 1}. ${q.question}`;

  const choicesDiv = document.getElementById("choices");
  choicesDiv.innerHTML = "";

  q.choices.forEach((choice, index) => {
    const label = document.createElement("label");
    label.style.display = "block";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = index;
    checkbox.name = "choice";

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(choice));
    choicesDiv.appendChild(label);
  });

  document.getElementById("feedback").textContent = "";
  document.getElementById("submitBtn").disabled = false;
  document.getElementById("nextBtn").disabled = false;
}

// ---------------------
// 回答ボタン
// ---------------------
document.getElementById("submitBtn")?.addEventListener("click", () => {
  checkAnswer();
});

// ---------------------
// 次へボタン
// ---------------------
document.getElementById("nextBtn")?.addEventListener("click", () => {
  const anyChecked = document.querySelectorAll('input[name="choice"]:checked').length > 0;
  
  if (!anyChecked) {
    const q = questions[currentIndex];
    results.push({
      question: q.question,
      yourAnswer: "未回答",
      correctAnswer: Array.isArray(q.answer) ? q.answer.map(i => q.choices[i]).join(", ") : q.choices[q.answer],
      isCorrect: false
    });
    document.getElementById("feedback").textContent = `❌ 回答されませんでした。正解は「${results[results.length-1].correctAnswer}」です。`;
  } else if (!document.getElementById("submitBtn").disabled) {
    checkAnswer();
  }

  currentIndex++;
  if (currentIndex < questions.length) {
    showQuestion();
  } else {
    localStorage.setItem("quizResult", JSON.stringify({
      correctCount,
      total: questions.length,
      results
    }));
    window.location.href = "result.html";
  }
});

// ---------------------
// 正誤判定
// ---------------------
function checkAnswer() {
  const q = questions[currentIndex];
  const checked = Array.from(document.querySelectorAll('input[name="choice"]:checked'))
                       .map(input => parseInt(input.value));

  const isCorrect = arraysEqual(checked, Array.isArray(q.answer) ? q.answer : [q.answer]);

  const feedback = document.getElementById("feedback");
  if (isCorrect) {
    feedback.textContent = "✅ 正解！";
    correctCount++;
  } else {
    const correctAnswers = Array.isArray(q.answer) ? q.answer : [q.answer];
    feedback.textContent = `❌ 不正解。正解は「${correctAnswers.map(i => q.choices[i]).join(", ")}」です。`;
  }

  results.push({
    question: q.question,
    yourAnswer: checked.length ? checked.map(i => q.choices[i]).join(", ") : "未回答",
    correctAnswer: (Array.isArray(q.answer) ? q.answer : [q.answer]).map(i => q.choices[i]).join(", "),
    isCorrect
  });

  document.getElementById("submitBtn").disabled = true;
}

// ---------------------
// 配列比較（順不同で完全一致判定）
// ---------------------
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  a = a.slice().sort();
  b = b.slice().sort();
  return a.every((v, i) => v === b[i]);
}

// ---------------------
// 結果画面表示
// ---------------------
if (window.location.pathname.includes("result.html")) {
  window.addEventListener("DOMContentLoaded", () => {
    const resultData = JSON.parse(localStorage.getItem("quizResult"));
    const score = document.getElementById("score");
    score.textContent = `正解数: ${resultData.correctCount} / ${resultData.total}`;

    const resultList = document.getElementById("resultList");
    resultList.innerHTML = "";

    resultData.results.forEach((item, index) => {
      const qDiv = document.createElement("div");
      qDiv.className = "resultItem";

      qDiv.innerHTML = `
        <strong>Q${index + 1}: ${item.question}</strong><br>
        あなたの回答: ${item.yourAnswer}<br>
        正解: ${item.correctAnswer}<br>
        ${item.isCorrect ? "✅ 正解" : "❌ 不正解"}
      `;

      resultList.appendChild(qDiv);
    });
  });
}

// ---------------------
// ホームに戻る
// ---------------------
function goHome() {
  window.location.href = "index.html";
}
