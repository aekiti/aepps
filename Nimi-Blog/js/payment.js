var firebaseConfig = {
    apiKey: "AIzaSyBCr2PIDz2dIrek-WEmvkYzq_MytQOORyo",
    authDomain: "nimifirebaseblogsite.firebaseapp.com",
    databaseURL: "https://nimifirebaseblogsite.firebaseio.com",
    projectId: "nimifirebaseblogsite",
    storageBucket: "nimifirebaseblogsite.appspot.com",
    messagingSenderId: "840727252414",
    appId: "1:840727252414:web:2c535e5e93069e05"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
var contractSource;
var contractAddress;  
var client=null;

$('#btn-make-payment').click(async function(){
     var rootRef=firebase.database().ref().child("Users");
    var userId=firebase.auth().currentUser.uid;
    var usersRef=rootRef.child(userId+"/payment");
    usersRef.set("paid");
    
    
    await contractCall('makePayment',[],1000000000000000000);
    window.location.href="MainPage.html";
})

async function callStatic(func,args)
{
  const contract=await client.getContractInstance(contractSource,{contractAddress});
  const calledGet=await contract.call(func,args,{callStatic:true}).catch(e=>console.error(e));
  console.log('calledGet',calledGet);

  const decodeGet=await calledGet.decode().catch(e =>console.error(e));
  return decodeGet;
}

async function contractCall(func,arg,value){
  const contract=await client.getContractInstance(contractSource,{contractAddress});
  const calledGet=await contract.call(func,arg,{amount:value}).catch(e=>console.error(e));
  console.log('calledGet',calledGet);
return calledGet;
}

window.addEventListener('load',async()=>{
    contractAddress="ct_2ABvnJEEYN25ZLUesi1g2BvSk2fgCvHeKfeoJtfU4SUFWmHrn1";
    contractSource=`
contract BlogPayment=
  record state={myAddress:address}
        
  entrypoint init()={myAddress=ak_2bKhoFWgQ9os4x8CaeDTHZRGzUcSwcXYUrM12gZHKTdyreGRgG}
            
  public stateful entrypoint makePayment()=
    Chain.spend(state.myAddress,Call.value)
    
  public entrypoint getTestValue():int=
    5
    `;
    client = await Ae.Aepp();
    var tValue=await callStatic('getTestValue',[]);
    console.log(tValue);
    
})
