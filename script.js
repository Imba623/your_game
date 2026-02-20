// Игроки
let players = [];

// Назначенные клавиши для игроков
const playerKeys = ['a', 'l', ' ']; // пробел обозначается как ' '

// Вопросы по категориям
const questionsData = {
    'Разное': [
        { value: 100, question: 'Сколько месяцев в году имеют 28 дней?', answer: '12' },
        { value: 200, question: 'Что можно приготовить, но нельзя съесть?', answer: 'уроки' },
        { value: 300, question: 'Что становится больше, если его поставить вверх ногами?', answer: 'число 6' },
        { value: 400, question: 'Что принадлежит вам, но другие пользуются им чаще?', answer: 'имя' },
        { value: 500, question: 'Какой рукой лучше размешивать чай?', answer: 'ложкой' }
    ],
    'География': [
        { value: 100, question: 'Самая длинная река в мире?', answer: 'Нил' },
        { value: 200, question: 'Самый маленький материк?', answer: 'Австралия' },
        { value: 300, question: 'Столица Франции?', answer: 'Париж' },
        { value: 400, question: 'Самое глубокое озеро в мире?', answer: 'Байкал' },
        { value: 500, question: 'Самая высокая гора в мире?', answer: 'Эверест' }
    ],
    'Наука': [
        { value: 100, question: 'Сколько планет в солнечной системе?', answer: '8' },
        { value: 200, question: 'Какая наука изучает звезды?', answer: 'астрономия' },
        { value: 300, question: 'Из чего состоит вода?', answer: 'водород и кислород' },
        { value: 400, question: 'Самый твердый минерал?', answer: 'алмаз' },
        { value: 500, question: 'Кто изобрел телефон?', answer: 'Белл' }
    ]
};

let answeredQuestions = new Set(); // Отвеченные вопросы
let currentQuestion = null; // Текущий выбранный вопрос
let gameOver = false;
let timerInterval = null;
let timeLeft = 30;
let waitingForAnswer = false; // Ожидание нажатия клавиши
let answeringPlayer = null; // Игрок, который захватил право ответа

// Функция обновления отображения игроков
function updatePlayersDisplay() {
    const playersDiv = document.getElementById('players');
    playersDiv.innerHTML = '';
    
    players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        let playerClass = 'player';
        if (player.isActive) playerClass += ' active';
        if (answeringPlayer && answeringPlayer.id === player.id) playerClass += ' answering';
        playerDiv.className = playerClass;
        
        const keyNames = ['A', 'L', 'Пробел'];
        playerDiv.innerHTML = `
            <h3>${player.name}</h3>
            <div class="score">💰 ${player.score}</div>
            <div class="player-key">🔑 ${keyNames[index]}</div>
        `;
        playersDiv.appendChild(playerDiv);
    });
}

// Функция обновления отображения вопросов
function updateQuestionsDisplay() {
    const categoriesDiv = document.getElementById('categories');
    categoriesDiv.innerHTML = '';

    Object.entries(questionsData).forEach(([category, questions]) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'category-row';
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'category-title';
        titleDiv.textContent = category;
        rowDiv.appendChild(titleDiv);

        const questionsDiv = document.createElement('div');
        questionsDiv.className = 'questions';

        questions.forEach(q => {
            const btn = document.createElement('button');
            btn.className = `question-btn ${answeredQuestions.has(q.question) ? 'answered' : ''}`;
            btn.textContent = q.value;
            btn.onclick = () => selectQuestion(category, q);
            btn.disabled = answeredQuestions.has(q.question) || gameOver || waitingForAnswer;
            questionsDiv.appendChild(btn);
        });

        rowDiv.appendChild(questionsDiv);
        categoriesDiv.appendChild(rowDiv);
    });
}

