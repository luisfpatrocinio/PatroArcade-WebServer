document.addEventListener("DOMContentLoaded", () => {
  const homeButton = document.getElementById("home-button");

  if (homeButton) {
    homeButton.addEventListener("click", (event) => {
      // Impede o link de navegar para #
      event.preventDefault();

      // Ação que antes estava "in-line"
      window.location.href = "/";
    });
  }
});
