// Récupération des éléments du DOM
const msForm = document.getElementById('msForm');
const loadedAnalysisDiv = document.getElementById('loaded-analysis');
const dialogBox = document.querySelector('.dialog-box');
const dialogBoxOkButton = document.querySelector('.dialog-box-content button');

// Appelle la fonction toggleField() lors du chargement initial de la page
document.addEventListener('DOMContentLoaded', toggleField);

// Événement lorsqu'un formulaire est soumis
msForm.addEventListener('submit', async (event) => {
  // Empêche le formulaire de se rafraîchir lorsqu'il est soumis
  event.preventDefault();
  // Récupère les valeurs du formulaire
  const formData = new FormData(event.target);
  const formDataObject = Object.fromEntries(formData.entries());
  formDataObject.file_database = formDataObject.file_database.path;

  if (formDataObject.tool === 'Proline') {
    formDataObject.file_result = formDataObject.file_result.path;
    formDataObject.folder_result = null; 
    console.log(formDataObject.file_result);  
  } 
  
  else if (formDataObject.tool === 'Ionbot' || formDataObject.tool === 'Maxquant') {
    formDataObject.folder_result = formDataObject.folder_result.path.split('\\').slice(0, -1).join('\\');
    console.log(formDataObject.folder_result);
    formDataObject.file_result = null;
  }

  try {
    // Afficher un chargement pendant l'exécution
    showLoading();

    // Appelle la fonction 'clickSubmit' du processus principal (index.js) en passant les données du formulaire
    const terminalOutput = await window.electronAPI.clickSubmit(formDataObject);

    // Cacher le chargement une fois que l'exécution est terminée
    hideLoading();

    // Afficher une boîte de dialogue de succès
    showSuccessDialog();

    // Créer un nouvel élément li avec le nom de l'analyse
    const newListItem = document.createElement('li');
    newListItem.textContent = formDataObject.name;

    // Ajouter le nouvel élément à la liste
    loadedAnalysisDiv.appendChild(newListItem);

    // Réinitialiser le formulaire
    msForm.reset();
    
  } catch (error) {
    hideLoading();
    // En cas d'erreur, affiche le message d'erreur dans la div de terminal
    loadedAnalysisDiv.innerText = `An error occurred: ${error.message}\n\n${JSON.stringify(error, null, 2)}`;
  }
});

dialogBoxOkButton.addEventListener('click', () => {
  dialogBox.style.display = 'none';
  const mainDiv = document.getElementById('window');
  // Masquer la div window grise
  mainDiv.style.display = 'none';
});

// Fonction pour afficher l'indicateur de chargement
function showLoading() {
  const loadingIndicator = document.getElementById('window');
  const loadingIndicatorSpan = document.querySelector('.window span');
  loadingIndicator.style.display = 'block';
  loadingIndicatorSpan.style.display = 'block';
}

// Fonction pour masquer l'indicateur de chargement
function hideLoading() {
  const loadingIndicator = document.querySelector('.window span');
  loadingIndicator.style.display = 'none';
}

function showSuccessDialog() {
  const dialogBox = document.querySelector('.dialog-box');
  dialogBox.style.display = 'block';
}

// Fonction pour gérer la visibilité du champ conditionnel
function toggleField() {
  var select = document.getElementById('tool');
  var folder_result = document.getElementById('folder_result');
  var file_result = document.getElementById('file_result');
   
  if (select.value === 'Ionbot' || select.value === 'Maxquant') {
    file_result.style.display = 'none';
    folder_result.style.display = 'flex';
  } else {
    file_result.style.display = 'flex';
    folder_result.style.display = 'none';
  }
}