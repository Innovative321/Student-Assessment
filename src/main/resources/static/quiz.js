let questions = [];
let currentQuestionIndex = 0;
let userResponses = JSON.parse(localStorage.getItem("userResponses") || "{}");
let reviewQuestions = JSON.parse(localStorage.getItem("reviewQuestions") || "{}");
let timer;
let totalTime = 60 * 60; // 60 minutes in seconds

document.addEventListener("DOMContentLoaded", function () {
    const testStartedFlag = localStorage.getItem("testStarted");
    console.log("testStartedFlag:", testStartedFlag);

    // ✅ CASE 1: New test (no data or manually restarted)
    if (testStartedFlag === null || testStartedFlag === "false") {
        console.log("Starting new test...");
        resetTestData();
        fetchQuestions();
        return;
    }

    // ✅ CASE 2: Returning from review or already in-progress test
    const savedQuestions = localStorage.getItem("quizQuestions");
    if (savedQuestions) {
        console.log("Restoring existing quiz data...");
        questions = JSON.parse(savedQuestions);

        const redirectIndex = localStorage.getItem("redirectToQuestion");
        if (redirectIndex !== null && !isNaN(redirectIndex)) {
            currentQuestionIndex = parseInt(redirectIndex, 10);
            localStorage.removeItem("redirectToQuestion");
        }

        const savedTime = parseInt(localStorage.getItem("remainingTime"));
        totalTime = isNaN(savedTime) ? 60 * 60 : savedTime;
        startGlobalTimer();
        showQuestion();
        return;
    }

    // ✅ CASE 3: Fallback if data is missing
    console.log("No saved questions found, fetching fresh...");
    resetTestData();
    fetchQuestions();
});

