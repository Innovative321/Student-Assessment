let totalTime = parseInt(localStorage.getItem("remainingTime")) || 3600;
let timerInterval;
let reviewQuestions = [];
let allQuestions = [];
let filteredQuestions = [];
let userResponses = JSON.parse(localStorage.getItem("userResponses") || "{}");
let currentReviewIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
    startReviewTimer();
    allQuestions = JSON.parse(localStorage.getItem("quizQuestions") || "[]");
    reviewQuestions = Object.values(JSON.parse(localStorage.getItem("reviewQuestions") || "{}"));

    if (allQuestions.length === 0) {
        document.getElementById("reviewContainer").innerHTML = "<p>No questions available.</p>";
        document.querySelector(".btn-success").style.display = "none";
        return;
    }
    setupSwitchFilters();
    applyFilters();
    setupButtons();
}); 

function startReviewTimer() {
    clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        totalTime--;
        localStorage.setItem("remainingTime", totalTime);
        updateTimerDisplay();
        if (totalTime <= 0) {
            clearInterval(timerInterval);
            Swal.fire("Time's up!", "Your quiz will be submitted automatically.", "warning")
                .then(() => submitQuiz());
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerElement = document.querySelector(".timer");
    if (timerElement) {
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        timerElement.innerText = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }
}

function applyFilters() {
    const markedSwitch = document.getElementById("markedSwitch").checked;
    const unansweredSwitch = document.getElementById("unansweredSwitch").checked;

    const markedIds = new Set(reviewQuestions.map(q => q.id));
    const unansweredQuestions = allQuestions.filter(q => isUnanswered(q.id));
    const markedQuestions = allQuestions.filter(q => markedIds.has(q.id));

    if (markedSwitch && unansweredSwitch) {
        // Show union of marked and unanswered questions
        const combinedMap = new Map();
        [...markedQuestions, ...unansweredQuestions].forEach(q => {
            combinedMap.set(q.id, q); // Avoid duplicates by ID
        });
        filteredQuestions = Array.from(combinedMap.values());
    } else if (markedSwitch) {
        filteredQuestions = markedQuestions;
    } else if (unansweredSwitch) {
        filteredQuestions = unansweredQuestions;
    } else {
        filteredQuestions = allQuestions;
    }

    currentReviewIndex = 0;

    if (filteredQuestions.length === 0) {
        document.getElementById("reviewContainer").innerHTML = "<p>No matching questions to review.</p>";
    } else {
        showReviewQuestion();
    }
}

function isUnanswered(questionId) {
    const response = userResponses[questionId];
    return (
        response === undefined ||
        (Array.isArray(response) ? response.length === 0 : response === "")
    );
}

function showReviewQuestion() {
    const container = document.getElementById("reviewContainer");
    container.innerHTML = "";

    if (filteredQuestions.length === 0) return;

    const question = filteredQuestions[currentReviewIndex];
    const inputType = question.multipleChoice ? "checkbox" : "radio";
    const inputName = `question_${question.id}`;
    let selected = userResponses[question.id] || [];

    if (!Array.isArray(selected)) selected = [selected];

    const questionTitle = document.createElement("h4");
    questionTitle.innerText = `${currentReviewIndex + 1}. ${question.question}`;
    container.appendChild(questionTitle);

    ["option1", "option2", "option3", "option4"].forEach(optionKey => {
        if (!question[optionKey]) return;

        const optionDiv = document.createElement("div");
        optionDiv.classList.add("form-check");

        const input = document.createElement("input");
        input.type = inputType;
        input.name = inputType === "radio" ? inputName : `${inputName}[]`;
        input.value = question[optionKey];
        input.classList.add("form-check-input");
        input.checked = selected.includes(question[optionKey]);

        input.addEventListener("change", () => {
            updateUserResponse(question.id, question.multipleChoice, input.value, input.checked);
        });

        const label = document.createElement("label");
        label.classList.add("form-check-label");
        label.innerText = question[optionKey];

        optionDiv.appendChild(input);
        optionDiv.appendChild(label);
        container.appendChild(optionDiv);
    });
}

function updateUserResponse(questionId, isMultiple, value, isChecked) {
    if (isMultiple) {
        userResponses[questionId] = userResponses[questionId] || [];
        if (isChecked) {
            if (!userResponses[questionId].includes(value)) {
                userResponses[questionId].push(value);
            }
        } else {
            userResponses[questionId] = userResponses[questionId].filter(v => v !== value);
        }
    } else {
        userResponses[questionId] = value;
    }

    localStorage.setItem("userResponses", JSON.stringify(userResponses));
}

function setupButtons() {
    const backBtn = document.querySelector(".btn-secondary");
    const nextBtn = document.querySelector(".btn-primary");

    backBtn.addEventListener("click", previousReviewQuestion);
    nextBtn.addEventListener("click", nextReviewQuestion);
}

function nextReviewQuestion() {
    if (currentReviewIndex < filteredQuestions.length - 1) {
        currentReviewIndex++;
        showReviewQuestion();
    }
}

function previousReviewQuestion() {
    if (currentReviewIndex > 0) {
        currentReviewIndex--;
        showReviewQuestion();
    } else {
        const lastQuizIndex = localStorage.getItem("redirectToQuestion") || "0";
        localStorage.setItem("redirectToQuestion", lastQuizIndex);
        window.location.href = "quiz.html";
    }
}

function setupSwitchFilters() {
    document.getElementById("markedSwitch").addEventListener("change", applyFilters);
    document.getElementById("unansweredSwitch").addEventListener("change", applyFilters);
}

function submitQuiz() {
	const userId = localStorage.getItem("userId");
	console.log("Submitting quiz for userId:", userId); 
	
    Swal.fire({
        title: "Are you sure?",
        text: "Do you want to submit your answers?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, submit it!",
        cancelButtonText: "Cancel"
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.setItem("userResponses", JSON.stringify(userResponses));
            let userId = localStorage.getItem("userId") || "guest";
            let responses = JSON.parse(localStorage.getItem("userResponses") || "{}");

            localStorage.removeItem("quizQuestions");
            localStorage.removeItem("redirectToQuestion");
            localStorage.removeItem("userResponses");
            localStorage.removeItem("reviewQuestions");
            localStorage.removeItem("currentQuestionIndex");
            localStorage.removeItem("questions");
            localStorage.setItem("testStarted", "false");
			

            fetch("/questions/submit-answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: userId, responses: responses })
            })
            .then(response => response.text())
            .then(data => {
                Swal.fire({
                    title: "Success!",
                    text: "Your quiz has been submitted successfully!",
                    icon: "success",
                    confirmButtonText: "OK"
                }).then(() => {
                    window.location.href = "index.html";
                });
            })
            .catch(error => {
                Swal.fire({
                    title: "Error!",
                    text: "There was an issue submitting your quiz. Please try again.",
                    icon: "error",
                    confirmButtonText: "OK"
                });
            });
        }
    });
}
