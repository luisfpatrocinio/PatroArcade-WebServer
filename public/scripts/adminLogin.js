document
  .querySelector("#adminSubmitButton")
  .addEventListener("click", HandleAdminLoginSubmit);

function HandleAdminLoginSubmit() {
  const feedbackElement = document.getElementById("feedback-message");
  feedbackElement.textContent = ""; 

  const username = document.querySelector("#username").value;
  const password = document.querySelector("#password").value;
  const arcadeTempId = document.querySelector("#arcadeTempId").value;
  const apiURL = document.querySelector("#apiURL").value;

  console.log("API URL: ", apiURL);
  console.log("Temp ID: ", arcadeTempId);
  
  fetch(`${apiURL}/arcadeLogin/${arcadeTempId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.type === "loginSuccess") {
        window.location.href = "/"; 
      } else {
        feedbackElement.textContent = "Falha ao logar: " + data.content;
      }
    });
}
