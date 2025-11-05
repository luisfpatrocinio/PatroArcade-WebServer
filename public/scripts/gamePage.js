// Espera o conteúdo da página carregar
document.addEventListener('DOMContentLoaded', () => {
  const backButton = document.getElementById('back-button');

  if (backButton) {
    backButton.addEventListener('click', (event) => {
      // Impede o link de tentar navegar para #
      event.preventDefault(); 
      
      // Executa a ação que antes estava "in-line"
      window.history.back();
    });
  }
});