// Функция запуска таймера
function startTimer() {
    timeLeft = 30;
    const timerDiv = document.getElementById('timer');
    timerDiv.style.display = 'block';
    timerDiv.textContent = `⏱️ Осталось: ${timeLeft} сек.`;
    
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDiv.textContent = `⏱️ Осталось: ${timeLeft} сек.`;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerDiv.style.display = 'none';
            
            if (waitingForAnswer) {
                // Никто не нажал клавишу
                waitingForAnswer = false;
                document.getElementById('waitingMessage').style.display = 'none';
                alert('⏰ Время вышло! Никто не успел захватить вопрос.');
                
                // Помечаем вопрос как отвеченный (никто не получил очки)
                answeredQuestions.add(currentQuestion.question);
                currentQuestion = null;
                
                // Обновляем отображение
                updateQuestionsDisplay();
                
                // Переходим к следующему игроку для выбора вопроса
                nextTurn();
            }
        }
    }, 1000);
}

// Функция выбора вопроса
function selectQuestion(category, question) {
    if (answeredQuestions.has(question.question) || gameOver || waitingForAnswer) return;
    
    currentQuestion = { category, ...question };
    answeringPlayer = null;
    waitingForAnswer = true;
    
    // Показываем вопрос и сообщение об ожидании
    document.getElementById('currentQuestion').innerHTML = 
        `<strong>${category} - ${question.value}:</strong> ${question.question}`;
    
    document.getElementById('waitingMessage').style.display = 'block';
    document.getElementById('currentAnswerer').style.display = 'none';
    
    // Отключаем ввод ответа
    document.getElementById('answerInput').disabled = true;
    document.getElementById('checkAnswerBtn').disabled = true;
    
    // Запускаем таймер
    startTimer();
    
    // Обновляем отображение вопросов (блокируем кнопки)
    updateQuestionsDisplay();
    
    // Фокус на окно для захвата клавиш
    window.focus();
}

// Функция захвата вопроса игроком
function captureQuestion(playerIndex) {
    if (!waitingForAnswer || answeringPlayer) return; // Если не ждем ответ или уже кто-то захватил
    
    clearInterval(timerInterval);
    document.getElementById('timer').style.display = 'none';
    
    answeringPlayer = players[playerIndex];
    waitingForAnswer = false;
    
    // Показываем, кто будет отвечать
    document.getElementById('waitingMessage').style.display = 'none';
    const answererDiv = document.getElementById('currentAnswerer');
    answererDiv.style.display = 'block';
    answererDiv.textContent = `🎤 Отвечает: ${answeringPlayer.name}`;
    
    // Активируем поле для ответа
    document.getElementById('answerInput').disabled = false;
    document.getElementById('checkAnswerBtn').disabled = false;
    document.getElementById('answerInput').focus();
    
    // Подсвечиваем отвечающего игрока
    updatePlayersDisplay();
}

// Функция проверки ответа
function checkAnswer() {
    if (!currentQuestion || gameOver || !answeringPlayer) return;

    const answerInput = document.getElementById('answerInput');
    const userAnswer = answerInput.value.trim().toLowerCase();
    
    if (!userAnswer) {
        alert('Введите ответ!');
        return;
    }

    const correctAnswer = currentQuestion.answer.toLowerCase();
    const isCorrect = userAnswer === correctAnswer;
    
    if (isCorrect) {
        answeringPlayer.score += currentQuestion.value;
        alert(`✅ Правильно! +${currentQuestion.value} очков для ${answeringPlayer.name}`);
    } else {
        alert(`❌ Неправильно! Правильный ответ: ${currentQuestion.answer}`);
    }

    // Помечаем вопрос как отвеченный
    answeredQuestions.add(currentQuestion.question);
    
    // Очищаем поле ввода
    answerInput.value = '';
    answerInput.disabled = true;
    document.getElementById('checkAnswerBtn').disabled = true;
    document.getElementById('currentAnswerer').style.display = 'none';
    
    // Сбрасываем отвечающего
    answeringPlayer = null;
    
    // Обновляем отображение
    updatePlayersDisplay();
    updateQuestionsDisplay();
    
    // Проверяем, не закончилась ли игра
    checkGameOver();
    
    // Если игра не закончена, переходим к следующему игроку для выбора вопроса
    if (!gameOver) {
        nextTurn();
    }
    
    currentQuestion = null;
    document.getElementById('currentQuestion').innerHTML = 'Выберите следующий вопрос';
}

