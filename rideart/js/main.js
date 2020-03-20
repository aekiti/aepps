let client=null, contractInstance=null;
let contractAddress="ct_hMeniSFXDnR5Zf5tBewChE7A2oyXmXe4TLaWgsAj5UoG7Zfcn";

let contractSource=`
contract RideArt =
   
  record ride =
    { customersAddress : address,
      name             : string,
      email            : string, 
      mobile           : string,
      location         : string,
      destination      : string,
      rideid           : string }
      
  record state =
    { rides        : map(string, ride),
      userRides    : map(address, list(ride)),
      admin        : address }
      
  entrypoint init() =
    { rides = {},
      userRides = {},
      admin =ak_2YBb3u6Wjs8Gbb5pdDegYMUWhG1mneUK4yjL6ygjLh8hvZk83x }

  function requirement(exp : bool, err : string) =
    if(!exp)
     abort(err)

  entrypoint onlyAdmin() : bool =
    requirement(state.admin ==Call.caller, "You are not admin to access this page")
    true

  stateful entrypoint newRide(name' : string, email' : string, mobile' : string, location' : string, destination': string, rideid': string)=                                           
    let ride = { customersAddress = Call.caller, name = name', email = email', mobile = mobile', location = location', destination = destination', rideid = rideid'}

    let userRideList=Map.lookup_default(Call.caller,state.userRides,[])
    let newUserRideList=ride::userRideList

    put(state{ rides[rideid'] = ride, userRides[Call.caller] = newUserRideList })

  entrypoint getUserRides()=
   Map.lookup_default(Call.caller, state.userRides,[])

  entrypoint getRide(rideid : string) : ride =
    switch(Map.lookup(rideid, state.rides))
      None    => abort("There was no ride registered with this id.")
      Some(x) => x

  entrypoint getRides()=
   onlyAdmin()
   state.rides
`;

function myRideDom(name,email,mobile,location,destination,rideid){
  let myRides=document.getElementById("my-ride-dom");

  let card=document.createElement("div");
  card.classList.add("card");
  card.classList.add("my-2");

  let cardBody=document.createElement("div");
  cardBody.classList.add("card-body");

  let rideIdText=document.createElement("h5");
  rideIdText.innerHTML="<b>Ride Id<b>: " + rideid;

  let nameText=document.createElement("p");
  nameText.innerHTML="<b>Name<b>: " + name;

  let emailText=document.createElement("p");
  emailText.innerHTML="<b>Email<b>: " + email;

  let mobileText=document.createElement("p");
  mobileText.innerHTML="<b>Mobile<b>: " + mobile;

  let locationText=document.createElement("p");
  locationText.innerHTML="<b>Location<b>: " + location;

  let destinationText=document.createElement("p");
  destinationText.innerHTML="<b>Destination<b>: " + destination;

  cardBody
  .appendChild(rideIdText);
  cardBody
  .appendChild(nameText);
  cardBody
  .appendChild(emailText);
  cardBody
  .appendChild(mobileText);
  cardBody
  .appendChild(locationText);
  cardBody
  .appendChild(destinationText);
  
  card.appendChild(cardBody);
  myRides.appendChild(card);
}

function ridesDom(customersAddress,location,destination){
  let allRides=document.getElementById("rides-dom");

  let card=document.createElement("div");
  card.classList.add("card");
  card.classList.add("my-2");

  let cardBody=document.createElement("div");
  cardBody.classList.add("card-body");

  let userText=document.createElement("p");
  userText.innerHTML="<b>User<b>: " + customersAddress;

  let locationText=document.createElement("p");
  locationText.innerHTML="<b>Location<b>: " + location;

  let destinationText=document.createElement("p");
  destinationText.innerHTML="<b>Destination<b>: " + destination;

  cardBody
  .appendChild(userText);
  cardBody
  .appendChild(locationText);
  cardBody
  .appendChild(destinationText);
  
  card.appendChild(cardBody);
  allRides.appendChild(card);
}

window.addEventListener('load',async function(){
  client=await Ae.Aepp();
  contractInstance=await client.getContractInstance(contractSource,{contractAddress});

  let myRides=(await contractInstance.methods.getUserRides()).decodedResult;
  myRides.map(ride=>{ 
    myRideDom(ride.name,ride.email,ride.mobile,ride.location,ride.destination,ride.rideid);
  });

  contractInstance.methods.onlyAdmin().then(async function(result){
    let onlyAdmin=result.decodedResult;
    if (onlyAdmin == true) {
      let allRides=(await contractInstance.methods.getRides()).decodedResult;
      allRides.map(ride=>{
        ridesDom(ride[1].customersAddress,ride[1].location,ride[1].destination);
      });
    }
    $("#loader").hide();
  }).catch(function(){
    document.getElementById("rides-dom").innerHTML = "<p class='text-danger'>Not Authorized</p>";
    $("#loader").hide();
  });
  
});

async function newRide(event){
  event.preventDefault();
  $("#loader").show();

  let name=document.getElementById("name").value;
  let email=document.getElementById("email").value;
  let mobile=document.getElementById("mobile").value;
  let location=document.getElementById("location").value;
  let destination=document.getElementById("destination").value;
  let rideid='RA'+(Math.floor(Math.random() * 1001));

  if(name.trim()!=""&&email.trim()!=""&&mobile.trim()!=""&&location.trim()!=""&&destination.trim()!=""){
    await contractInstance.methods.newRide(name,email,mobile,location,destination,rideid)
    myRideDom(name,email,mobile,location,destination,rideid)
  }
  document.getElementById("ride-form").reset();
  $("#request-ride").modal("hide");
  $("#loader").hide();
}

document.getElementById("submit-ride").addEventListener("click",newRide);

async function searchRide(event){
  event.preventDefault();
  $("#loader").show();

  let rideid=document.getElementById("ride-id").value;

  if(rideid.trim()!=""){
    contractInstance.methods.getRide(rideid).then(function name(ride) {
      let searchedRide=ride.decodedResult;
      document.getElementById("search-head").innerHTML = "<b>Ride</b>: " + searchedRide.rideid;


      document.getElementById("search-body").innerHTML = "<ul><li><b>Name<b>: " + searchedRide.name + "</li><li><b>Email<b>: " + searchedRide.email + "</li><li><b>Location<b>: "+ searchedRide.location +"</li><li><b>Destination<b>: "+ searchedRide.destination +"</li></ul>";

      document.getElementById("search-form").reset();
      $("#loader").hide();
      $("#search-modal").modal("show");
    }).catch(function() {
      document.getElementById("search-head").innerText = "Not Found";
      
      document.getElementById("search-body").innerHTML = "<p class='text-warning'>Ride with id " + rideid +" Not Found</p>";

      document.getElementById("search-form").reset();
      $("#loader").hide();$("#loader").hide();
      $("#search-modal").modal("show");
    });
  }
}

document.getElementById("search-ride").addEventListener("click",searchRide);