import "../node_modules/jquery/dist/jquery.min.js";
import "../node_modules/select2/dist/js/select2.min.js";

const proteinInput = $('#proteinInput');
let selectedAnalysisJson = null;
let selectedAnalysis = null;

// Attendez que le document HTML soit entièrement chargé
document.addEventListener('DOMContentLoaded', () => {
  // Récupérez les paramètres d'URL
  const urlParams = new URLSearchParams(window.location.search);
  selectedAnalysisJson = urlParams.get('selectedAnalysis');

  // Vérifiez si le paramètre 'selectedAnalysis' est défini dans l'URL
  if (selectedAnalysisJson) {
    // Convertissez la chaîne JSON en un objet JavaScript
    selectedAnalysis = JSON.parse(selectedAnalysisJson);
    // Affichez l'ID de l'analyse dans la page
    const runIdElement = document.querySelector('.runID');
    if (runIdElement) {
      runIdElement.textContent = `Analysis ID: ${selectedAnalysis.id}`;
    }

    // Chargez la liste des identifiants de protéines pour l'analyse sélectionnée
    loadProteinList(selectedAnalysis.id, selectedAnalysis.tool);
  }
});

// Fonction asynchrone pour charger la liste des identifiants de protéines pour une analyse donnée
async function loadProteinList(analysisId, tool) {
  try {
    console.log(`../tmp/${tool}_proteotrace_protein_list_${analysisId}.txt`)
    // Effectuez une requête pour lire un fichier texte contenant les identifiants de protéines
    const response = await fetch(`../tmp/${tool}_proteotrace_protein_list_${analysisId}.txt`);

    if (response.ok) {
      // Lisez le contenu du fichier texte
      const proteinIdsText = await response.text();
      // Séparez les lignes du fichier texte et supprimez les lignes vides
      const allProteins = proteinIdsText.split('\n').filter(Boolean);
      // Initialisez la liste déroulante Select2 avec les identifiants de protéines chargés
      initializeSelect2(allProteins);
      // Initialisez la liste déroulante Select2 avec les identifiants de protéines chargés
    } else {
      console.error('Failed to load protein list:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error loading protein list:', error);
  }
}

// Initialisez la liste déroulante Select2 avec les identifiants de protéines
function initializeSelect2(allProteins) {
  proteinInput.select2({
    data: allProteins,
    placeholder: 'Search a protein',
  });
}

// Gestionnaire d'événements pour la sélection d'une protéine
proteinInput.on('change', async function() {
  let selectedProteinDescriptions = $(this).val();

  // Si selectedProteinDescriptions n'est pas un tableau, convertissez-le en tableau
  if (!Array.isArray(selectedProteinDescriptions)) {
    selectedProteinDescriptions = [selectedProteinDescriptions];
  }

  console.log('Selected Protein Descriptions:', selectedProteinDescriptions);
  console.log('selectedAnalysis:', selectedAnalysis);

  try {
    let terminalOutput = await window.electronAPI.getCoverage({
      "tool": selectedAnalysis.tool,
      "selectedProteinDescriptions": selectedProteinDescriptions,
      "runID": selectedAnalysis.id,
    });
    console.log(terminalOutput);
  } catch (error) {
    console.error('Error fetching coverage:', error);
  }
});
