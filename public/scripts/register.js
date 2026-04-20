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
        let errorMessage = "Erro desconhecido";
        if (data.content && Array.isArray(data.content)) {
          errorMessage = data.content.map(err => err.message).join(", ");
        } else {
          errorMessage = data.message || data.error || "Verifique os dados.";
        }
        alert("Registro falhou: " + errorMessage);
        feedbackElement.textContent = "Registro falhou: " + errorMessage;
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      let errorMessage = "Erro de conexão. Verifique sua internet.";
      if (error.response && error.response.data) {
        const data = error.response.data;
        if (data.content && Array.isArray(data.content)) {
          errorMessage = data.content.map(err => err.message).join(", ");
        } else {
          errorMessage = data.message || data.error || errorMessage;
        }
      }
      alert("Registro falhou: " + errorMessage);
      feedbackElement.textContent = "Registro falhou: " + errorMessage;
    });
}
