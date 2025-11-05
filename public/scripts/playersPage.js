document.addEventListener("DOMContentLoaded", () => {
  const homeButton = document.getElementById("home-button");

  if (homeButton) {
    homeButton.addEventListener("click", (event) => {
      event.preventDefault();
      // Em vez de 'history.back()', este botão deve levar sempre ao Início
      window.location.href = "/";
    });
  }
});
