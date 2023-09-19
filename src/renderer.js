// Récupération des éléments du DOM
const msForm = document.getElementById('msForm');
const loadedAnalysisDiv = document.getElementById('loaded-analysis');
const dialogBox = document.querySelector('.dialog-box');
const dialogBoxOkButton = document.querySelector('.dialog-box-content button');
const coverageBtn = document.getElementById('coverage-nav-btn');
const ptmsBtn = document.getElementById('ptms-nav-btn');
let selectedAnalysis = null;
let loadedAnalysisIdList = []


coverageBtn.addEventListener('click', () => {
  window.electronAPI.openCoveragePage(selectedAnalysis);
});


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
  } 
  
  else if (formDataObject.tool === 'Ionbot' || formDataObject.tool === 'Maxquant') {
    formDataObject.folder_result = formDataObject.folder_result.path.split('\\').slice(0, -1).join('\\');
    formDataObject.file_result = null;
  }

  try {
    // Afficher un chargement pendant l'exécution
    showLoading();

    // Appelle la fonction 'clickSubmit' du processus principal (index.js) en passant les données du formulaire
    const terminalOutput = await window.electronAPI.clickSubmit(formDataObject);
    console.log(terminalOutput)
    const runId = terminalOutput
      .split('\n')
      .filter(line => line.startsWith('RUN_ID='))
      .map(line => line.split('=')[1])
      .join('');

    // Cacher le chargement une fois que l'exécution est terminée
    hideLoading();

    // Afficher une boîte de dialogue de succès
    showSuccessDialog();

    // Appeler la fonction pour ajouter un nouvel élément à la liste
    addNewAnalysisToList(formDataObject.name, formDataObject.tool, runId);

    // Réinitialiser le formulaire
    msForm.reset();
    
  } catch (error) {
    hideLoading();
    // En cas d'erreur, affiche le message d'erreur dans la div de terminal
    loadedAnalysisDiv.innerText = `An error occurred: ${error.message}\n\n${JSON.stringify(error, null, 2)}`;
  }
});


// Lorsque vous ajoutez un nouvel élément <li> à la liste
function addNewAnalysisToList(name, tool, run_id) {
  const analysisSelection = document.querySelectorAll('.loaded-analysis-box ul li');
  const newListItem = document.createElement('li');
  newListItem.textContent = `${name} (${tool})`;
  newListItem.setAttribute('data-analysis-id', run_id);
  
  // Attachez le gestionnaire d'événements 'click' à ce nouvel élément <li>
  newListItem.addEventListener('click', () => {
    const isSelected = newListItem.classList.contains('analysis_selected');
    
    analysisSelection.forEach((otherLi) => {
      if (newListItem != otherLi) {
        otherLi.classList.remove('analysis_selected');
      }
    });
    
    if (!isSelected) {
      newListItem.classList.add('analysis_selected');
      const selectedAnalysisId = newListItem.getAttribute('data-analysis-id');
      selectedAnalysis = loadedAnalysisIdList.find((analysis) => analysis.id === selectedAnalysisId);
      coverageBtn.disabled = false;
      ptmsBtn.disabled = false;
    }
    
    if (isSelected) {
      newListItem.classList.remove('analysis_selected');
      coverageBtn.disabled = true;
      ptmsBtn.disabled = true;
    }
  });
  
  loadedAnalysisDiv.appendChild(newListItem);
  loadedAnalysisIdList.push(
    {
      'id' : run_id,
      'name' : name,
      'tool' : tool
    }
  );
}


dialogBoxOkButton.addEventListener('click', () => {
  dialogBox.style.display = 'none';
  const mainDiv = document.getElementById('window');
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