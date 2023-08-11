// Récupération des éléments du DOM
const coverageButton = document.getElementById('coverageButton');
const ptmsButton = document.getElementById('ptmsButton');
const backButton = document.getElementById('backButton'); // Nouveau bouton

// Événement lorsqu'un bouton de couverture est cliqué
coverageButton.addEventListener('click', () => {
  // Rediriger vers la page de couverture (coverage.html)
  window.location.href = 'coverage.html';
});

// Événement lorsqu'un bouton de PTMs est cliqué
ptmsButton.addEventListener('click', () => {
  // Rediriger vers la page de PTMs (ptms.html)
  window.location.href = 'ptms.html';
});

// Événement lorsqu'un bouton "Précédent" est cliqué
backButton.addEventListener('click', () => {
  // Revenir à la page précédente
  window.history.back();
});