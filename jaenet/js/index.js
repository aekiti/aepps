let ipfs = null, client = null, contractInstance = null, jaenetImage = null, designImage = null;

let contractAddress ="ct_2YpGczTqAFxCBafzyZpWed2ciTkZoK5Fa5qNdNoeVJetSogeKt";
let contractSource =`
payable contract Jaenet =

  record jane = {
    name        : string,
    image       : string,
    email       : string,
    contact     : string,
    stack       : string,
    description : string }

  record design = {
    name     : string,
    image    : string,
    category : string,
    price    : int }

  record tran = {
    name           : string,
    designName     : string,
    designCategory : string,
    quantity       : int,
    amount         : int }

  record state = {
    account : map(address, jane),
    designs : map(string, design),
    trans   : map(address, list(tran)),
    janet   : address }

  entrypoint init() = {
    account = {},
    designs = {},
    trans   = {},
    janet   = ak_2o5ZXFXU6uGNdLR2TzCBTSe7TCFfbtK8YAzMCd7zhosD9xymcq }

  entrypoint getAbout() =
    state.account[state.janet]

  entrypoint getAccount() =
    require(state.janet == Call.caller, "Not Authorized")
    state.account[Call.caller]

  entrypoint getDesigns() =
    state.designs

  entrypoint getTrans() =
    require(state.janet == Call.caller, "Not Authorized")
    state.trans

  entrypoint myTrans() =
    Map.lookup_default(Call.caller, state.trans, [])

  stateful entrypoint profile(name':string, image':string, email':string, contact':string, stack':string, description':string) =
    require(state.janet == Call.caller, "Not Authorized")
    let profile ={name = name', image = image', email = email', contact = contact', stack = stack', description = description'}
    
    put(state{account[Call.caller] = profile})


  function design(designName : string) : bool =
    Map.member(designName, state.designs) 

  stateful entrypoint addDesign(name':string, image':string, category':string, price':int) =
    require(state.janet == Call.caller, "Not Authorized")
    require(!design(name'), "Design Already Exist")

    let newDesign ={name = name', image = image', category = category', price = price'}
    
    put(state{designs[name'] = newDesign})

  payable stateful entrypoint buyDesign(name' : string, designName' : string, quantity' : int, amount' : int) =
    require(design(designName'), "Design Not Found")
    let design =state.designs[designName']

    Chain.spend(state.janet, Call.value)

    let newTran = {name = name', designName = design.name, designCategory = design.category, quantity = quantity', amount = amount'}
    let newTranList = newTran::myTrans()
    
    put(state{ trans[Call.caller] = newTranList })
`;

