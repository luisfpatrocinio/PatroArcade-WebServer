document.addEventListener("DOMContentLoaded", () => {
  const homeButton = document.getElementById("home-button");

  if (homeButton) {
    homeButton.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "/";
    });
  }
});