// ✅ Fetch Questions (only for fresh start)
function fetchQuestions() {
    const category = localStorage.getItem("userCategory"); // from homepage
    if (!category) {
        Swal.fire("Error", "No category found. Please start again.", "error")
            .then(() => window.location.href = "index.html");
        return;
    }

    console.log("Fetching Questions for category:", category);
    fetch(`/questions/category/${category}`)
        .then(response => response.json())
        .then(data => {
            questions = shuffleArray(data).slice(0, 50);
            localStorage.setItem("quizQuestions", JSON.stringify(questions));
            startTest();
            showQuestion();
        })
        .catch(error => {
            console.error("Error fetching questions:", error);
            Swal.fire({
                icon: 'error',
                title: 'Failed to Load Questions',
                text: 'Please try again or contact support.',
                confirmButtonColor: '#d33'
            });
        });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ✅ Display Question
function showQuestion() {
    console.log("Showing question index:", currentQuestionIndex);
    localStorage.setItem("currentQuestionIndex", currentQuestionIndex);

    if (!questions || questions.length === 0) {
        document.getElementById("question").innerText = "No questions available.";
        return;
    }

    if (currentQuestionIndex >= questions.length) {
        currentQuestionIndex = 0;
    }

    const questionData = questions[currentQuestionIndex];
    if (!questionData) {
        console.error("Question not found for index", currentQuestionIndex);
        return;
    }

    let questionText = `${currentQuestionIndex + 1}. ${questionData.question}`;
    if (questionData.multipleChoice) {
        let requiredCount = 1;
        if (questionData.correctAnswers) {
            if (Array.isArray(questionData.correctAnswers)) {
                requiredCount = questionData.correctAnswers.length;
            } else if (typeof questionData.correctAnswers === "string") {
                requiredCount = questionData.correctAnswers.split(",").length;
            }
        }
        questionText += ` (Select ${requiredCount})`;
    }

    document.getElementById("question").innerText = questionText;
    const optionsContainer = document.getElementById("options");
    optionsContainer.innerHTML = "";

    const inputType = questionData.multipleChoice ? "checkbox" : "radio";
    const inputName = `question_${questionData.id}`;

    let maxSelectable = 1;
    if (questionData.correctAnswers) {
        if (Array.isArray(questionData.correctAnswers)) {
            maxSelectable = questionData.correctAnswers.length;
        } else if (typeof questionData.correctAnswers === "string") {
            maxSelectable = questionData.correctAnswers.split(",").length;
        }
    }

    ["option1", "option2", "option3", "option4"].forEach(optionKey => {
        if (questionData[optionKey]) {
            const optionDiv = document.createElement("div");
            optionDiv.classList.add("form-check", "p-1");

            const label = document.createElement("label");
            label.classList.add("form-check-label", "d-flex", "align-items-center");
            label.style.cursor = "pointer";
            label.style.gap = "8px";

            const input = document.createElement("input");
            input.type = inputType;
            input.name = inputType === "radio" ? inputName : `${inputName}[]`;
            input.value = questionData[optionKey];
            input.id = `${inputName}_${optionKey}`;
            input.classList.add("form-check-input");
            input.style.width = "1.2rem";
            input.style.height = "1.2rem";

            // Restore user selection
            if (questionData.multipleChoice && Array.isArray(userResponses[questionData.id])) {
                input.checked = userResponses[questionData.id].includes(questionData[optionKey]);
            } else if (userResponses[questionData.id] === questionData[optionKey]) {
                input.checked = true;
            }

            input.addEventListener("change", () =>
                handleCheckboxSelection(inputName, maxSelectable, questionData.id, inputType, input.value, input.checked)
            );

            label.appendChild(input);
            label.appendChild(document.createTextNode(` ${questionData[optionKey]}`));
            optionDiv.appendChild(label);
            optionsContainer.appendChild(optionDiv);
        }
    });

    const reviewCheckbox = document.getElementById("markReview");
    if (reviewCheckbox) {
        reviewCheckbox.checked = reviewQuestions[questionData.id] || false;
    }
}

function handleCheckboxSelection(inputName, maxSelectable, questionId, inputType, value, isChecked) {
    const selectedOptions = document.querySelectorAll(`input[name='${inputName}[]']:checked'`);

    if (selectedOptions.length >= maxSelectable) {
        document.querySelectorAll(`input[name='${inputName}[]']:not(:checked')`).forEach(opt => opt.disabled = true);
    } else {
        document.querySelectorAll(`input[name='${inputName}[]']`).forEach(opt => opt.disabled = false);
    }

    if (inputType === "checkbox") {
        userResponses[questionId] = userResponses[questionId] || [];
        if (isChecked) {
            if (!userResponses[questionId].includes(value)) userResponses[questionId].push(value);
        } else {
            userResponses[questionId] = userResponses[questionId].filter(ans => ans !== value);
        }
    } else {
        userResponses[questionId] = value;
    }

    localStorage.setItem("userResponses", JSON.stringify(userResponses));
}

function saveResponse() {
    const questionData = questions[currentQuestionIndex];
    if (!questionData) return;

    const reviewCheckbox = document.getElementById("markReview");
    const selectedCheckboxes = document.querySelectorAll(`input[name="question_${questionData.id}[]"]:checked`);
    const selectedValues = [...selectedCheckboxes].map(opt => opt.value);

    if (questionData.multipleChoice) {
        userResponses[questionData.id] = selectedValues;
    } else {
        const selectedRadio = document.querySelector(`input[name="question_${questionData.id}"]:checked`);
        userResponses[questionData.id] = selectedRadio ? selectedRadio.value : null;
    }

    if (reviewCheckbox && reviewCheckbox.checked) {
        reviewQuestions[questionData.id] = questionData;
    } else {
        delete reviewQuestions[questionData.id];
    }

    localStorage.setItem("reviewQuestions", JSON.stringify(reviewQuestions));
    localStorage.setItem("userResponses", JSON.stringify(userResponses));
}

function nextQuestion() {
    saveResponse();
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    } else {
        clearInterval(timer);
        window.location.href = "review.html";
    }
}

function previousQuestion() {
    saveResponse();
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion();
    }
}

function goToReview() {
    saveResponse();
    localStorage.setItem("redirectToQuestion", currentQuestionIndex);
    window.location.href = "review.html";
}

function submitQuiz() {
    Swal.fire("Time is up!", "Your quiz will be submitted automatically.", "warning")
        .then(() => window.location.href = "review.html");
}

function resetTestData() {
    console.log("Resetting all quiz data...");
    localStorage.removeItem("userResponses");
    localStorage.removeItem("reviewQuestions");
    localStorage.removeItem("quizQuestions");
    localStorage.removeItem("redirectToQuestion");
    localStorage.removeItem("remainingTime");
    localStorage.setItem("testStarted", "false");

    userResponses = {};
    reviewQuestions = {};
}

function startTest() {
    console.log("Starting test...");
    totalTime = 60 * 60; // reset to full time
    localStorage.setItem("testStarted", "true");
    localStorage.setItem("remainingTime", totalTime);
    startGlobalTimer();
}

function startGlobalTimer() {
    updateTimerDisplay();
    clearInterval(timer);
    timer = setInterval(() => {
        totalTime--;
        localStorage.setItem("remainingTime", totalTime);
        updateTimerDisplay();

        if (totalTime <= 0) {
            clearInterval(timer);
            submitQuiz();
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