function designDom(name, image, category, price){
  let allDesigns = document.getElementById("all-designs");

  let designCol = document.createElement("div");
  designCol.classList.add("col-md-6");
  let designBox = document.createElement("div");
  designBox.classList.add("designBox");
  designBox.setAttribute('data-design-price', price)

  let divStatus = document.createElement("div");
  divStatus.classList.add("inactiveStatus");

  let divImage = document.createElement("div");
  divImage.classList.add("design-image");
  let designImage = document.createElement("img");
  designImage.src = image;
  designImage.alt = name;

  let divRow = document.createElement("div");
  divRow.classList.add("row");

  let col1 = document.createElement("div");
  col1.classList.add("col-xs-6")
  
  let designName = document.createElement("div");
  designName.classList.add("design-nam");
  designName.innerText = name;

  let designCategory = document.createElement("div");
  designCategory.classList.add("design-cat");
  designCategory.innerText = category;

  let designPrice = document.createElement("p");
  designPrice.classList.add("design-price");
  designPrice.innerText = price + " æ";


  let col2 = document.createElement("div");
  col2.classList.add("col-xs-6");
  let countBox = document.createElement("div");
  countBox.classList.add("design-price-count-box")
  let boxControl = document.createElement("div");
  boxControl.classList.add("design-control");
  let countGroup = document.createElement("div");
  countGroup.classList.add("input-group");

  let minusGroup = document.createElement("span");
  minusGroup.classList.add("input-group-btn");
  let minusBtn = document.createElement("button");
  minusBtn.setAttribute('type', 'button');
  minusBtn.classList.add("btn-number");
  minusBtn.classList.add("btn");
  minusBtn.classList.add("btn-default");
  minusBtn.setAttribute('disabled', 'disabled');
  minusBtn.setAttribute('data-type', 'minus');
  minusBtn.setAttribute('data-field', name);
  minusBtn.innerHTML = "<span class='glyphicon glyphicon-minus'></span>";

  let countInput = document.createElement("input");
  countInput.setAttribute('type', 'text')
  countInput.setAttribute('name', name)
  countInput.classList.add("input-number");
  countInput.classList.add("form-control");
  countInput.setAttribute('value', 0)
  countInput.setAttribute('min', 0)
  countInput.setAttribute('max', 10)

  let plusGroup = document.createElement("span");
  plusGroup.classList.add("input-group-btn");
  let plusBtn = document.createElement("button");
  plusBtn.setAttribute('type', 'button');
  plusBtn.classList.add("btn-number");
  plusBtn.classList.add("btn");
  plusBtn.classList.add("btn-default");
  plusBtn.setAttribute('data-type', 'plus');
  plusBtn.setAttribute('data-field', name);
  plusBtn.innerHTML = "<span class='glyphicon glyphicon-plus'></span>";


  minusGroup.appendChild(minusBtn);
  plusGroup.appendChild(plusBtn);

  countGroup.appendChild(minusGroup);
  countGroup.appendChild(countInput);
  countGroup.appendChild(plusGroup);

  boxControl.appendChild(countGroup);
  countBox.appendChild(boxControl);
  
  col1.appendChild(designName);
  col1.appendChild(designCategory);
  col1.appendChild(designPrice);
  col2.appendChild(countBox);

  divRow.appendChild(col1);
  divRow.appendChild(col2);

  divImage.appendChild(designImage)

  designBox.appendChild(divStatus);
  designBox.appendChild(divRow);
  designBox.appendChild(divImage);

  designCol.appendChild(designBox);
  allDesigns.appendChild(designCol);
}

function myTranDom(name, category, quantity, amount){
  let myList = document.getElementById("my-tran-list");
  
  let listTr = document.createElement("tr");

  let tranName = document.createElement("td");
  tranName.innerText = name;

  let tranCategory = document.createElement("td");
  tranCategory.innerText = category;

  let tranQuantity = document.createElement("td");
  tranQuantity.innerText = quantity;

  let tranAmount = document.createElement("td");
  tranAmount.innerText = amount + " æ";

  listTr.appendChild(tranName);
  listTr.appendChild(tranCategory);
  listTr.appendChild(tranQuantity);
  listTr.appendChild(tranAmount);
  
  myList.appendChild(listTr);
}

function transDom(cname, name, category, quantity, amount){
  let allTrans = document.getElementById("trans-list");
  
  let tran = document.createElement("tr");

  let tranClientName = document.createElement("td");
  tranClientName.innerText = cname;

  let tranDesignName = document.createElement("td");
  tranDesignName.innerText = name;

  let tranDesignCategory = document.createElement("td");
  tranDesignCategory.innerText = category;

  let tranDesignQuantity = document.createElement("td");
  tranDesignQuantity.innerText = quantity;

  let tranDesignAmount = document.createElement("td");
  tranDesignAmount.innerText = amount + " æ";

  tran.appendChild(tranClientName);
  tran.appendChild(tranDesignName);
  tran.appendChild(tranDesignCategory);
  tran.appendChild(tranDesignQuantity);
  tran.appendChild(tranDesignAmount);
  
  allTrans.appendChild(tran);
}

