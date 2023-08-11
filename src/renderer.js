// Récupération des éléments du DOM
const msForm = document.getElementById('msForm');
const terminalDiv = document.getElementById('terminal');

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
    // Appelle la fonction 'clickSubmit' du processus principal (index.js) en passant les données du formulaire
    const terminalOutput = await window.electronAPI.clickSubmit(formDataObject);

    // Affiche la sortie du terminal dans la div de terminal
    terminalDiv.innerText = terminalOutput;

    // Réinitialiser le formulaire
    msForm.reset();

  } catch (error) {
    // En cas d'erreur, affiche le message d'erreur dans la div de terminal
    terminalDiv.innerText = `An error occurred: ${error.message}\n\n${JSON.stringify(error, null, 2)}`;
  }
});

// Fonction pour gérer la visibilité du champ conditionnel
function toggleField() {
  var select = document.getElementById('tool');
  var folder_result = document.getElementById('folder_result');
  var file_result = document.getElementById('file_result');
   
  if (select.value === 'Ionbot' || select.value === 'Maxquant') {
    file_result.style.display = 'none';
    folder_result.style.display = 'block';
  } else {
    file_result.style.display = 'block';
    folder_result.style.display = 'none';
  }
}