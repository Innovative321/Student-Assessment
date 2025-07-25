let questions = [];
let currentQuestionIndex = 0;
let userResponses = JSON.parse(localStorage.getItem("userResponses") || "{}");
let reviewQuestions = JSON.parse(localStorage.getItem("reviewQuestions") || "{}");
let timer;
let totalTime = 60 * 60; // 60 minutes in seconds
let testStarted = localStorage.getItem("testStarted") === "false";

document.addEventListener("DOMContentLoaded", function () {
	
	let savedIndex = localStorage.getItem("redirectToQuestion");
	
		if (!testStarted) {
	        resetTestData(); // Clear old test data if a new test is starting
	    }
		
	    if (savedIndex !== null) {
	        currentQuestionIndex = parseInt(savedIndex, 10);
	        localStorage.removeItem("redirectToQuestion");
	    } else {
	        currentQuestionIndex = 0; // Ensure quiz starts from first question on fresh start
	        localStorage.setItem("currentQuestionIndex", "0");
	    }
		
    fetchQuestions();
});

function fetchQuestions() {
    fetch("https://innovativeacademy.online/quiz/questions") // Update URL if needed
        .then(response => response.json())
        .then(data => {
<<<<<<< Updated upstream
             questions = shuffleArray(data).slice(0, 50); // Shuffle and select 50 questions
=======
			console.log(data);
            questions = shuffleArray(data).slice(0, 5); // Shuffle and select 5 questions
			
			// Reset index only if not returning from review
           if (!localStorage.getItem("redirectToQuestion")) {
               currentQuestionIndex = 0;
               localStorage.setItem("currentQuestionIndex", "0");
           }
			startTest();
>>>>>>> Stashed changes
            showQuestion();
        })
        .catch(error => console.error("Error fetching questions:", error));
}

