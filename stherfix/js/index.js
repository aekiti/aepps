let client = null, contractInstance=null;
let contractAddress="ct_HhmJMpvGBnqUMLFDQnNpaztb6n5egkiUL7C24v9JhGqdhU4aB";

let contractSource=`
contract StherFix =
  record appointment =
    { id        : string,
      date      : string,
      services  : string }
    
  record user =
    { name        : string,
      mobile      : string,
      email       : string,
      userAddress : address }
      
  record state =
    { users             : map(address, user),
      appointments      : map(string, appointment),
      userappointments  : map(address, list(appointment)),
      admin : address }
      
  entrypoint init() =  
    { users = {},
      appointments = {},
      userappointments = {},
      admin = ak_ceUHAAtWZx8eZEVSXXPJTCsrv2BUwnDQi4ufyDKGBmgxkDcbR }

  entrypoint onlyAdmin() : bool =
    require(state.admin ==Call.caller, "You are not admin to access this page")
    true 

  stateful entrypoint makeProfile(name' : string, email' : string, mobile' : string) =
    let newUser = {name = name', email = email', mobile = mobile', userAddress = Call.caller}

    put(state{users[Call.caller] = newUser})
      
  stateful entrypoint bookAppointment(id' : string, date' : string, services': string)=
    require(state.users[Call.caller].userAddress == Call.caller, "Create a Profile first")
    let newAppointment = {id = id', date = date', services = services'}

    let userAppointmentList=Map.lookup_default(Call.caller,state.userappointments,[])
    let newUserAppointmentList=newAppointment::userAppointmentList

    put(state{ appointments[id'] = newAppointment, userappointments[Call.caller] = newUserAppointmentList })

  entrypoint getUser() : user =
   switch(Map.lookup(Call.caller, state.users))
      None    => abort("User not found")
      Some(x) => x 

  entrypoint getUserAppointments()=
   Map.lookup_default(Call.caller, state.userappointments,[]) 

  entrypoint getAllAppointment()=
   onlyAdmin()
   state.appointments 
`;

function appointmentsDom(id,date,services){
  let myAppointments=document.getElementById("my-appointment");
  myAppointments.classList.add("my-3");

  let card=document.createElement("div");
  card.classList.add("card");
  card.classList.add("my-2");

  let cardBody=document.createElement("div");
  cardBody.classList.add("card-body");

  let idText=document.createElement("h5");
  idText.innerHTML="Appointment Number: " + id;

  let appointmentText=document.createElement("p");
  appointmentText.innerHTML="<b>Date<b>: " + date + "<br><b>Services<b>: " + services;

  cardBody
  .appendChild(idText);
  cardBody
  .appendChild(appointmentText);
  
  card.appendChild(cardBody);
  myAppointments.appendChild(card);
}

function staticticsDom(address,date,services){
  let statictics=document.getElementById("admin-statictics");
  statictics.classList.add("my-3");

  let card=document.createElement("div");
  card.classList.add("card");
  card.classList.add("my-2");

  let cardBody=document.createElement("div");
  cardBody.classList.add("card-body");

  let addressText=document.createElement("h6");
  addressText.innerText=address;

  let appointmetText=document.createElement("p");
  appointmetText.innerHTML="Date: " + date + "<br>Services: " + services;

  cardBody
  .appendChild(addressText);
  cardBody
  .appendChild(appointmetText);
  cardBody
  
  card.appendChild(cardBody);
  statictics.appendChild(card);
}

window.addEventListener('load',async function(){
  client=await Ae.Aepp();
  contractInstance=await client.getContractInstance(contractSource,{contractAddress});

  contractInstance.methods.getUser().then(function name(user) {
    let userDetails=user.decodedResult;

    document.getElementById("account").innerHTML = "<div class='card border-info'><div class='card-body'><h6 class='card-title'>My Account</h6><p class='card-text'>" + userDetails.name + "<br>" + userDetails.email + "<br>" + userDetails.mobile + "</p></div></div>";
  }).catch(function() {
    document.getElementById("account").innerHTML = "<p><button type='button' class='my-btn' data-toggle='modal' data-target='#profile-model'>Add Profile</button></p>";
  });

  let userAppointments=(await contractInstance.methods.getUserAppointments()).decodedResult;
  document.getElementById("appointment-amount").innerHTML = "(" + userAppointments.length + ")";
  userAppointments.map(appointment=>{
    appointmentsDom(appointment.id,appointment.date,appointment.services)
  })

  contractInstance.methods.onlyAdmin().then(async function(result){
    let onlyAdmin=result.decodedResult;
    if (onlyAdmin == true) {
      let adminStaticstics=(await contractInstance.methods.getAllAppointment()).decodedResult;
      adminStaticstics.map(appointment=>{
        staticticsDom(appointment[0],appointment[1].date,appointment[1].services);
      });
    }
    $("#loader").hide();
  }).catch(function(){
    document.getElementById("admin-statictics").innerHTML = "<p class='text-danger'>Not Authorized to see content</p>";
    $("#loader").hide();
  });
});

async function makeProfile(event){
  event.preventDefault();
  $("#loader").show();

  let name=document.getElementById("name").value;
  let email=document.getElementById("email").value;
  let mobile=document.getElementById("mobile").value;

  if(name.trim()!=""&&email.trim()!=""&&mobile.trim()!=""){
    contractInstance.methods.makeProfile(name,email,mobile).then(function() {
      location.reload();
    })
  }

  $("#loader").hide();
}

document.getElementById("add-profile").addEventListener("click",makeProfile);

async function bookAppointment(event){
  event.preventDefault();
  $("#loader").show();

  let date=document.getElementById("date").value;
  let services=document.getElementById("services").value;
  let id='SID'+(Math.floor(Math.random() * 1001));

  if(date.trim()!="" &&services.trim()!=""){
    contractInstance.methods.bookAppointment(id,date,services)
    .catch(function(error){
      console.log("Error:", error)
      document.getElementById("error-message").innerHTML = "<div class='alert alert-warning'><strong>Error!</strong> <a data-toggle='modal' data-target='#profile-model' class='alert-link'>Create a profile</a> to add appointment.</div>";

      $("#loader").hide();
    })
    .then(function(){
      appointmentsDom(id,date,services)
    });
  }
}

document.getElementById("book-appointment").addEventListener("click",bookAppointment);