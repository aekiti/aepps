let client = null, contractInstance = null;

const contractAddress="ct_2oVcu1v4iwStsJyRrWT5rrP1pQ99adycupKxy2oqwE7Kh1mRct";
const contractSource=`
contract StudentResult =
  record result = 
    { coursecode:string,
      rawscore:string,
      grade:string }

  record student =
    { name:string,
      matric:hash,
      results: list(result) }
    
  record state = {
    students:map(address, student),
    cordinators:map(address, string),
    chancellor:address }

  entrypoint init() = {
    students = {},
    cordinators = {},
    chancellor = ak_4uxrV4KWa9DSbcxJ4HLJV9RdhQfZNAxoyj7Jf4syara942ZxB }

  function reqistrationCheck(exp : bool, err : string) =
    if(!exp)
     abort(err)

  function studentCheck() =
    let student = Map.member(Call.caller, state.students)
    require(student, "Not Authorized: Student Only")

  function cordinatorCheck() =
    let cordinator = Map.member(Call.caller, state.cordinators)
    require(cordinator, "Not Authorized: Cordinator Only")

  entrypoint chancellorCheck() =
    require(state.chancellor == Call.caller, "Not Authorized: Chancellor Only")

  stateful entrypoint addStudent(name':string, matric':string) =
    reqistrationCheck(!(Map.member(Call.caller, state.cordinators)), "Already a Cordinator")

    let matricHash = String.sha3(matric')
    let newStudent = {name=name', matric=matricHash, results=[]}

    put(state{students[Call.caller] = newStudent})

  stateful entrypoint addCordinator(name':string) =
    reqistrationCheck(!(Map.member(Call.caller, state.students)), "Already a Student")

    put(state{cordinators[Call.caller] = name'})
  
  stateful entrypoint addResult(student:address, coursecode':string, rawscore':string, grade':string) =
    cordinatorCheck()
    let newResult = {coursecode=coursecode', rawscore=rawscore', grade=grade'}
    
    let result = state.students[student].results
    let newResultList = newResult::result
    let updateResult = state.students{ [student].results = newResultList }
    
    put(state{students = updateResult})
    
  entrypoint student()=
    require(Map.member(Call.caller, state.students), "Student Not Found")
    studentCheck()
    state.students[Call.caller]

  entrypoint studentResult()=
    require(Map.member(Call.caller, state.students), "Student Not Found")
    studentCheck()
    state.students[Call.caller].results

  entrypoint cordinator()=
    require(Map.member(Call.caller, state.cordinators), "Cordinator Not Found")
    cordinatorCheck()
    state.cordinators[Call.caller]
    
  entrypoint getStudents()=
    state.students

  entrypoint getCordinators()=
    chancellorCheck()
    state.cordinators

  stateful entrypoint deleteCordinator(cordinatorAddress : address)=
    chancellorCheck()
    let updatedCordinators = Map.delete(cordinatorAddress, state.cordinators)

    put(state{cordinators = updatedCordinators})
`;

function studentDom(address, name) {
  let studentList = document.getElementById("select-student");

  let listOption = document.createElement("option");
  listOption.setAttribute('value', address);
  listOption.innerText = name;

  studentList.appendChild(listOption);
}

function cordinatorDom(address, name) {
  let cordinatorList = document.getElementById("select-cordinator");

  let listOption = document.createElement("option");
  listOption.setAttribute('value', address);
  listOption.innerText = name;

  cordinatorList.appendChild(listOption);
}

function resultDom(coursecode, rawscore, grade){
  let allResults = document.getElementById("result-list");

  let resultTr = document.createElement("tr");

  let lCourseCode = document.createElement("td");
  lCourseCode.innerText = coursecode;
  let lRawScore = document.createElement("td");
  lRawScore.innerText = rawscore;
  let lGrade = document.createElement("td");
  lGrade.innerText = grade;

  resultTr.appendChild(lCourseCode);
  resultTr.appendChild(lRawScore);
  resultTr.appendChild(lGrade);
  allResults.appendChild(resultTr);
}

