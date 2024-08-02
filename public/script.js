// Global variables
let currentQuestion = 0;
let score = 0;
let timer;
let questions = [];
let gameTag = '';

// Category mapping according to how I've defined them in db.json vs opentdb.com
const categoryMapping = {
    1: 9,  // General Knowledge
    2: 17, // Science
    3: 23, // History
    4: 22, // Geography
    5: 11, // Entertainment
    6: 18  // Computers
};

// Initialize the game
function init() {
    const categorySelect = document.getElementById('category');
    
    // Populate category selection
    fetch('http://localhost:3000/categories')
        .then(response => response.json())
        .then(categories => {
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        });

    // Attach event listener to the game form
    const gameForm = document.getElementById('game-form');
    gameForm.addEventListener('submit', startGame);
}

// Start the game
function startGame(e) {
    e.preventDefault();
    const categorySelect = document.getElementById('category');
    const gameTagInput = document.getElementById('game-tag');
    
    const categoryId = categorySelect.value;
    gameTag = gameTagInput.value;
    
    if (!categoryId || !gameTag) {
        alert('Please select a category and enter a game tag');
        return;
    }

    fetchQuestions(categoryId);
}

// Fetch questions from Open Trivia DB
function fetchQuestions(categoryId) {
    const apiUrl = `https://opentdb.com/api.php?amount=10&category=${categoryMapping[categoryId]}&difficulty=easy&type=multiple`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            questions = data.results;
            startQuiz();
        })
        .catch(error => {
            console.error('Error fetching questions:', error);
            alert('Failed to fetch questions. Please try again.');
        });
}

// Start the quiz
function startQuiz() {
    currentQuestion = 0;
    score = 0;
    showQuestion();
    showScreen('question-screen');
}

// Show a question
function showQuestion() {
    const questionText = document.getElementById('question-text');
    const answerButtons = document.getElementById('answer-buttons');
    
    // Updating question number
    const questionNumber = document.getElementById('question-number')
    questionNumber.textContent = `Question ${currentQuestion + 1}`

    //Updating the question text and answers
    const question = questions[currentQuestion];
    questionText.textContent = question.question;
    questionText.classList.add('text-center')

    answerButtons.innerHTML = '';
    answerButtons.classList.add('flex', 'flex-col', 'items-center')
    const answers = [...question.incorrect_answers, question.correct_answer];
    shuffleArray(answers);

    answers.forEach(answer => {
        const button = document.createElement('button');
        button.textContent = answer;
        button.classList.add('answer-btn', 'py-2', 'px-4', 'rounded', 'transition', 'duration-300', 'ease-in-out', 'bg-gray-700', 'text-white', 'hover:bg-gray-600','hover:outline-slate-700', 'flex', 'flex-col', 'items-center',);
        button.addEventListener('click', () => selectAnswer(answer));
        answerButtons.appendChild(button);
    });

    startTimer();
}

// Timer function
function startTimer() {
    const timerElement = document.getElementById('timer');
    let time = 15;
    timerElement.textContent = `0:${time}`;
    timer = setInterval(() => {
        time--;
        timerElement.textContent = `0:${time}`;
        if (time <= 0) {
            clearInterval(timer);
            selectAnswer(null);
        }
    }, 1000);
}

// Select an answer
function selectAnswer(answer) {
    clearInterval(timer);
    const correct = questions[currentQuestion].correct_answer;
    if (answer === correct) {
        score++;
    }
    currentQuestion++;
    if (currentQuestion < questions.length) {
        showQuestion();
    } else {
        endQuiz();
    }
}

// End the quiz
function endQuiz() {
    const scoreDisplay = document.getElementById('score-display');
    scoreDisplay.textContent = `Your score: ${score} of ${questions.length}`;
    showScreen('result-screen');
    updateLeaderboard();

    // Attach event listeners for result screen buttons
    const viewLeaderboardBtn = document.getElementById('view-leaderboard');
    const playAgainBtn = document.getElementById('play-again');
    viewLeaderboardBtn.addEventListener('click', showLeaderboard);
    playAgainBtn.addEventListener('click', () => showScreen('welcome-screen'));
}

// Update leaderboard
function updateLeaderboard() {
    //Persisting a user's score to db.json
    fetch('http://localhost:3000/leaderboard', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ player: gameTag, score: score }),
    })
    .then(response => response.json())
    .then(() => {
        console.log('Leaderboard updated successfully')
        // After adding the new score, fetch the updated leaderboard
        // showLeaderboard();
    })
    .catch(error => {
        console.error('Error updating leaderboard:', error);
    });
}

// Show leaderboard
function showLeaderboard() {
    const leaderboardList = document.getElementById('leaderboard-list');
    const playAgainLeaderboardBtn = document.getElementById('play-again-leaderboard');
    
    fetch('http://localhost:3000/leaderboard')
        .then(response => response.json())
        .then(leaderboard => {
            // Sort the leaderboard by score in descending order
            leaderboard.sort((a, b) => b.score - a.score);

            // Take only the top 10 entries
            const top10 = leaderboard.slice(0, 10);

            leaderboardList.innerHTML = '';
            top10.forEach((entry, index) => {
                const li = document.createElement('li');
                li.textContent = `${index + 1}. ${entry.player}: ${entry.score}`;
                li.classList.add('py-2', 'px-8', 'border-2', 'border-slate-700', 'rounded-full');
                leaderboardList.appendChild(li);
            });
            showScreen('leaderboard-screen');
            
            // Attach event listener for play again button on leaderboard screen
            playAgainLeaderboardBtn.addEventListener('click', () => showScreen('welcome-screen'));
        });
}

// Utility function to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Utility function to show a screen
function showScreen(screenId) {
    const screens = ['welcome-screen', 'question-screen', 'result-screen', 'leaderboard-screen'];
    screens.forEach(id => {
        const screen = document.getElementById(id);
        screen.classList.toggle('hidden', id !== screenId);
    });
}

// Initialize the game when the script loads
init();