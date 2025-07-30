let questions = [];
let currentQuestionIndex = 0;
let userResponses = JSON.parse(localStorage.getItem("userResponses") || "{}");
let reviewQuestions = JSON.parse(localStorage.getItem("reviewQuestions") || "{}");
let timer;
let totalTime = 60 * 60; // 60 minutes in seconds
let testStarted = localStorage.getItem("testStarted") === "false";

document.addEventListener("DOMContentLoaded", function () {
    const testStartedFlag = localStorage.getItem("testStarted");

    if (!(testStartedFlag === "false" || testStartedFlag === null)) {
        resetTestData();
    } else {
        const savedTime = parseInt(localStorage.getItem("remainingTime"));
        totalTime = isNaN(savedTime) ? 60 * 60 : savedTime;
        startGlobalTimer();
    }

    const savedQuestions = localStorage.getItem("quizQuestions");

    if (savedQuestions) {
        questions = JSON.parse(savedQuestions);

        const redirectIndex = localStorage.getItem("redirectToQuestion");
        if (redirectIndex !== null && !isNaN(redirectIndex)) {
            currentQuestionIndex = parseInt(redirectIndex, 10);
            localStorage.removeItem("redirectToQuestion");
        }

        showQuestion();
    } else {
	resetTestData();
        fetchQuestions();
    }
});

function fetchQuestions() {
    const category = localStorage.getItem("userCategory"); // ✅ Read category from localStorage

    if (!category) {
        alert("No category found. Please start again from the homepage.");
        window.location.href = "index.html";
        return;
    }
	resetTestData();
	fetch(`/questions/category/${category}`)
	    .then(response => response.json())
	    .then(data => {
			const storedQuestions = localStorage.getItem("quizQuestions");

	           if (storedQuestions) {
	               questions = JSON.parse(storedQuestions);
	           } else {
	               questions = shuffleArray(data).slice(0, 50);
	               localStorage.setItem("quizQuestions", JSON.stringify(questions));
	           }
	        /*if (!Array.isArray(data)) {
	            throw new Error("Response is not a valid question array.");
	        }

	        questions = shuffleArray(data).slice(0, 50);
	        localStorage.setItem("quizQuestions", JSON.stringify(questions));
	        */
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
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showQuestion() {
	
	console.log("Current question index:", currentQuestionIndex);
	localStorage.setItem("currentQuestionIndex", currentQuestionIndex);
		
    if (!questions || questions.length === 0) {
        document.getElementById("question").innerText = "No questions available.";
        return;
    }

    if (currentQuestionIndex >= questions.length) {
		console.warn("Invalid currentQuestionIndex, resetting to 0.");
        currentQuestionIndex = 0;
    }

    let questionData = questions[currentQuestionIndex];
	if (!questionData) {
	        console.error("Question data not found for index", currentQuestionIndex);
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
		const note = document.createElement("p");
	    note.style.fontWeight = "bold";
	    note.style.fontSize = "15px";
	    questionText += ` (Select ${requiredCount})`;
	}

    document.getElementById("question").innerText = questionText;

    const optionsContainer = document.getElementById("options");
    optionsContainer.innerHTML = "";

    let inputType = questionData.multipleChoice ? "checkbox" : "radio";
    let inputName = `question_${questionData.id}`;
	
	let maxSelectable = 1; // Default to 1 for single-choice
	if (questionData.correctAnswers) {
	    if (Array.isArray(questionData.correctAnswers)) {
	        maxSelectable = questionData.correctAnswers.length;
	    } else if (typeof questionData.correctAnswers === "string") {
	        maxSelectable = questionData.correctAnswers.split(",").length;
	    }
	}

    ["option1", "option2", "option3", "option4"].forEach(optionKey => {
        if (questionData[optionKey]) {
            let optionDiv = document.createElement("div");
            optionDiv.classList.add("form-check", "p-1");

            let optionLabel = document.createElement("label");
            optionLabel.classList.add("form-check-label", "d-flex", "align-items-center");
            optionLabel.style.cursor = "pointer";
            optionLabel.style.gap = "8px";

            let input = document.createElement("input");
            input.type = inputType;
            input.name = inputType === "radio" ? inputName : `${inputName}[]`;
            input.value = questionData[optionKey];
            input.id = `${inputName}_${optionKey}`;
            input.classList.add("form-check-input");
            input.style.width = "1.2rem";
            input.style.height = "1.2rem";

            input.addEventListener("change", () =>
                handleCheckboxSelection(inputName, maxSelectable, questionData.id, inputType, input.value, input.checked)
            );

            if (questionData.multipleChoice && Array.isArray(userResponses[questionData.id])) {
                input.checked = userResponses[questionData.id].includes(questionData[optionKey]);
            } else if (userResponses[questionData.id] === questionData[optionKey]) {
                input.checked = true;
            }

            optionLabel.appendChild(input);
            optionLabel.appendChild(document.createTextNode(` ${questionData[optionKey]}`));
			optionLabel.addEventListener("mouseenter", () => {
                optionLabel.style.color = "#007bff";
            });
            optionLabel.addEventListener("mouseleave", () => {
                optionLabel.style.color = "";
            });
			optionDiv.appendChild(optionLabel);
            optionsContainer.appendChild(optionDiv);
        }
    });

    let reviewCheckbox = document.getElementById("markReview");
    if (reviewCheckbox) {
        reviewCheckbox.checked = reviewQuestions[questionData.id] || false;
    }
}

function handleCheckboxSelection(inputName, maxSelectable, questionId, inputType, value, isChecked) {
    let selectedOptions = document.querySelectorAll(`input[name='${inputName}[]']:checked`);

    if (selectedOptions.length >= maxSelectable) {
        document.querySelectorAll(`input[name='${inputName}[]']:not(:checked')`).forEach(option => {
            option.disabled = true;
        });
    } else {
        document.querySelectorAll(`input[name='${inputName}[]']`).forEach(option => {
            option.disabled = false;
        });
    }

    if (inputType === "checkbox") {
        userResponses[questionId] = userResponses[questionId] || [];
        if (isChecked) {
            userResponses[questionId].push(value);
        } else {
            userResponses[questionId] = userResponses[questionId].filter(ans => ans !== value);
        }
    } else {
        userResponses[questionId] = value;
    }

    localStorage.setItem("userResponses", JSON.stringify(userResponses));
}

function saveResponse() {
    let reviewCheckbox = document.getElementById("markReview");
    if (!reviewCheckbox) return;

    let questionData = questions[currentQuestionIndex];
    let selectedOptions = document.querySelectorAll(`input[name="question_${questionData.id}[]"]:checked`);
    let selectedValues = [...selectedOptions].map(option => option.value);

    if (questionData.multipleChoice) {
        userResponses[questionData.id] = selectedValues;
    } else {
        let singleSelection = document.querySelector(`input[name="question_${questionData.id}"]:checked`);
        userResponses[questionData.id] = singleSelection ? singleSelection.value : null;
    }

    if (reviewCheckbox.checked) {
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
    alert("Time is up! Submitting your quiz.");
    window.location.href = "review.html";
}

function resetTestData() {
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
    testStarted = true;

    const savedTime = parseInt(localStorage.getItem("remainingTime"));
    totalTime = isNaN(savedTime) ? 60 * 60 : savedTime;

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
