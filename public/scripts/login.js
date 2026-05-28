document.querySelector("#submitButton").addEventListener("click", HandleLoginSubmit);
document.querySelector("#adminSubmitButton").style.display = "none";

function HandleLoginSubmit() {
  const feedbackElement = document.getElementById("feedback-message");
  feedbackElement.textContent = "";

  const username = document.querySelector("#username").value;
  const password = document.querySelector("#password").value;
  const apiURL = document.querySelector("#apiURL").value;
  const arcadeId = document.querySelector("#arcadeId").value;

  console.log("Arcade ID: ", arcadeId);

  fetch(`${apiURL}/login/${arcadeId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.type === "loginSuccess") {
        window.location.href = "/player/" + data.content.player.id;
      } else {
        feedbackElement.textContent = "Falha ao logar: " + data.content;
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      feedbackElement.textContent = "Ocorreu um erro. Tente novamente.";
    });
}
