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
      choices: q.choices,
      yourAnswerIndexes: [],
      correctIndexes: Array.isArray(q.answer) ? q.answer : [q.answer],
      isCorrect: false
    });
    document.getElementById("feedback").textContent = `❌ 回答されませんでした。正解は「${results[results.length-1].correctIndexes.map(i=>q.choices[i]).join(", ")}」です。`;
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

  const correctAnswers = Array.isArray(q.answer) ? q.answer : [q.answer];
  const isCorrect = arraysEqual(checked, correctAnswers);

  const feedback = document.getElementById("feedback");
  if (isCorrect) {
    feedback.textContent = "✅ 正解！";
    correctCount++;
  } else {
    feedback.textContent = `❌ 不正解。正解は「${correctAnswers.map(i => q.choices[i]).join(", ")}」です。`;
  }

  results.push({
    question: q.question,
    choices: q.choices,
    yourAnswerIndexes: checked,
    correctIndexes: correctAnswers,
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

      let choicesHTML = "";
      item.choices.forEach((choice, i) => {
        let className = "choice";
        if (item.correctIndexes.includes(i)) {
          className += " correct";
        }
        if (item.yourAnswerIndexes.includes(i) && !item.correctIndexes.includes(i)) {
          className += " wrong";
        }
        if (item.yourAnswerIndexes.includes(i) && item.correctIndexes.includes(i)) {
          className += " selected-correct";
        }
        choicesHTML += `<div class="${className}">${choice}</div>`;
      });

      qDiv.innerHTML = `
        <strong>Q${index + 1}: ${item.question}</strong><br>
        ${choicesHTML}
        <p>${item.isCorrect ? "✅ 正解" : "❌ 不正解"}</p>
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