// Function to shuffle questions (Fisher-Yates Algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showQuestion() {
    if (questions.length === 0) {
        document.getElementById("question").innerText = "No questions available.";
        return;
    }

    let questionData = questions[currentQuestionIndex];
    document.getElementById("question").innerText = `${currentQuestionIndex + 1}. ${questionData.question}`;
	localStorage.setItem("currentQuestionIndex", currentQuestionIndex);
	
    const optionsContainer = document.getElementById("options");
    optionsContainer.innerHTML = "";

    let inputType = questionData.multipleChoice ? "checkbox" : "radio";
    let inputName = `question_${questionData.id}`;
    
    let maxSelectable = 1; // Default to 1 for single-choice
    if (questionData.multipleChoice) {
        maxSelectable = questionData.correctAnswers.split(",").length; // Get correct answers count
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
            input.addEventListener("change", () => handleCheckboxSelection(inputName, maxSelectable, questionData.id, inputType, input.value, input.checked));

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
        document.querySelectorAll(`input[name='${inputName}[]']:not(:checked)`).forEach(option => {
            option.disabled = true; // Disable unchecked boxes when limit is reached
        });
    } else {
        document.querySelectorAll(`input[name='${inputName}[]']`).forEach(option => {
            option.disabled = false; // Enable boxes when below the limit
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

function resetTestData() {
    console.log("Resetting test data...");

    // Clear stored responses and review data
    localStorage.removeItem("userResponses");
    localStorage.removeItem("reviewQuestions");

    // Reset objects in memory
    userResponses = {};
    reviewQuestions = {};
}

function startTest() {
        testStarted = true;
        totalTime = 60 * 60; // Reset timer to 60 minutes
        localStorage.setItem("testStarted", "true");
        localStorage.setItem("remainingTime", totalTime);
        startGlobalTimer();
}

// Function to start a global timer
function startGlobalTimer() {
    updateTimerDisplay();
    clearInterval(timer); // Ensure no duplicate timers are running
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

// Update timer display
function updateTimerDisplay() {
    let timerElement = document.querySelector(".timer");
    if (timerElement) {
        let minutes = Math.floor(totalTime / 60);
        let seconds = totalTime % 60;
        timerElement.innerText = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }
}

function saveResponse() {
    let reviewCheckbox = document.getElementById("markReview");
    if (!reviewCheckbox) {
        console.error("Error: 'markReview' checkbox not found.");
        return;
    }

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

// Redirect to review and save progress
function goToReview() {
    saveResponse();
    localStorage.setItem("redirectToQuestion", currentQuestionIndex);
    window.location.href = "review.html";
}

function submitQuiz() {
    alert("Time is up! Submitting your quiz.");
    window.location.href = "review.html";
}
 

//updated quiz.js


let questions = [];
let currentQuestionIndex = 0;
let userResponses = JSON.parse(localStorage.getItem("userResponses") || "{}");
let reviewQuestions = JSON.parse(localStorage.getItem("reviewQuestions") || "{}");
let timer;
let totalTime = 60 * 60; // 60 minutes in seconds
let testStarted = localStorage.getItem("testStarted") === "false";

document.addEventListener("DOMContentLoaded", function () {
    const savedQuestions = localStorage.getItem("quizQuestions");
    //const savedIndex = localStorage.getItem("currentQuestionIndex");
	let savedIndex = localStorage.getItem("redirectToQuestion");
    const testStartedFlag = localStorage.getItem("testStarted");

    // If quiz wasn't started or localStorage is broken, reset everything
    if (testStartedFlag === "false" || testStartedFlag === null) {
        resetTestData();
    }

    if (savedQuestions) {
        questions = JSON.parse(savedQuestions);
    }

	if (savedIndex !== null && !isNaN(savedIndex)) {
	    currentQuestionIndex = parseInt(savedIndex, 10);
	    localStorage.removeItem("redirectToQuestion");
	} else {
	    const storedIndex = parseInt(localStorage.getItem("currentQuestionIndex"), 10);
	    currentQuestionIndex = !isNaN(storedIndex) ? storedIndex : 0;
	    localStorage.setItem("currentQuestionIndex", currentQuestionIndex.toString());
	}

    if (!questions || questions.length === 0) {
        fetchQuestions(); // fallback if local data missing
    } else {
        startTest();
        showQuestion();
    }
});

function fetchQuestions() {

   fetch("http://localhost:8080/quiz/questions")
       .then(response => response.json())
       .then(data => {
           console.log(data);
           // Check if we're resuming or starting fresh
           const storedQuestions = localStorage.getItem("quizQuestions");

           if (storedQuestions) {
               questions = JSON.parse(storedQuestions);
           } else {
               questions = shuffleArray(data).slice(0, 5);
               localStorage.setItem("quizQuestions", JSON.stringify(questions));
           }
           // DO NOT reset currentQuestionIndex here again!
           startTest();
           showQuestion();
       })
       .catch(error => console.error("Error fetching questions:", error));
}


// Function to shuffle questions (Fisher-Yates Algorithm)
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

	    document.getElementById("question").innerText = `${currentQuestionIndex + 1}. ${questionData.question}`;
	   // localStorage.setItem("currentQuestionIndex", currentQuestionIndex);
		
    const optionsContainer = document.getElementById("options");
    optionsContainer.innerHTML = "";

    let inputType = questionData.multipleChoice ? "checkbox" : "radio";
    let inputName = `question_${questionData.id}`;
    
    let maxSelectable = 1; // Default to 1 for single-choice
    if (questionData.multipleChoice) {
        maxSelectable = questionData.correctAnswers.split(",").length; // Get correct answers count
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
            input.addEventListener("change", () => handleCheckboxSelection(inputName, maxSelectable, questionData.id, inputType, input.value, input.checked));

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
        document.querySelectorAll(`input[name='${inputName}[]']:not(:checked)`).forEach(option => {
            option.disabled = true; // Disable unchecked boxes when limit is reached
        });
    } else {
        document.querySelectorAll(`input[name='${inputName}[]']`).forEach(option => {
            option.disabled = false; // Enable boxes when below the limit
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

function resetTestData() {
    console.log("Resetting test data...");

    // Clear stored responses and review data
    localStorage.removeItem("userResponses");
    localStorage.removeItem("reviewQuestions");

    // Reset objects in memory
    userResponses = {};
    reviewQuestions = {};
}

function startTest() {
        testStarted = true;
        totalTime = 60 * 60; // Reset timer to 60 minutes
        localStorage.setItem("testStarted", "true");
        localStorage.setItem("remainingTime", totalTime);
        startGlobalTimer();
}

// Function to start a global timer
function startGlobalTimer() {
    updateTimerDisplay();
    clearInterval(timer); // Ensure no duplicate timers are running
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

// Update timer display
function updateTimerDisplay() {
    let timerElement = document.querySelector(".timer");
    if (timerElement) {
        let minutes = Math.floor(totalTime / 60);
        let seconds = totalTime % 60;
        timerElement.innerText = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }
}

function saveResponse() {
    let reviewCheckbox = document.getElementById("markReview");
    if (!reviewCheckbox) {
        console.error("Error: 'markReview' checkbox not found.");
        return;
    }

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

// Redirect to review and save progress
function goToReview() {
    saveResponse();
	localStorage.setItem("redirectToQuestion", currentQuestionIndex);
	window.location.href = "review.html";
}

function submitQuiz() {
    alert("Time is up! Submitting your quiz.");
    window.location.href = "review.html";
}


//review.js

document.addEventListener("DOMContentLoaded", function () {
    let reviewContainer = document.getElementById("reviewContainer");
    if (!reviewContainer) {
        console.error("Error: 'reviewContainer' not found.");
        return;
    }

    let storedData = localStorage.getItem("reviewQuestions");
    let reviewQuestions = JSON.parse(storedData) || {};
    let userResponses = JSON.parse(localStorage.getItem("userResponses") || "{}");

    if (Object.keys(reviewQuestions).length === 0) {
        reviewContainer.innerHTML = "<p>No questions marked for review.</p>";
        return;
    }

    Object.values(reviewQuestions).forEach((question, index) => {
        if (!question || typeof question !== "object" || !question.question) {
            console.error("Skipping invalid question:", question);
            return;
        }

        let div = document.createElement("div");
        div.classList.add("mb-3");

        let questionTitle = document.createElement("h4");
        questionTitle.innerText = `${index + 1}. ${question.question}`;
        div.appendChild(questionTitle);

        let inputType = question.multipleChoice ? "checkbox" : "radio";
        let selectedAnswers = userResponses[question.id] || [];

        if (!Array.isArray(selectedAnswers)) {
            selectedAnswers = selectedAnswers ? [selectedAnswers] : [];
        }

        ["option1", "option2", "option3", "option4"].forEach(optionKey => {
            if (!question[optionKey]) return;

            let optionDiv = document.createElement("div");
            optionDiv.classList.add("form-check");

            let input = document.createElement("input");
            input.type = inputType;
            input.name = `question_${question.id}`;
            input.value = question[optionKey];
            input.classList.add("form-check-input");

            // Restore selected answers
            input.checked = selectedAnswers.includes(question[optionKey]);

            input.addEventListener("change", function () {
                updateUserResponse(question.id, question.multipleChoice, this.value, this.checked);
            });

            let label = document.createElement("label");
            label.classList.add("form-check-label");
            label.innerText = question[optionKey];

            optionDiv.appendChild(input);
            optionDiv.appendChild(label);
            div.appendChild(optionDiv);
        });

        reviewContainer.appendChild(div);
    });
});

// Function to update user responses in localStorage
function updateUserResponse(questionId, isMultipleChoice, value, isChecked) {
    let responses = JSON.parse(localStorage.getItem("userResponses") || "{}");

    if (isMultipleChoice) {
        if (!Array.isArray(responses[questionId])) {
            responses[questionId] = [];
        }
        if (isChecked) {
            if (!responses[questionId].includes(value)) {
                responses[questionId].push(value);
            }
        } else {
            responses[questionId] = responses[questionId].filter(ans => ans !== value);
        }
    } else {
        responses[questionId] = value;
    }

    localStorage.setItem("userResponses", JSON.stringify(responses));
}

// Function to go back to the quiz and restore the last viewed question
function backToQuiz() {

	const redirectIndex = localStorage.getItem("redirectToQuestion");
	    const savedQuestions = localStorage.getItem("quizQuestions");
		
		console.log(redirectIndex)

	    if (savedQuestions !== null && redirectIndex !== null && !isNaN(redirectIndex)) {
	        localStorage.setItem("currentQuestionIndex", redirectIndex);
	        window.location.href = "quiz.html";
	    } else {
	        alert("Unable to restore your previous quiz. Please restart.");
	    }
}

// Function to submit the quiz
function submitQuiz() {
    let userId = localStorage.getItem("userId") || "guest"; // Use a default value if userId is missing
    let responses = JSON.parse(localStorage.getItem("userResponses") || "{}");
	
		localStorage.removeItem("quizQuestions");
	    localStorage.removeItem("redirectToQuestion");
	    localStorage.removeItem("userResponses");
	    localStorage.removeItem("reviewQuestions");
	    localStorage.removeItem("currentQuestionIndex");
	    localStorage.setItem("testStarted", "false");

    console.log("Submitting responses:", responses);
	// Clear question set so next quiz is fresh
   localStorage.removeItem("questions");
   localStorage.setItem("testStarted", "false");

    fetch("/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId, responses: responses })
    })
    .then(response => response.text())
    .then(data => {
        console.log("Server Response:", data);
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
        console.error("Error submitting quiz:", error);
        Swal.fire({
            title: "Error!",
            text: "There was an issue submitting your quiz. Please try again.",
            icon: "error",
            confirmButtonText: "OK"
        });
    });
}