// Функция перехода к следующему игроку (для выбора вопроса)
function nextTurn() {
    const currentIndex = players.findIndex(p => p.isActive);
    players[currentIndex].isActive = false;
    
    const nextIndex = (currentIndex + 1) % players.length;
    players[nextIndex].isActive = true;
    
    updatePlayersDisplay();
    
    // Активируем кнопку следующего хода только если не ждем ответ
    document.getElementById('nextTurnBtn').disabled = waitingForAnswer;
}

// Функция проверки окончания игры
function checkGameOver() {
    const totalQuestions = Object.values(questionsData)
        .reduce((sum, questions) => sum + questions.length, 0);
    
    if (answeredQuestions.size === totalQuestions) {
        gameOver = true;
        
        // Находим победителя
        const winner = players.reduce((max, player) => 
            player.score > max.score ? player : max
        );
        
        alert(`🎉 Игра окончена! Победитель: ${winner.name} с ${winner.score} очками!`);
        
        // Подсвечиваем победителя
        players.forEach(p => p.isActive = false);
        updatePlayersDisplay();
    }
}

// Функция сброса игры
function resetGame() {
    // Показываем экран настройки
    document.getElementById('setupScreen').style.display = 'block';
    document.getElementById('gameScreen').style.display = 'none';
    
    // Очищаем таймер
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Сбрасываем переменные
    answeredQuestions.clear();
    currentQuestion = null;
    gameOver = false;
    waitingForAnswer = false;
    answeringPlayer = null;
}

// Функция начала игры
function startGame() {
    // Получаем имена игроков
    const player1Name = document.getElementById('player1Name').value || 'Игрок 1';
    const player2Name = document.getElementById('player2Name').value || 'Игрок 2';
    const player3Name = document.getElementById('player3Name').value || 'Игрок 3';
    
    // Инициализируем игроков
    players = [
        { id: 1, name: player1Name, score: 0, isActive: true },
        { id: 2, name: player2Name, score: 0, isActive: false },
        { id: 3, name: player3Name, score: 0, isActive: false }
    ];
    
    // Сбрасываем состояние игры
    answeredQuestions.clear();
    currentQuestion = null;
    gameOver = false;
    waitingForAnswer = false;
    answeringPlayer = null;
    
    // Переключаем экраны
    document.getElementById('setupScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    
    // Обновляем отображение
    updatePlayersDisplay();
    updateQuestionsDisplay();
    
    // Сбрасываем элементы управления
    document.getElementById('answerInput').value = '';
    document.getElementById('answerInput').disabled = true;
    document.getElementById('checkAnswerBtn').disabled = true;
    document.getElementById('nextTurnBtn').disabled = false;
    document.getElementById('currentQuestion').innerHTML = 'Выберите вопрос, чтобы начать игру';
    document.getElementById('timer').style.display = 'none';
    document.getElementById('waitingMessage').style.display = 'none';
    document.getElementById('currentAnswerer').style.display = 'none';
}

// Обработчик нажатия клавиш
document.addEventListener('keydown', (event) => {
    // Игнорируем, если игра не активна
    if (document.getElementById('gameScreen').style.display !== 'block') return;
    
    // Игнорируем, если ввод в поле ответа
    if (event.target.tagName === 'INPUT') return;
    
    const key = event.key.toLowerCase();
    
    // Определяем, какой игрок нажал клавишу
    let playerIndex = -1;
    if (key === 'a') playerIndex = 0;
    else if (key === 'l') playerIndex = 1;
    else if (key === ' ') playerIndex = 2;
    
    if (playerIndex !== -1) {
        event.preventDefault(); // Предотвращаем действия по умолчанию (например, скролл на пробел)
        captureQuestion(playerIndex);
    }
});

// Инициализация обработчиков событий
document.getElementById('startGameBtn').onclick = startGame;
document.getElementById('checkAnswerBtn').onclick = checkAnswer;
document.getElementById('nextTurnBtn').onclick = nextTurn;
document.getElementById('resetGameBtn').onclick = resetGame;

// Начальное состояние
document.getElementById('setupScreen').style.display = 'block';
document.getElementById('gameScreen').style.display = 'none';