window.addEventListener('load', async function() {
  ipfs = await new IPFS({host:'ipfs.infura.io', port:5001, protocol:'https'});
  client = await Ae.Aepp();
  contractInstance = await client.getContractInstance(contractSource,{contractAddress});

  contractInstance.methods.getDesigns()
  .then(function(designs) {
    let allDesigns = designs.decodedResult;

    if (allDesigns.length === 0) {
      $("#all-designs").innerHTML = "<div class='col-md-12'><p class='text-warning text-center'>No Design yet</p></div>"
    } else {
      allDesigns.map(design => {
        axios.get(`https://ipfs.io/ipfs/${design[1].image}`)
        .then(function(result){
          designDom(design[1].name, result.data, design[1].category, design[1].price)
          $('.btn-number').click(function(e){
            e.preventDefault();
            field = $(this).attr('data-field');
            type      = $(this).attr('data-type');
            let input = $("input[name='"+field+"']");
            let designNam = $(this).parents('.designBox').find('.design-nam').html();
            let designCat = $(this).parents('.designBox').find('.design-cat').html();
            let designPrice = $(this).parents('.designBox').attr('data-design-price');
            let total;
            let currentVal = parseInt(input.val());
          
            if (!isNaN(currentVal)) {
              if(type == 'minus') {
                if(currentVal > input.attr('min')) {
                  input.val(currentVal - 1).change();
                  total = designPrice * input.val();
                  activeDesign(this, input.val(), designPrice, total, designNam, designCat);
                } 
                if(parseInt(input.val()) == input.attr('min')) {
                  $(this).attr('disabled', true);
                }
              } else if(type == 'plus') {
                if(currentVal < input.attr('max')) {
                  input.val(currentVal + 1).change();
                  total = designPrice * input.val();
                  activeDesign(this, input.val(), designPrice, total, designNam, designCat);
                }
                if(parseInt(input.val()) == input.attr('max')) {
                  $(this).attr('disabled', true);
                }
              }
            } else {
              input.val(0);
            }
          });
          $('.input-number').focusin(function(){
            $(this).data('oldValue', $(this).val());
          });
          $('.input-number').change(function() {
            minValue =  parseInt($(this).attr('min'));
            maxValue =  parseInt($(this).attr('max'));
            valueCurrent = parseInt($(this).val());
            name = $(this).attr('name');
            if(valueCurrent >= minValue) {
              $(".btn-number[data-type='minus'][data-field='"+name+"']").removeAttr('disabled')
            } else {
              alert('Sorry, the minimum value was reached');
              $(this).val($(this).data('oldValue'));
            }
            if(valueCurrent <= maxValue) {
              $(".btn-number[data-type='plus'][data-field='"+name+"']").removeAttr('disabled')
            } else {
              alert('Sorry, the maximum value was reached');
              $(this).val($(this).data('oldValue'));
            }
          });
          
          function activeDesign(target, inputValue, designPrice, total, designNam, designCat) {
            if(inputValue > 0) {
              $('#buyDesign .designBox').addClass('inActiveDesign');
              $(target).parents('.designBox').removeClass('inActiveDesign').addClass('activeDesign');
              $('.cart .btn').removeClass('disabled');
              $('.design-name').html(designNam);
              $('.design-category').html(designCat);
              $('.design-count').html(inputValue);
              $('.design-amount').html(designPrice);
              $('.total-amount').html(total);
            } else {
              $('#buyDesign .designBox').removeClass('inActiveDesign');
              $(target).parents('.designBox').removeClass('activeDesign inActiveDesign');
              $('.cart .btn').addClass('disabled');
              $('.design-name').html('');
              $('.design-category').html('');
              $('.design-count').html(inputValue);
              $('.design-amount').html(designPrice);
              $('.total-amount').html(total);
            }
          }
        })
        .catch(function(error){
          console.error(error)
        });
      });
    }
  })
  .catch(function(err) {
    console.error(err)
  });

  contractInstance.methods.getAbout()
  .then(function(jaenet) {
    let about = jaenet.decodedResult;

    axios.get(`https://ipfs.io/ipfs/${about.image}`)
    .then(function(result){
      document.getElementById("about-details").innerHTML = "<div><img src='" + result.data + "' class='img-rounded' alt='" + about.name + "'><h3>" + about.name + "</h3><h4>" + about.email + "<br>" + about.contact + "<br>" + about.stack + "</h4><h5>" + about.description + "</h5></div>";
    }).catch(function(error){
      document.getElementById("about-details").innerHTML = error;
    });

  }).catch(function() {
    document.getElementById("about-details").innerHTML = "<h4 class='text-warning'>Anticipate about Jænet</h4>";
  });

  contractInstance.methods.myTrans()
  .then(function(trans) {
    let myTrans = trans.decodedResult;

    if (myTrans.length > 0) {
      myTrans.map(tran => {
        myTranDom(tran.designName, tran.designCategory, tran.quantity, tran.amount)
      });
    } else {
      document.getElementById("tran-tab").style.display = "None";
      document.getElementById("myDesigns").style.display = "None";
    }
  })
  .catch(function(err) {
    console.error(err)
  });

  contractInstance.methods.getAccount()
  .then(async function() {
    let allTrans = (await contractInstance.methods.getTrans()).decodedResult;
    allTrans.map(tran => {
      transDom(tran[1].name, tran[1].designName, tran[1].designCategory, tran[1].quantity , tran[1].amount)
    });
  })
  .catch(function(err) {
    if (err.decodedError != "Maps: Key does not existo�n�") {
      document.getElementById("admin-tab").style.display = "None";
      document.getElementById("admin").style.display = "None"; 
    }
    console.error(err)
  });

  $("#loader").fadeOut("slow");
})