window.addEventListener('load', async () => {
  client = await Ae.Aepp();
  contractInstance = await client.getContractInstance(contractSource, {contractAddress});

  contractInstance.methods.student()
  .then(async function(studentInfo) {
    $("#cordinator-nav").hide();
    $("#cordinator").hide();

    let studentProfile = studentInfo.decodedResult

    document.getElementById("student-profile").innerHTML = "<div class='text-center'><div class='card border-color'><div class='card-body'><h4 class='card-title color'>" + studentProfile.name + "</h4><p class='card-text'>" + studentProfile.matric + "<br>" + studentProfile.results.length + " Result Added</p></div></div></div>";

    contractInstance.methods.studentResult()
    .then(function(results) {
      let allResults = results.decodedResult

      if (allResults.length > 0) {
        allResults.map(result => {
          resultDom(result.coursecode, result.rawscore, result.grade)
        });
      } else {
        $("#my-result").hide();
      }
    })
    .catch(function(error) {
      document.getElementById("message").innerHTML = "<div class='alert bg-color alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button><strong>Error!</strong> " + error.decodedError + "</div>";
      $("#loader").hide();
    });
  })
  .catch(function(error) {
    if (error.decodedError == "EStudent Not Found(p�Z") {
      $("#my-result").hide();
      document.getElementById("student-profile").innerHTML = "<div><h4>Student Registration</h4><form><div class='row'><div class='form-group col'><input type='text' class='form-control' id='student-name' placeholder='Full Name' required><div class='valid-feedback'>Valid.</div><div class='invalid-feedback'>Please enter your full name.</div></div><div class='form-group col'><input type='text' class='form-control' id='student-matric' placeholder='Matric No' required><div class='valid-feedback'>Valid.</div><div class='invalid-feedback'>Please enter your matric no.</div></div></div><div class='text-center'><button type='submit' id='add-student' class='btn bg-color'>Submit</button></div></form></div>";

      $('#add-student').click(async function(event){
        event.preventDefault();
        $("#loader").show();
      
        const studentName = ($('#student-name').val()),
              studentMatric = ($('#student-matric').val());
      
        if (studentName.trim()!=""&&studentMatric.trim()!="") {
          contractInstance.methods.addStudent(studentName, studentMatric)
          .then(function() {
            window.location.reload();
          })
          .catch(function(error) {
            $("#loader").hide();
            document.getElementById("message").innerHTML = "<div class='alert bg-color alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button><strong>Error!</strong> " + error.decodedError + "</div>";
          });
        } else {
          $("#loader").hide();
          document.getElementById("message").innerHTML = "<div class='alert bg-color alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button><strong>Error!</strong> Kindly Fill All Fields</div>";
        }
      });
    } else {
      $("#student-nav").hide();
      $("#student").hide();
    }
    $("#loader").hide();
  });

  contractInstance.methods.cordinator()
  .then(async function(cordinatorInfo) {
    $("#student-nav").hide();
    $("#student").hide();

    let cordinatorName = cordinatorInfo.decodedResult

    document.getElementById("cordinator-profile").innerHTML = "<div class='text-center'><div class='card border-color'><div class='card-body'><h4 class='card-title color'>" + cordinatorName + "</h4></div></div></div>";

    contractInstance.methods.getStudents()
    .then(function(students) {
      let allStudents = students.decodedResult

      if (allStudents.length > 0) {
        $("#no-student").hide();
        allStudents.map(student => {
          studentDom(student[0], student[1].name)
        });

        $('#add-result').click(async function(event){
          event.preventDefault();
          $("#loader").show();
        
          const student = ($('#select-student').val()),
                coursecode = ($('#course-code').val()),
                rawscore = ($('#raw-score').val()),
                grade = ($('#grade').val());
        
          if (student != "none" && coursecode.trim()!="" && rawscore.trim()!="" && grade.trim()!="") {
            contractInstance.methods.addResult(student, coursecode, rawscore, grade)
            .then(function() {
              window.location.reload();
            })
            .catch(function(error) {
              $("#loader").hide();
              document.getElementById("message").innerHTML = "<div class='alert bg-color alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button><strong>Error!</strong> " + error.decodedError + "</div>";
            });
          } else {
            $("#loader").hide();
            document.getElementById("message").innerHTML = "<div class='alert bg-color alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button><strong>Error!</strong> Please fill all fields</div>";
          }
        });
      } else {
        $("#result-form").hide();
      }
    })
    .catch(function(error) {
      document.getElementById("message").innerHTML = "<div class='alert bg-color alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button><strong>Error!</strong> " + error.decodedError + "</div>";
      $("#loader").hide();
    });
  })
  .catch(function(error) {
    if (error.decodedError == "QCordinator Not Found���") {
      $("#no-student").hide();
      $("#result-form").hide();
      document.getElementById("cordinator-profile").innerHTML = "<div><h4>Cordinator Registration</h4><form><div class='form-group'><input type='text' class='form-control' id='cordinator-name' placeholder='Full Name' required><div class='valid-feedback'>Valid.</div><div class='invalid-feedback'>Please enter your full name.</div></div><div class='text-center'><button type='submit' id='add-cordinator' class='btn bg-color'>Submit</button></div></form></div>";

      $('#add-cordinator').click(async function(event){
        event.preventDefault();
        $("#loader").show();
      
        const cordinatorName = ($('#cordinator-name').val());
      
        if (cordinatorName.trim()!="") {
          contractInstance.methods.addCordinator(cordinatorName)
          .then(function() {
            window.location.reload();
          })
          .catch(function(error) {
            $("#loader").hide();
            document.getElementById("message").innerHTML = "<div class='alert bg-color alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button><strong>Error!</strong> " + error.decodedError + "</div>";
          });
        } else {
          $("#loader").hide();
          document.getElementById("message").innerHTML = "<div class='alert bg-color alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button><strong>Error!</strong> Kindly Fill All Fields</div>";
        }
      });
    } else {
      $("#cordinator-nav").hide();
      $("#cordinator").hide();
    }
    $("#loader").hide();
  });

  contractInstance.methods.chancellorCheck()
  .then(async function() {
    $("#student-nav").hide();
    $("#student").hide();
    
    let students = (await contractInstance.methods.getStudents()).decodedResult.length;
    document.getElementById("student-count").innerHTML = "<h4 class='color'>Students <span class='badge bg-color'>" + students + "</span></h4>";

    let cordinators = (await contractInstance.methods.getCordinators()).decodedResult.length;
    document.getElementById("cordinator-count").innerHTML = "<h4 class='color'>Cordinators <span class='badge bg-color'>" + cordinators + "</span></h4>";


    contractInstance.methods.getCordinators()
    .then(function(cordinators) {
      let allCordinators = cordinators.decodedResult

      if (allCordinators.length > 0) {
        $("#no-cordinator").hide();
        allCordinators.map(cordinator => {
          cordinatorDom(cordinator[0], cordinator[1])
        });

        $('#delete-cordinator').click(async function(event){
          event.preventDefault();
          $("#loader").show();
        
          const cordinator = ($('#select-cordinator').val());
        
          if (cordinator != "none") {
            contractInstance.methods.deleteCordinator(cordinator)
            .then(function() {
              window.location.reload();
            })
            .catch(function(error) {
              $("#loader").hide();
              document.getElementById("message").innerHTML = "<div class='alert bg-color alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button><strong>Error!</strong> " + error.decodedError + "</div>";
            });
          } else {
            $("#loader").hide();
            document.getElementById("message").innerHTML = "<div class='alert bg-color alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button><strong>Error!</strong> Please Select A Cordinator</div>";
          }
        });
      } else {
        $("#delete-form").hide();
      }
    })
    .catch(function(error) {
      document.getElementById("message").innerHTML = "<div class='alert bg-color alert-dismissible fade show'><button type='button' class='close' data-dismiss='alert'>&times;</button><strong>Error!</strong> " + error.decodedError + "</div>";
      $("#loader").hide();
    });
  })
  .catch(function(error) {
    $("#chancellor-nav").hide();
    $("#chancellor").hide();
    $("#loader").hide();
  });

  $("#loader").hide();
});