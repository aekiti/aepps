let ipfs =null, client = null, contractInstance = null, hostelImage = null;
let contractAddress ="ct_2LfMeRkAqYq2s1v3M2u6rT1K2im786aZYfe8SUuu5H33QCXHNC";

let contractSource =`
payable contract GeoHostel =

  record hostel = {
    name        : string,
    image       : string,
    location    : string,
    facilities  : string,
    price       : int,
    status      : bool,
    contact     : address }

  record tran = {
    id      : int,
    name    : string,
    contact : address,
    reserver: address }

  record state = {
    hostels: map(string, hostel),
    contactHostels: map(address, list(hostel)),
    reserverHostels: map(address, list(tran)),
    trans: map(int, tran) }

  entrypoint init() = {
    hostels = {},
    contactHostels = {},
    reserverHostels = {},
    trans = {} }

  entrypoint getHostels() =
    state.hostels

  entrypoint getTrans() =
    state.trans

  entrypoint contactHostels() =
    Map.lookup_default(Call.caller, state.contactHostels, [])

  entrypoint reserverHostels() =
    Map.lookup_default(Call.caller, state.reserverHostels, [])

  function checkHostel(hostelName : string) : bool =
    switch(Map.lookup(hostelName, state.hostels))
      None    => true
      Some(x) => false

  stateful entrypoint addHostel(name':string, image':string, location':string, facilities':string, price':int) =
    require(checkHostel(name') == true, "Hostel Already Exist")
    let newHostel ={name = name', image = image', location = location', facilities = facilities', price = price', status = false, contact = Call.caller}
    
    let newList = newHostel::contactHostels()
    
    put(state{hostels[name'] = newHostel, contactHostels[Call.caller] = newList})

  payable stateful entrypoint reserveHostel(hostelName : string) =
    require(checkHostel(hostelName) == false, "Hostel not found")
    let hostel =state.hostels[hostelName]
    require(hostel.status == false, "Hostel has been reserved")

    Chain.spend(hostel.contact, Call.value)

    let newTran = {id = Chain.timestamp, name = hostel.name, contact = hostel.contact, reserver = Call.caller}
    let newTranList = newTran::reserverHostels()

    let updatedStatus = state.hostels{ [hostelName].status = true }
    
    put(state{ hostels = updatedStatus, trans[Chain.timestamp] = newTran, reserverHostels[Call.caller] = newTranList })
`;

function hostelDom(name,image,location,facilities,price,status){
  let allHostel = document.getElementById("hostels-list");
  let hostelCard = document.createElement("div");
  hostelCard.classList.add("card");

  let hostelImage = document.createElement("img");
  hostelImage.classList.add("card-img-top");
  hostelImage.src = image;
  hostelImage.alt = name;

  let cardOverlay = document.createElement("div");
  cardOverlay.classList.add("card-img-overlay");
  
  let hostelName = document.createElement("h3");
  hostelName.classList.add("card-title");
  hostelName.classList.add("text-white");
  hostelName.innerText = name;

  let hostelLocation = document.createElement("p");
  hostelLocation.classList.add("text-white");
  hostelLocation.innerHTML = "<b>Location</b>: " + location;
  
  let hostelFacilities = document.createElement("p");
  hostelFacilities.classList.add("text-white");
  hostelFacilities.innerHTML = "<b>Facilities</b>: " + facilities;
  
  let hostelPrice = document.createElement("p");
  hostelPrice.classList.add("text-white");
  hostelPrice.innerHTML = "<b>Price</b>: " + price + " æ";
  
  let hostelStatus = document.createElement("div");
  hostelStatus.classList.add("mt-2");
  if (status == false) {
    hostelStatus.innerHTML = "<form><input type='hidden' id='hostel-name' value='" + name + "'><input type='hidden' id='hostel-price' value='" + price + "'><input type='submit' id='reserve-hostel' class='btn primary-btn' value='Reserve Hostel'></form>";
  } else {
    hostelStatus.innerHTML = "<p class='text-warning'>Hostel Already Reserved</p>";
  }
  
  cardOverlay.appendChild(hostelName);
  cardOverlay.appendChild(hostelLocation);
  cardOverlay.appendChild(hostelFacilities);
  cardOverlay.appendChild(hostelPrice);
  cardOverlay.appendChild(hostelStatus);

  hostelCard.appendChild(hostelImage);
  hostelCard.appendChild(cardOverlay);
  
  allHostel.appendChild(hostelCard);

  document.getElementById("reserve-hostel").addEventListener("click", handleReserveHostel);
}