async function handleBuyDesign(event) {
  event.preventDefault();

  let clientName = $('#c-name').val();
  let designName = $('.cart-information').find('.design-name').html();
  let designCategory = $('.cart-information').find('.design-category').html();
  let quantity = $('.cart-information').find('.design-count').html();
  let amount = $('.cart-information').find('.total-amount').html();
  let cryptoAmount = amount * Math.pow(10,18);

  if(clientName.trim() != ""){
    $("#loader").show();
    contractInstance.methods.buyDesign(clientName, designName, quantity, amount, {amount : cryptoAmount})
    .then(function() {
      $("#loader").hide();
      window.location.reload();
    })
    .catch(function(err) {
      $("#loader").fadeOut("slow");
      console.error(err)
    });

  } else {
    console.log("Please Enter Your Name to complete purchase")
  }
}
$('#design-payment').click(handleBuyDesign);

document.getElementById("jaenet-image").addEventListener("change",function(event){
  jaenetImage = event.currentTarget.files[0];
})
async function handleProfile(event) {
  event.preventDefault();

  let jName = $('#name').val();
  let jEmail = $('#email').val();
  let jContact = $('#contact').val();
  let jStack = $('#stack').val();
  let jDescription = $('#description').val();

  if(jName.trim() != "" && jEmail.trim() != "" && jContact.trim() != "" && jStack.trim() != "" && jDescription.trim() != "" && jaenetImage != null){
    $("#loader").show();

    let reader = new FileReader();
    reader.onloadend = async function() {
      ipfs.add(reader.result, async function(err, res) {
        if(err) {
          return;
        }
        axios.get(`https://ipfs.io/ipfs/${res}`)
        .then(async function(){
          contractInstance.methods.profile(jName, res, jEmail, jContact, jStack, jDescription)
          .then(function() {
            window.location.reload();
          })
          .catch(function(err) {
            $("#loader").fadeOut("slow");
            console.error(err)
          });
        })
        .catch(function(error){
          $("#loader").fadeOut("slow");
          console.error(error);
        })
      })
    }
    reader.readAsDataURL(jaenetImage);
  } else {
    console.log("Please fill all fields")
  }
}
$('#submit-profile').click(handleProfile);

document.getElementById("design-image").addEventListener("change",function(event){
  designImage = event.currentTarget.files[0];
})
async function handleAddDesign(event) {
  event.preventDefault();

  let dName = $('#d-name').val();
  let dCategory = $('#d-category').val();
  let dPrice= $('#d-price').val();

  if(dName.trim() != "" && dCategory.trim() != "" && dPrice.trim() != "" && designImage != null){
    $("#loader").show();

    let reader = new FileReader();
    reader.onloadend = async function() {
      ipfs.add(reader.result, async function(err, res) {
        if(err) {
          return;
        }
        axios.get(`https://ipfs.io/ipfs/${res}`)
        .then(async function(result){
          contractInstance.methods.addDesign(dName, res, dCategory, dPrice)
          .then(function() {
            $("#loader").hide();
            window.location.reload();
          })
          .catch(function(err) {
            $("#loader").fadeOut("slow");
            console.error(err)
          });
        })
        .catch(function(error){
          $("#loader").fadeOut("slow");
          console.error(error);
        })
      })
    }
    reader.readAsDataURL(designImage);
  } else {
    console.log("Please fill all fields")
  }
}
$('#add-design').click(handleAddDesign)