// It Is Used For The Form Validation 
//**************************************// 
export const validEmail = new RegExp(
    "^[a-zA-Z0-9._:$!%-]+@[a-zA-Z0-9.-]+.[a-zA-Z]$"); //This Regex Is Used For The email Validation//
  export const validmobileNumber = new RegExp("^[0-9]+.$");   //This Regex Is Used For The Mobile Number Validation//
  export const validUserName = new RegExp("^[a-zA-z]+.$");     //This Regex Is Used For The UserName Validation//
  export const validUserFatherName = new RegExp("^[a-zA-z]+.$");  //This Regex Is Used For The fatherName Validation//
  export const validUserAddress = new RegExp("^[a-zA-Z0-9]");      //This Regex Is Used For The Address Validation//
  export const validCityName = new RegExp("^[a-zA-z]+.$");         //This Regex Is Used For The City Validation//
  export const validStateName = new RegExp("^[a-zA-z]+.$");        //This Regex Is Used For The StateName Validation//
  export const validSchoolCode = new RegExp("^[0-9]+$");            //This Regex Is Used For The School Validation//
  export const validPrincipalName = new RegExp("^[a-zA-z]+.$");     //This Regex Is Used For The Principal Name Validation//
  export const validSchoolCodeSchool = new RegExp("^[0-9]+$");      //This Regex Is Used For The School Code Whic Is In Teacher and Student page Validation//
  export const validSchoolRollNo = new RegExp("^[0-9]+$");          //This Regex Is Used For The School Roll No Validation//
  export const validTeacherCode = new RegExp("^[0-9]+$");           //This Regex Is Used For The Teacher Code Validation//
  export const validClassName=new RegExp("^[0-9A-Z]+$");            //This Regex Is Used For The Class Name Validation//
  export const validSectionName=new RegExp("^[a-zA-Z0-9]+$")         //This Regex Is Used For The Section Name Validation/
  export const validPostalCode=new RegExp("^[0-9]+$")       //This Regex Is Used For The postalcode  Validation/
  export const validUserSchoolName = new RegExp("^[a-zA-z]+.$");  //This Regex Is Used For The schoolname  Validation/
  export const validPassword=new RegExp("^[0-9]+$");  //This Regex Is Used For The password  Validation//
  export const validNewPassword=new RegExp("^[0-9]+$");  //This Regex Is Used For The newpassword  Validation//
  const fieldValidation = {             //create The Object and store the regex in the key value pair//
     name: validUserName,  //it is user name validation regex store in name key//
    email: validEmail,     //it is user email validation regex store in email key//
    emailId: validEmail,   //it is emailid validation regex store in emailid key//
    mobileNumber: validmobileNumber, //it is mobile validation regex store in name key//
    address: validUserAddress,       //it is address validation regex store in address key//
    city: validCityName,             //it is user City name validation regex store in city key//
    state: validStateName,            //it is state validation regex store in state key//
    schoolCode:  validSchoolCode,            //it is Scool code validation regex store in code key//
    principalName:validPrincipalName,  //it is principal name validation regex store in principalN ame key//
    // schoolCode:validSchoolCodeSchool,  //it is schoolCode validation regex store in schoolCode key//
    fatherName:validUserFatherName,    //it is Fathername validation regex store in fatherName key//
    rollNumber:validSchoolRollNo,      //it is rollNo validation regex store in rollNumber key//
    className:validClassName,          //it is user classname validation regex store in className key//
    sectionName:validSectionName,       //it is user sctionname validation regex store in sectionName key//
    teacherCode:validTeacherCode,        //it is teachercode validation regex store in teachercode key//
    postalCode: validPostalCode,      //it is postalcode validation regex store in postalcode key//
    // schoolName:validUserSchoolName,             //it is schoolname validation regex store in schoolname key//
    password:validPassword,                   //it is password validation regex store in password key//
    confirmPassword: validNewPassword,             //it is newpassword validation regex store in password key//
  };
  const formValidation = (props) => {    // coming the data from forms with the help of props
    let message = "Please Check the fields";     //show the message when user click sabe button// 
    let output = []                              //create the empty array
    Object.keys(props).map((k, i) => {        // map the keys which is coming from the props//
      if (fieldValidation[k]) {
        const validity = fieldValidation[k].test(props[k]);  //store the keys in another varrible//
        output.push({fieldName : k, valid : validity});     //with the help of output varriable push the filedname validity in array//
      }
    });
    output.map((k,i) => {    // map the data which is store in the output array//
    //  console.log(i)
     if (!k.valid) message = i !== output.length ===0 ? `${message} ${k.fieldName.toUpperCase()},` // apply the condition and add the message and add the toUpprCase method for show the field name in uppercase//
        : `${message} ${k.fieldName.toUpperCase()} and resubmit`
    })
    if (message === "Please Check the fields") {    // show the message when filed is empty//
     return true
    }
    return message
  };
  export default formValidation;
