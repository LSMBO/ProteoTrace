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
  let navData = {
    "selectedAnalysis": selectedAnalysis,
    "loadedAnalysisIdList": loadedAnalysisIdList
  }
  window.electronAPI.openCoveragePage(navData);
});



document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
  let loadedAnalysisIdListJson = urlParams.get('loadedAnalysisIdList');
  if (loadedAnalysisIdListJson) {
    const newLoadedAnalysisList = JSON.parse(loadedAnalysisIdListJson);
    newLoadedAnalysisList.forEach((analysis) => {
      let analysisExists = false;
      loadedAnalysisIdList.forEach((existingAnalysis) => {
        if (existingAnalysis.id === analysis.id) {
          analysisExists = true;
        }
      });
      if (!analysisExists) {
        loadedAnalysisIdList.push(analysis);
      }
    });
  }
  loadedAnalysisIdList.forEach((analysis) => {
    addNewAnalysisToList(analysis.name, analysis.tool, analysis.id);
  });

  toggleField()
});



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


function addNewAnalysisToList(name, tool, run_id) {
  const loadedAnalysisDiv = document.getElementById('loaded-analysis');
  const newListItem = document.createElement('li');
  newListItem.textContent = `${name} (${tool})`;
  newListItem.setAttribute('data-analysis-id', run_id);
  loadedAnalysisDiv.appendChild(newListItem);
  const analysisSelection = loadedAnalysisDiv.querySelectorAll('ul li');
  // Supprime les anciens gestionnaires d'événements clic
  analysisSelection.forEach((li) => {
    li.removeEventListener('click', handleAnalysisClick);
  });

  // Crée un nouvel gestionnaire d'événements clic pour chaque élément
  analysisSelection.forEach((li) => {
    li.addEventListener('click', handleAnalysisClick);
  });

  loadedAnalysisIdList.push({
    'id': run_id,
    'name': name,
    'tool': tool
  });
}

// Gestionnaire d'événements pour gérer la sélection d'analyses
function handleAnalysisClick() {
  const isSelected = this.classList.contains('analysis_selected');
  const analysisSelection = loadedAnalysisDiv.querySelectorAll('ul li');
  analysisSelection.forEach((li) => {
    if (this !== li) {
      li.classList.remove('analysis_selected');
    }
  });

  if (!isSelected) {
    this.classList.add('analysis_selected');
    const selectedAnalysisId = this.getAttribute('data-analysis-id');
    selectedAnalysis = loadedAnalysisIdList.find((analysis) => analysis.id === selectedAnalysisId);
    coverageBtn.disabled = false;
    //ptmsBtn.disabled = false;
  } else {
    this.classList.remove('analysis_selected');
    coverageBtn.disabled = true;
    //ptmsBtn.disabled = true;
  }
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
  loadingIndicator.style.display = 'flex';
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