function contactDom(name,location,price){
  let contactHostel = document.getElementById("contact-hostels");
  let contactDiv = document.createElement("div");
  contactDiv.classList.add("text-left");
  
  let contactName = document.createElement("h3");
  contactName.innerText = name;
  
  let contactDesctiption = document.createElement("p");
  contactDesctiption.innerHTML = "<b>Location</b>: " + location + "<br><b>Price</b>: " + price + " æ";
  
  contactDiv.appendChild(contactName);
  contactDiv.appendChild(contactDesctiption);
  
  contactHostel.appendChild(contactDiv);
}

function reserveDom(name,contact){
  let reserveHostel = document.getElementById("reserve-hostels");
  let reserveDiv = document.createElement("div");
  reserveDiv.classList.add("text-left");
  
  let reserveName = document.createElement("h3");
  reserveName.innerText = name;
  
  let reserveContact = document.createElement("p");
  reserveContact.innerHTML = "<b>Contact</b>: " + contact;
  
  reserveDiv.appendChild(reserveName);
  reserveDiv.appendChild(reserveContact);
  
  reserveHostel.appendChild(reserveDiv);
}

window.addEventListener('load', async function(){
  ipfs = await new IPFS({host:'ipfs.infura.io',port:5001,protocol:'https'});
  client = await Ae.Aepp();
  contractInstance = await client.getContractInstance(contractSource,{contractAddress});

  let allHostel = (await contractInstance.methods.getHostels()).decodedResult;
  allHostel.map(hostel=>{
    axios.get(`https://ipfs.io/ipfs/${hostel[1].image}`)
    .then(function(result){
      hostelDom(hostel[1].name, result.data, hostel[1].location, hostel[1].facilities, hostel[1].price, hostel[1].status)
    })
    .catch(function(error){
      console.error(error)
    });
  });

  let contactHostel = (await contractInstance.methods.contactHostels()).decodedResult;
  contactHostel.map(contact=>{
    contactDom(contact.name,contact.location,contact.price);
  });

  let reserveHostel = (await contractInstance.methods.reserverHostels()).decodedResult;
  reserveHostel.map(reserve=>{
    reserveDom(reserve.name,reserve.contact);
  });

  $("#loader").hide();
})

document.getElementById("select-image").addEventListener("change",function(event){
  hostelImage=event.currentTarget.files[0];
})

async function handleAddHostel(event) {
  event.preventDefault();
  $("#loader").show();
  
  let name = document.getElementById("name").value;
  let location = document.getElementById("location").value;
  let price = document.getElementById("price").value;
  let facilities = document.getElementById("facilities").value;
  let newStatus = false;

  if(name.trim() != ""&&location.trim() != ""&& facilities.trim() != ""&& price.trim() !=""){
    let reader=new FileReader();
    reader.onloadend= async function(){
      ipfs.add(reader.result, async function(err,res){
        if(err){
          return;
        }
        axios.get(`https://ipfs.io/ipfs/${res}`).then(async function(result){
          await contractInstance.methods.addHostel(name,res,location,facilities,price);
          hostelDom(name, result.data, location, facilities, price, newStatus)
          document.getElementById("hostel-form").reset();
          $("#hostel-modal").modal("hide");
          $("#loader").hide();
        }).catch(function(error){
          $("#loader").hide();
          console.error(error);
        })
      })
    }

    reader.readAsDataURL(hostelImage);
  }
}

document.getElementById("add-hostel").addEventListener("click", handleAddHostel);

async function handleReserveHostel(event) {
  event.preventDefault();
  $("#loader").show();

  let hostelName = document.getElementById("hostel-name").value;
  let hostelPrice = document.getElementById("hostel-price").value;

  let cryptoValue = hostelPrice * Math.pow(10,18);

  await contractInstance.methods.reserveHostel(hostelName,{ amount: cryptoValue })
  .catch(function(error) {
    console.error(error)
    $("#loader").hide();
  })
  .then(function() {
    window.location.reload();
  });
}