let paymentArray = [];

let client = null, contractInstance = null;
const contractAddress = 'ct_2C7qjNqw634pMGpyuLkN4Lf8ZtUVRMssh9Uiq5tLEctgmD65dB';

const contractSource = `
payable contract EKSUPayment =

  record payment =
    { studentAddress : address,
      name           : string,
      matric         : int,
      payType        : string,
      amount         : int }

  record state =
    { payments       : map(address, list(payment)),
      schoolAddress  : address }

  entrypoint init() =
    { payments = {},
      schoolAddress = ak_rLoCtHE3NK9dKyCNonJFYWkEEfeAsDUWa887GsCKqV1rhSuT6 }

  payable stateful entrypoint makePayment(name' : string, matric' : int, payType' : string, amount' : int) =
    let payment = {studentAddress = Call.caller, name = name', matric = matric', payType = payType', amount = amount'}
    Chain.spend(state.schoolAddress, Call.value)

    let paymentList = Map.lookup_default(Call.caller, state.payments, [])
    let newPaymentList = payment::paymentList

    put(state{payments[Call.caller] = newPaymentList})

  entrypoint userPayment() =
    state.payments[Call.caller]  

  entrypoint getPayment() =
    state.payments
`;

function myPayment(type, amount){
  let myPayment=document.getElementById("myPayment");

  let paymentList = document.createElement('tr');
  
  let typeText=document.createElement("td");
  typeText.innerText=type;

  let amountText=document.createElement("td");
  amountText.innerHTML=amount + "æ";

  paymentList.appendChild(typeText);
  paymentList.appendChild(amountText);;

  myPayment.appendChild(paymentList);
}

window.addEventListener('load', async () => {
  $("#loader").show();

  client = await Ae.Aepp();
  contractInstance = await client.getContractInstance(contractSource,{contractAddress});

  contractInstance.methods.userPayment()
  .then(function (result) {
    let myPay= result.decodedResult;
    myPay=map(payment=>{
      myPayment(payment.payType, payment.amount)
      $("#loader").hide();
    });
  })
  .catch(function (error) {
    console.error(error.decodedError)
    document.getElementById("myPayment").innerText = "No Payment"
    $("#loader").hide();
  })
});

async function makePayment(event){
  event.preventDefault();

  let name = document.getElementById("paymentName").value;
  let matric = document.getElementById("paymentMatric").value;
  let payType = document.getElementById("payType").value;
  let amount = document.getElementById("paymentAmount").value;
  let cryptoAmount = amount * Math.pow(10,18);

  if(name.trim()!=""&&matric.trim()!=""&&payType.trim()!=""&&amount.trim()!=""){
    $("#loader").show();
    await contractInstance.methods.makePayment(name, matric, payType, amount,{cryptoAmount});
    myPayment(payType, amount);
    $("#loader").hide();
  }
}

document.getElementById("registerBtn").addEventListener("click",makePayment);
