function showPage(pageId,button){
 document.querySelectorAll(".page")
 .forEach(page=>{
 page.classList.remove("active");
 });
 document.getElementById(pageId)
 .classList.add("active");
 if(button){
 document.querySelectorAll("nav button")
 .forEach(btn=>{
 btn.classList.remove("active");
 });
 button.classList.add("active");
 }
 window.scrollTo({
 top:0,
 behavior:"smooth"
 });
}
/* THEME */
function toggleTheme(){
 document.body.classList.toggle("light");
 const btn=
 document.querySelector(".theme-btn");
 if(document.body.classList.contains("light")){
 btn.textContent=" Theme";
 }else{
 btn.textContent=" Theme";
 }
}
/* IMAGE PREVIEW */
function previewImage(event){
 const file=
 event.target.files[0];
 if(!file){
 return;
 }
 const image=
 document.getElementById("preview");
 image.src=
 URL.createObjectURL(file);
 image.style.display="block";
}
/* AI ANALYSIS */
function analyze(event){
 event.preventDefault();
 const description=
 document
 .getElementById("description")
 .value
 .toLowerCase();
 let issue=
 "General Civic Issue";
 let department=
 "Municipal Services";
 let severity=50;
 let icon="";
 if(
 description.includes("pothole") ||
 description.includes("road")
 ){
 issue="Pothole";
 department=
 "Road Maintenance";
 severity=94;
 icon="";
 }
 else if(
 description.includes("garbage") ||
 description.includes("waste")
 ){
 issue=
 "Garbage Accumulation";
 department=
 "Waste Management";
 severity=64;
 icon="";
 }
 else if(
 description.includes("streetlight") ||
 description.includes("light")
 ){
 issue=
 "Broken Streetlight";
 department=
 "Electrical Department";
 severity=88;
 icon="";
 }
 else if(
 description.includes("water") ||
 description.includes("leak")
 ){
 issue=
 "Water Leakage";
 department=
 "Water Department";
 severity=78;
 icon="";
 }
 let level="Low";
 let priority="P3";
 if(severity>=71){
 level="Critical";
 priority="P1";
 }
 else if(severity>=31){
 level="Medium";
 priority="P2";
 }
 const result=
 document.getElementById("result");
 result.classList.remove("hidden");
 result.innerHTML=`
 <h3>
 ${icon} AI Analysis Complete
 </h3>
 <p>
 <b>Detected Issue:</b>
 ${issue}
 </p>
 <p>
 <b>Severity:</b>
 <span class="red">
 ${severity}/100 - ${level}
 </span>
 </p>
 <p>
 <b>Confidence:</b>
 96%
 </p>
 <p>
 <b>Category:</b>
 Civic Infrastructure
 </p>
 <p>
 <b>Department:</b>
 ${department}
 </p>
 <p>
 <b>Priority:</b>
 ${priority}
 </p>
 <button
 class="primary full"
 onclick="submitComplaint(
 '${issue}',
 '${department}',
 ${severity})">
 ✓ Submit Complaint
 </button>
 `;
}
/* SUBMIT */
function submitComplaint(
 issue,
 department,
 severity
){
 document.getElementById("total")
 .textContent="1,248";
 alert(
 "Complaint Submitted Successfully!\\n\\n"+
 "Issue: "+issue+"\\n"+
 "Severity: "+severity+"/100\\n"+
 "Department: "+department
 );
 showPage("dashboard");
}
/* ISSUE DETAILS */
function issueDetails(
 title,
 score,
 reports,
 department
){
 document.getElementById(
 "modalTitle"
 ).textContent=title;
 document.getElementById(
 "modalScore"
 ).textContent=
 score+"/100";
 document.getElementById(
 "modalReports"
 ).textContent=
 reports;
 document.getElementById(
 "modalDepartment"
 ).textContent=
 department;
 document.getElementById("modal")
 .classList
 .remove("hidden");
}
/* CLOSE */
function closeModal(){
 document.getElementById("modal")
 .classList
 .add("hidden");
}
/* RESOLVE */
function resolveIssue(){
 alert(
 " Issue marked as RESOLVED!\\n\\n"+
 "Municipal team has completed the action."
 );
 closeModal();
}
/* LOCATION */
function locate(){
 alert(
 " Smart City Location\\n\\n"+
 "Map location is simulated for this presentation demo."
 );
}
/* SORT */
function sortIssues(){
 alert(
 "Priority Queue Sorted!\\n\\n"+
 "P1 → Critical\\n"+
 "P2 → Medium\\n"+
 "P3 → Low"
 );
}
/* CLOSE MODAL */
window.onclick=function(event){
 const modal=
 document.getElementById("modal");
 if(event.target===modal){
 closeModal();
 }
};
