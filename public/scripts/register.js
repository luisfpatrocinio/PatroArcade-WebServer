document.addEventListener("DOMContentLoaded", InitRegisterPage);

function InitRegisterPage() {
  const registerButton = document.getElementById("registerButton");

  if (registerButton) {
    registerButton.addEventListener("click", HandleRegisterSubmit);
  }
}

function HandleRegisterSubmit(event) {
  event.preventDefault();

  const registerForm = document.getElementById("registerForm");
  const feedbackElement = document.getElementById("feedback-message");

  const apiURL = registerForm.dataset.apiUrl;
  const arcadeId = registerForm.dataset.arcadeId;

  feedbackElement.textContent = "";

  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  fetch(`${apiURL}/register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email, password, confirmPassword }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.type === "registerSuccess") {
        feedbackElement.textContent =
          "Registro realizado com sucesso! Redirecionando para o login...";
        setTimeout(() => {
          window.location.href = `/login/${arcadeId}`;
        }, 2000);
      } else {
        feedbackElement.textContent = "Registro falhou: " + (data.message || data.content || data.error || "Verifique os dados e tente novamente.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      feedbackElement.textContent = "Ocorreu um erro. Tente novamente.";
    });
}
