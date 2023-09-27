import "../node_modules/jquery/dist/jquery.min.js";
import "../node_modules/select2/dist/js/select2.min.js";

const proteinInput = $('#proteinInput');
const backButton = document.querySelector('.back-button');
let loadedAnalysisIdList = [];
let selectedAnalysis = null;
let allProteins = [];
const getCoverageButton = document.getElementById('getCoverageButton');
const proteinSequencesContainer = document.getElementById('proteinSequences');
let tmp_path = '';

backButton.addEventListener('click', () => {
  let navData = {
    "loadedAnalysisIdList": loadedAnalysisIdList
  }
  window.electronAPI.openHomePage(navData);
});


// Attendez que le document HTML soit entièrement chargé
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  let selectedAnalysisJson = urlParams.get('selectedAnalysis');
  let loadedAnalysisIdListJson = urlParams.get('loadedAnalysisIdList');
  tmp_path = urlParams.get('tmp_path');
  loadedAnalysisIdList = JSON.parse(loadedAnalysisIdListJson);
  
  if (selectedAnalysisJson) {
    selectedAnalysis = JSON.parse(selectedAnalysisJson);
    const runIdElement = document.querySelector('.runID');
    if (runIdElement) {
      runIdElement.textContent = `Analysis: ${selectedAnalysis.name}`;
    }
    
    // Chargez la liste des identifiants de protéines pour l'analyse sélectionnée
    loadProteinList(selectedAnalysis.id, selectedAnalysis.tool);
  }
});

// Fonction asynchrone pour charger la liste des identifiants de protéines pour une analyse donnée
async function loadProteinList(analysisId, tool) {
  try {
    showLoading();
    // Effectuez une requête pour lire un fichier texte contenant les identifiants de protéines
    const proteinListFilePath = `${tmp_path}/${tool}_proteotrace_protein_list_${analysisId}.txt`;
    const response = await fetch(proteinListFilePath);

    if (response.ok) {
      // Lisez le contenu du fichier texte
      const proteinIdsText = await response.text();
      // Séparez les lignes du fichier texte et supprimez les lignes vides
      allProteins = proteinIdsText.split('\n').filter(Boolean);
      // Initialisez la liste déroulante Select2 avec les identifiants de protéines chargés
      initializeSelect2(allProteins);
      // Initialisez la liste déroulante Select2 avec les identifiants de protéines chargés
    } else {
      console.error('Failed to load protein list:', response.status, response.statusText);
    }
    hideLoading();
  } catch (error) {
    console.error('Error loading protein list:', error);
    hideLoading();
  }
}

// Initialisez la liste déroulante Select2 avec les identifiants de protéines
function initializeSelect2(allProteins) {
  allProteins.unshift("--");
  proteinInput.select2({
    data: allProteins,
    placeholder: 'Search a protein',
    minimumInputLength: 3,
  });  
}

function processLogLine(logLine) {
  // Suppression des 4 premiers caractères ("LOG=")
  logLine = logLine.substring(4, logLine.length - 2);

  // Séparation des informations par "@@"
  let infoPairs = logLine.split('@@');

  // Création d'un dictionnaire pour stocker les informations
  let infoDict = {};

  // Remplissage du dictionnaire avec les informations
  for (let j = 0; j < infoPairs.length; j++) {
    let parts = infoPairs[j].split('=');
    if (parts.length === 2) {
      let key = parts[0];
      let value = parts[1];
      infoDict[key] = value;
    }
  }

  return infoDict;
}

function mergedInfoDict(infoDictList) {
  let mergedInfoDictList = []
  for (let infoDict of infoDictList) {
    let found = false;
    if ("PROTEIN_ID" in infoDict) {
      let proteinId = infoDict.PROTEIN_ID;
      

      for (let mDict of mergedInfoDictList) {
        if (mDict.PROTEIN_ID === proteinId) {
          // Fusionner mDict avec infoDict (sauf PROTEIN_ID)
          for (let key in infoDict) {
            if (key !== "PROTEIN_ID") {
              mDict[key] = infoDict[key];
            }
          }
          found = true;
          break;
        }
      }     
    }
    if (!found) {
      mergedInfoDictList.push(infoDict);
    }
  }

  return mergedInfoDictList;
}

