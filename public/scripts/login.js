document.querySelector("#submitButton").addEventListener("click", function () {
  const feedbackElement = document.getElementById("feedback-message");
  feedbackElement.textContent = ""; // (Limpa erros antigos)

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
});

// if (arcadeTempId) {
//   document.querySelector("#adminSubmitButton").textContent =
//     "Entrar como Admin: " + arcadeTempId;
//   document.querySelector("#submitButton").style.display = "none";
// }

// if (!arcadeTempId) {
//   document.querySelector("#adminSubmitButton").style.display = "none";
// }

document.querySelector("#adminSubmitButton").style.display = "none";
