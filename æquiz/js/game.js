const question = document.getElementById("question");
const choices = Array.from(document.getElementsByClassName("choice-text"));
const progressText = document.getElementById("progressText");
const scoreText = document.getElementById("score");
const progressBarFull = document.getElementById("progressBarFull");
const loader = document.getElementById("loader");
const game = document.getElementById("game");
let currentQuestion = {};
let acceptingAnswers = false;
let score = 0;
let questionCounter = 0;
let availableQuesions = [];
let questions = [];
let client = null, contractInstance = null;

let contractAddress="ct_2qkMkeUXGjCZE3g4JKZa7u1wFe2e79cpSJjy1aDMruKEZWAPqf";
let contractSource=`
contract AEQuiz =

  record question =
    { question : string,
      correct : string,
      incorrect : list(string) }
    
  record score =
    { username : string,
      score : int}

  record state =
    { questions : map(string, question),
      scores : map(address, (string * int)),
      admin : address }

  entrypoint init() = 
    { questions = {},
      scores = {},
      admin = ak_2aM22jLrxw8Kjmbpbc7pFukMfPj3uEuDqqu6iUE1um9MJWejNH }

  function checkQuestion(question: string) : bool =
    Map.member(question, state.questions)

  entrypoint admin() =
    require(state.admin == Call.caller, "Not Authorized")

  entrypoint getQuestions() =
    state.questions

  entrypoint getScores() =
    state.scores

  stateful entrypoint addScore(username : string, score : int) =
    let newScore = (username, score)

    put(state{scores[Call.caller] = newScore})

  stateful entrypoint addQuestion(question' : string, correct' : string, incorrect1 : string, incorrect2 : string,  incorrect3 : string) =
    admin()
    require(!checkQuestion(question'), "Question Already Exist")
    let newQuestion = {question = question', correct = correct', incorrect = [incorrect1, incorrect2, incorrect3]}

    put(state{questions[question'] = newQuestion})

  stateful entrypoint deleteQuestion(question' : string)=
    admin()
    require(checkQuestion(question'), "Question Not Found")
    let newQuestions = Map.delete(question', state.questions)

    put(state{questions = newQuestions})
`

window.addEventListener("load", async function () {
  client = await Ae.Aepp();
  contractInstance = await client.getContractInstance(contractSource,{contractAddress});

  contractInstance.methods.getQuestions().then(function(loadedQuestions){
    let allQuestions = loadedQuestions.decodedResult;
    questions = allQuestions.map(question => {
      const formattedQuestion = {
        question: question[1].question
      };
      const answerChoices = [...question[1].incorrect];
      formattedQuestion.answer = Math.floor(Math.random() * 3) + 1;
      answerChoices.splice(
        formattedQuestion.answer - 1,
        0,
        question[1].correct
      );
      answerChoices.forEach((choice, index) => {
        formattedQuestion["choice" + (index + 1)] = choice;
      });
      return formattedQuestion;
    });

    startGame();
  }).catch(function(error){
    console.error(error.decodedError)
    loader.classList.add("hidden");
  });
})

//CONSTANTS
const CORRECT_BONUS = 10;
const MAX_QUESTIONS = 3;

startGame = () => {
  questionCounter = 0;
  score = 0;
  availableQuesions = [...questions];
  getNewQuestion();
  game.classList.remove("hidden");
  loader.classList.add("hidden");
};

getNewQuestion = () => {
  if (availableQuesions.length === 0 || questionCounter >= MAX_QUESTIONS) {
    localStorage.setItem("mostRecentScore", score);
    //go to the end page
    return window.location.assign("end.html");
  }
  questionCounter++;
  progressText.innerText = `Question ${questionCounter}/${MAX_QUESTIONS}`;
  //Update the progress bar
  progressBarFull.style.width = `${(questionCounter / MAX_QUESTIONS) * 100}%`;

  const questionIndex = Math.floor(Math.random() * availableQuesions.length);
  currentQuestion = availableQuesions[questionIndex];
  question.innerHTML = currentQuestion.question;

  choices.forEach(choice => {
    const number = choice.dataset["number"];
    choice.innerHTML = currentQuestion["choice" + number];
  });

  availableQuesions.splice(questionIndex, 1);
  acceptingAnswers = true;
};

choices.forEach(choice => {
  choice.addEventListener("click", e => {
    if (!acceptingAnswers) return;

    acceptingAnswers = false;
    const selectedChoice = e.target;
    const selectedAnswer = selectedChoice.dataset["number"];

    const classToApply =
      selectedAnswer == currentQuestion.answer ? "correct" : "incorrect";

    if (classToApply === "correct") {
      incrementScore(CORRECT_BONUS);
    }

    selectedChoice.parentElement.classList.add(classToApply);

    setTimeout(() => {
      selectedChoice.parentElement.classList.remove(classToApply);
      getNewQuestion();
    }, 1000);
  });
});

incrementScore = num => {
  score += num;
  scoreText.innerText = score;
};