async function extractCoverageInfo(dict) {
  if (dict["IDENTIFIED"] === "TRUE" && dict['COVERAGE_FILE']) {
    try {
      let coverageFilePath = dict['COVERAGE_FILE'];
      const response = await fetch(coverageFilePath);

      if (response.ok) {
        const coverageText = await response.text();
        const coverageLines = coverageText.split('\n');
        return {
          header: coverageLines[0].slice(0, -1),
          sequence: coverageLines[1].slice(0, -1),
          coverage_sign: coverageLines[2].slice(0, -1),
        };
      } else {
        console.error('Failed to load coverage file:', response.status, response.statusText);
        return null;
      }     
    } catch (error) {
      console.error('Error fetching coverage:', error);
      return null;
    }
  }
  return null;
}


// Gestionnaire d'événements pour la sélection d'une protéine
getCoverageButton.addEventListener('click', async function() {
  showLoading();
  const selectedProteinDescriptions = proteinInput.val(); // Obtenez les protéines sélectionnées
  if (selectedProteinDescriptions.length > 0) {
      try {
          // Nettoyez les anciens conteneurs de séquence s'il y en a
          proteinSequencesContainer.innerHTML = '';

          let terminalOutput = await window.electronAPI.getCoverage({
              "tool": selectedAnalysis.tool,
              "selectedProteinDescriptions": selectedProteinDescriptions,
              "runID": selectedAnalysis.id,
          });
          console.log(terminalOutput)
          hideLoading();
          let logLines = terminalOutput.split('\n').filter(line => line.startsWith('LOG='));
          let infoDictList = logLines.map(processLogLine);
          let mergedInfoDictList = mergedInfoDict(infoDictList);
          for (let dict of mergedInfoDictList) {
              const protein_coverage_data = await extractCoverageInfo(dict);
              let selectedProteinDescription = dict.PROTEIN_ID;
              displayProteinSequence(protein_coverage_data, selectedProteinDescription);
          }
      } catch (error) {
          hideLoading();
          console.error('Error fetching coverage:', error);
      }
  } else {
      hideLoading();
      console.error('No proteins selected.');
  }
});

// Fonction pour afficher la séquence de protéine
function displayProteinSequence(proteinData, selectedProteinDescriptions) {
  // Créez un conteneur de séquence pour chaque protéine
  const sequenceContainer = document.createElement('div');
  sequenceContainer.classList.add('protein-sequence');

  const sequence_header_h2 = document.createElement('h2');
  sequenceContainer.appendChild(sequence_header_h2);

  const sequenceElement = document.createElement('pre');
  sequenceElement.classList.add('coverage-sequence');
  sequenceContainer.appendChild(sequenceElement);

  // Ajoutez le conteneur de séquence à la section des séquences de protéine
  proteinSequencesContainer.appendChild(sequenceContainer);

  if (sequenceElement) {
      sequenceContainer.style.display = 'block';
      let sequenceHTML = '';
      if (proteinData == null) {
          sequence_header_h2.textContent = `>${selectedProteinDescriptions}`;
          sequenceHTML = 'This protein has not been identified in your analysis';
      }
      else {
          sequence_header_h2.textContent = proteinData.header;
          const sequence = proteinData.sequence;
          const coverageSign = proteinData.coverage_sign;

          for (let i = 0; i < sequence.length; i++) {
              const aminoAcid = sequence[i];
              const coverageChar = coverageSign[i];
              if (coverageChar === '+'){
                  sequenceHTML += `<span class="identified">${aminoAcid}</span>`;
              }
              else {
                  sequenceHTML += `<span>${aminoAcid}</span>`;
              }
          }
      }
      sequenceElement.innerHTML = sequenceHTML;
  }
}

// Fonction pour afficher l'indicateur de chargement
function showLoading() {
  const loadingIndicator = document.getElementById('window');
  const loadingIndicatorSpan = document.querySelector('.window span');
  loadingIndicator.style.display = 'flex';
  loadingIndicatorSpan.style.display = 'block';
}

// Fonction pour cacher l'indicateur de chargement
function hideLoading() {
  const loadingIndicator = document.getElementById('window');
  const loadingIndicatorSpan = document.querySelector('.window span');
  loadingIndicator.style.display = 'none';
  loadingIndicatorSpan.style.display = 'none';
}