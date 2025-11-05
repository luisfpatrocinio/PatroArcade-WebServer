document.addEventListener("DOMContentLoaded", () => {
  const registerButton = document.getElementById("registerButton");
  const registerForm = document.getElementById("registerForm");
  const feedbackElement = document.getElementById("feedback-message");

  // 1. Pega as variáveis dos data-attributes do formulário
  const apiURL = registerForm.dataset.apiUrl;
  const arcadeId = registerForm.dataset.arcadeId;

  if (registerButton) {
    registerButton.addEventListener("click", (event) => {
      event.preventDefault();

      // Limpa feedback anterior
      feedbackElement.textContent = "";

      // 2. Coleta os dados do formulário
      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      // 3. Lógica fetch que estava "in-line"
      fetch(`${apiURL}/register/`, {
        // Note que a rota da API permanece
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, confirmPassword }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.type === "registerSuccess") {
            // CORREÇÃO (Item 4): Removemos o alert()
            feedbackElement.textContent =
              "Registro realizado com sucesso! Redirecionando para o login...";
            // Redireciona após um pequeno atraso
            setTimeout(() => {
              window.location.href = `/login/${arcadeId}`;
            }, 2000);
          } else {
            // CORREÇÃO (Item 4): Removemos o alert()
            feedbackElement.textContent = "Registro falhou: " + data.message;
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          // CORREÇÃO (Item 4): Removemos o alert()
          feedbackElement.textContent = "Ocorreu um erro. Tente novamente.";
        });
    });
  }
});
