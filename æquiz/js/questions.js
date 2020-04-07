let loader = document.getElementById("loader");
let questions = document.getElementById("questions");
let pageError = document.getElementById("page-error");
let addForm = document.getElementById("add-form");
let deleteForm = document.getElementById("delete-form");
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

function questionDom(question) {
  let questionList = document.getElementById("select-question");

  let listOption = document.createElement("option");
  listOption.setAttribute('value', question);
  listOption.innerText = question;

  questionList.appendChild(listOption);
}

window.addEventListener("load", async function () {
  client = await Ae.Aepp();
  contractInstance = await client.getContractInstance(contractSource,{contractAddress});

  contractInstance.methods.admin().then(async function(){
    let allQuestions = (await contractInstance.methods.getQuestions()).decodedResult;
    allQuestions.map(question => {
      questionDom(question[0]);
    });

    questions.classList.remove("hidden");
    loader.classList.add("hidden");
  }).catch(function(){
    pageError.classList.remove("hidden");
    loader.classList.add("hidden");
  });
})

document.getElementById("add-question").addEventListener("click", async function(event) {
  event.preventDefault();
  loader.classList.remove("hidden");

  let question = document.getElementById("question").value;
  let correct = document.getElementById("correct").value;
  let incorrect1 = document.getElementById("incorrect1").value;
  let incorrect2 = document.getElementById("incorrect2").value;
  let incorrect3 = document.getElementById("incorrect3").value;
  
  if (question.trim()!=""&&correct.trim()!=""&&incorrect1.trim()!=""&&incorrect2.trim()!=""&&incorrect3.trim()!="") {
    contractInstance.methods.addQuestion(question, correct, incorrect1, incorrect2, incorrect3)
    .then(function() {
      loader.classList.add("hidden");
      questionDom(question);
      addForm.reset();
      console.log(question + " added to blockchain");
    })
    .catch(function(error) {
      loader.classList.add("hidden");
      console.error(error.decodedError)
    })
  } else {
    loader.classList.add("hidden");
    console.error("Please fill all fields");
  }
});

deleteQuestion = e => {
  e.preventDefault();
  loader.classList.remove("hidden");

  let selectQuestion = document.getElementById("select-question").value;
  
  if (selectQuestion.trim()!="none") {
    contractInstance.methods.deleteQuestion(selectQuestion)
    .then(function() {
      loader.classList.add("hidden");
      deleteForm.reset();
      console.log(selectQuestion + " deleted from blockchain");
    })
    .catch(function(error) {
      loader.classList.add("hidden");
      console.error(error.decodedError)
    })
  } else {
    loader.classList.add("hidden");
    console.error("Please Select Question");
  }
};
