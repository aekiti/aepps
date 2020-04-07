let loader = document.getElementById("loader");
const scoreboard = document.getElementById("scoreboard");
const scoreList = document.getElementById("score-list");
let client = null, contractInstance = null;

let contractAddress="ct_zWHcgTtbyWNNW8hMxRAmnzcPF94NeuZfvvS77vVMJU44CMNwP";
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
      admin = ak_22y96g8SUGgmDRVvaWdNsq4hW82pKXWptoxSQroNR3AWZdtZvT }

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

  contractInstance.methods.getScores().then(function(scores){
    let allScores = scores.decodedResult;
    scoreList.innerHTML = allScores.map(score => {
      return `<li class="high-score">${score[1][0]} - ${score[1][1]}</li>`;
    });

    scoreboard.classList.remove("hidden");
    loader.classList.add("hidden");
  }).catch(function(error){
    console.error(error.decodedError)
    loader.classList.add("hidden");
  });
})
