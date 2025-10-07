let questions = [];
let currentIndex = 0;
let correctCount = 0;
let results = [];

fetch("questions.json")
  .then(res => res.json())
  .then(data => {
    // ランダムに10問選ぶ（問題数が10未満なら全問）
    questions = data.sort(() => 0.5 - Math.random()).slice(0, 10);
    showQuestion();
  });

function showQuestion() {
  const q = questions[currentIndex];
  document.getElementById("question").textContent = `Q${currentIndex + 1}. ${q.question}`;

  const choicesDiv = document.getElementById("choices");
  choicesDiv.innerHTML = "";

  q.choices.forEach((choice, index) => {
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.addEventListener("click", () => selectAnswer(index));
    choicesDiv.appendChild(btn);
  });

  document.getElementById("feedback").textContent = "";
  document.getElementById("nextBtn").disabled = true;
}

function selectAnswer(selectedIndex) {
  const q = questions[currentIndex];
  const feedback = document.getElementById("feedback");
  const nextBtn = document.getElementById("nextBtn");
  const isCorrect = selectedIndex === q.answer;

  if (isCorrect) {
    feedback.textContent = "✅ 正解！";
    correctCount++;
  } else {
    feedback.textContent = `❌ 不正解。正解は「${q.choices[q.answer]}」です。`;
  }

  results.push({
    question: q.question,
    yourAnswer: q.choices[selectedIndex],
    correctAnswer: q.choices[q.answer],
    isCorrect
  });

  nextBtn.disabled = false;
}

document.getElementById("nextBtn").addEventListener("click", () => {
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
