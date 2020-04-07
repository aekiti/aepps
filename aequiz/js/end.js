let loader = document.getElementById("loader");
let end = document.getElementById("end");
let scoreForm = document.getElementById("score-form");
let finalScore = document.getElementById("finalScore");
let mostRecentScore = localStorage.getItem("mostRecentScore");
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

  finalScore.innerText = mostRecentScore;
  
  end.classList.remove("hidden");
  loader.classList.add("hidden");
})

saveScore = e => {
  e.preventDefault();
  loader.classList.remove("hidden");

  let username = document.getElementById("username").value;

  if (username.trim()!="") {
    contractInstance.methods.addScore(username, mostRecentScore)
    .then(function() {
      loader.classList.add("hidden");
      scoreForm.reset();
      console.log(mostRecentScore + " added to blockchain for " + username);
      window.location.assign("index.html");
    })
    .catch(function(error) {
      loader.classList.add("hidden");
      console.error(error.decodedError)
    })
  } else {
    loader.classList.add("hidden");
    console.error("Please enter username");
  }
};
