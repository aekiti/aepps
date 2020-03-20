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


firebase.auth.Auth.Persistence.LOCAL;


  $('#btn-login').click(function(){
    var email=$('#email').val();
    var password=$('#password').val();

    if(email!=""&&password!=""){
        var result=firebase.auth().signInWithEmailAndPassword(email,password);

        

        result.catch(function(error){
        var errorCode=error.code;
        var errorMessage=error.message;
        
        console.log(errorCode);
        console.log(errorMessage);
        window.alert('Message :  '+errorMessage);
        });

    
    }else{
        window.alert("Form is incomplete. Please Fill Out All Fields")
    }

  });


  $('#btn-logout').click(function(){
      console.log("btn logout clicked");
    firebase.auth().signOut();
  });





  $('#btn-signup').click(function(){
    var email=$('#email').val();
    var password=$('#password').val();
    var cPassword=$('#Confirmpassword').val();

    if(email!=""&&password!=""&&cPassword!=""){
      if(password==cPassword){
        var result=firebase.auth().createUserWithEmailAndPassword(email,password);
          
       

        result.catch(function(error){
        var errorCode=error.code;
        var errorMessage=error.message;
        
        console.log(errorCode);
        console.log(errorMessage);
        window.alert('Message :  '+errorMessage);
        });

      }else{
        window.alert("Passwords dont match");
      }
    
    }else{
        window.alert("Form is incomplete. Please Fill Out All Fields");
    }

  });

  $('#btn-resetPassword').click(function(){
    var auth=firebase.auth();
    var email=$('#email').val();
    if(email!=""){
        auth.sendPasswordResetEmail(email).then(function(){

            window.alert("Password Reset Email Has Been Sent To You");

            
        }).catch(function(){
            var errorCode=error.code;
            var errorMessage=error.message;
            
            console.log(errorCode);
            console.log(errorMessage);
            window.alert('Message :  '+errorMessage);
        });
    }else{
        window.alert("Form is incomplete. Please Fill Out All Fields");
    }
  });


  $('#btn-update').click(function(){
      console.log("update clicked");
    var phone=$('#phone').val();
    var address=$('#address').val();
    var bio=$('#bio').val();

    var fName=$('#FirstName').val();
    var sName=$('#SecondName').val();
    var gender=$('#gender').val();
    var country=$('#country').val();

    var rootRef=firebase.database().ref().child("Users");
    var userId=firebase.auth().currentUser.uid;
    var usersRef=rootRef.child(userId);

    if(phone!=""&&address!=""&&bio!=""&&fName!=""&&sName!=""&&gender!=""&country!=""){
            var usersData={
                "phone":phone,
                "address":address,
                "bio":bio,
                "firstName":fName,
                "secondName":sName,
                "gender":gender,
                "country":country,
                "payment":"unpaid"
            }
            usersRef.set(usersData,function(error){
                if(error){
                    var errorCode=error.code;
                    var errorMessage=error.message;
                    
                    console.log(errorCode);
                    console.log(errorMessage);
                    window.alert('Message :  '+errorMessage);
                }else{
                 window.location.href="MainPage.html"
                
                }
            });
    }else{
        window.alert("Form is incomplete. Please Fill Out All Fields");
    }
  });