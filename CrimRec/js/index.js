let contractInstance = null, client = null;

let contractAddress="ct_A4VGV4k76yxqQmyNv2FDK94avqBRMoUSB8G4qaK1wQSkxp4oZ";
let contractSource=`
contract CriminalRecord =
  record offense = 
    { date: int,
      name: string,
      code: string,
      penalty: string }

  record criminal =
    { name: string,  
      dob: string,
      pob: string,
      offenses: list(offense),
      code: string,
      date : int }

  record state = {criminals: map(string, criminal)}

  stateful entrypoint init() = {criminals = {}}

  entrypoint getCriminals() =
    state.criminals

  entrypoint getCriminalOffense(criminalCode : string) =
    require(checkCriminal(criminalCode), "Criminal Not Found")
    state.criminals[criminalCode].offenses

  function checkCriminal(criminalCode : string) : bool =
    Map.member(criminalCode, state.criminals) 

  stateful entrypoint registerCriminal(name' : string, dob' : string, pob' : string, code' : string) =
    require(!checkCriminal(code'), "Criminal Already Exist")
    let newCriminal={name = name', dob = dob', pob = pob', offenses = [], code = code', date = Chain.timestamp}
    
    put(state{criminals[code'] = newCriminal})

  stateful entrypoint registerOffense(criminalCode : string, name' : string, code' : string, penalty' : string) =
    require(checkCriminal(criminalCode), "Criminal Not Found")
    let newOffense = {date = Chain.timestamp, name = name', code = code', penalty = penalty'}

    let criminal = state.criminals[criminalCode]
    let offenseList = criminal.offenses
    let newOffenseList = newOffense::offenseList
    let updatedList = state.criminals{ [criminalCode].offenses = newOffenseList }
    
    put(state{criminals = updatedList})
`

function selectDom(name, code) {
  let criminalList = document.getElementById("select-criminal");

  let listOption = document.createElement("option");
  listOption.setAttribute('value', code);
  listOption.innerHTML = name + ' - ' + code;

  criminalList.appendChild(listOption)
}

function criminalWithOffence(cName, cCode, cDob, cPob, oDate, oName, oCode, oPenalty){
  let allCriminals = document.getElementById("criminal-list");

  let cardDiv = document.createElement("div");
  cardDiv.classList.add("card");
  cardDiv.classList.add("criminal");
  let cardBody = document.createElement("div");
  cardBody.classList.add("card-body");

  let criminalHeader = document.createElement("h5");
  criminalHeader.classList.add("text-center");
  criminalHeader.innerHTML = cName + " - " + cCode;

  let criminalBody = document.createElement("p");
  criminalBody.innerHTML = "<b>Criminal Details</b><br><b>Date Of Birth</b>: " + cDob + "<br><b>Place Of Birth</b>: " + cPob;

  let criminalOffense = document.createElement("div");
  criminalOffense.classList.add("table-responsive");

  let offenseHead = document.createElement("h6");
  offenseHead.innerHTML = "<b>Offense</b>";

  let offenseTable = document.createElement("table");
  offenseTable.classList.add("table");
  offenseTable.classList.add("table-bordered");

  let tableHead = document.createElement("thead");
  tableHead.innerHTML = "<tr><th>Date</th><th>Name</th><th>Code</th><th>Penalty</th></tr>";

  let tableBody = document.createElement("tbody");
  let bodyTr = document.createElement("tr");

  let offenseDate = document.createElement("td");
  offenseDate.innerText = new Date(oDate).toDateString();
  let offenseName = document.createElement("td");
  offenseName.innerText = oName;
  let offenseCode = document.createElement("td");
  offenseCode.innerText = oCode;
  let offensePenalty = document.createElement("td");
  offensePenalty.innerText = oPenalty;

  bodyTr.appendChild(offenseDate);
  bodyTr.appendChild(offenseName);
  bodyTr.appendChild(offenseCode);
  bodyTr.appendChild(offensePenalty);

  tableBody.appendChild(bodyTr);

  offenseTable.appendChild(tableHead);
  offenseTable.appendChild(tableBody);

  criminalOffense.appendChild(offenseHead);
  criminalOffense.appendChild(offenseTable);

  cardBody.appendChild(criminalHeader);
  cardBody.appendChild(criminalBody);
  cardBody.appendChild(criminalOffense);

  cardDiv.appendChild(cardBody);
  allCriminals.appendChild(cardDiv);
}

function criminalWithoutOffence(cName, cCode, cDob, cPob){
  let allCriminals = document.getElementById("criminal-list");

  let cardDiv = document.createElement("div");
  cardDiv.classList.add("card");
  cardDiv.classList.add("criminal");
  let cardBody = document.createElement("div");
  cardBody.classList.add("card-body");

  let criminalHeader = document.createElement("h5");
  criminalHeader.classList.add("text-center");
  criminalHeader.innerHTML = cName + " - " + cCode;

  let criminalBody = document.createElement("p");
  criminalBody.innerHTML = "<b>Criminal Details</b><br><b>Date Of Birth</b>: " + cDob + "<br><b>Place Of Birth</b>: " + cPob;
  
  cardBody.appendChild(criminalHeader);
  cardBody.appendChild(criminalBody);

  cardDiv.appendChild(cardBody);
  allCriminals.appendChild(cardDiv);
}

window.addEventListener('load', async function(){
  client = await Ae.Aepp();
  contractInstance = await client.getContractInstance(contractSource,{contractAddress});

  let allCriminals = (await contractInstance.methods.getCriminals()).decodedResult;
  allCriminals.map(criminal => {
    selectDom(criminal[1].name, criminal[1].code)
    if (criminal[1]["offenses"].length > 0) {
      criminal[1]["offenses"].map((criminalO)=>{
        criminalWithOffence(criminal[1].name, criminal[1].code, criminal[1].dob, criminal[1].pob, criminalO.date, criminalO.name, criminalO.code, criminalO.penalty);
      });
   } else {
      criminalWithoutOffence(criminal[1].name, criminal[1].code, criminal[1].dob, criminal[1].pob);
    }
  });
  document.getElementById("loader").style.display = "none";
});

async function handleRegisterCriminal(e){
  e.preventDefault();

  let name = document.getElementById("input-name").value;
  let dob = document.getElementById("input-dob").value;
  let pob = document.getElementById("input-pob").value;
  let code = "CRC" + (Math.floor(Math.random() * 10001));
  
  document.getElementById("loader").style.display="block";
  contractInstance.methods.registerCriminal(name, dob, pob, code)
  .then(function() {
    document.getElementById("loader").style.display = "none";
    window.location.reload();
  })
  .catch(function(error) {
    document.getElementById("loader").style.display = "none";
    console.error(error.decodedError);
  });
}
document.getElementById("reg-criminal").addEventListener("click", handleRegisterCriminal);

async function handleRegisterOffense(e){
  e.preventDefault();

  let cCode = document.getElementById("select-criminal").value;
  let oName = document.getElementById("crime-name").value;
  let oCode = document.getElementById("crime-code").value;
  let oPenalty = document.getElementById("crime-penalty").value;
  
  $("#add-offense").modal("hide");
  document.getElementById("loader").style.display = "block";
  contractInstance.methods.registerOffense(cCode, oName, oCode, oPenalty)
  .then(function() {
    document.getElementById("loader").style.display = "none";
    window.location.reload();
  })
  .catch(function(error) {
    document.getElementById("loader").style.display = "none";
    console.error(error.decodedError);
  });
}
document.getElementById("reg-offense").addEventListener("click", handleRegisterOffense);

