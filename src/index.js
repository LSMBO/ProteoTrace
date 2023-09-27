// Importation des modules Electron nécessaires
const { app, BrowserWindow, ipcMain } = require('electron');

// Importation du module 'path' pour gérer les chemins de fichiers
const path = require('path');
const tmp_path = path.join(__dirname, '..', 'tmp');

// Importation du module 'fs' (file system) pour accéder aux fonctionnalités du système de fichiers
const fs = require('fs');

// Importation du module 'spawn' du sous-processus de Node.js pour exécuter des commandes shell
const { spawn } = require('child_process');

// Définition d'une variable booléenne 'isDev' pour vérifier si l'application est en mode développement ou production
const isDev = process.env.NODE_ENV == 'development';

// Fonction pour créer la fenêtre de l'application
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    title: "ProteoTrace",
    webPreferences: {
      nodeIntegration: true, // Autorise l'utilisation de require() dans le processus de rendu
      preload: path.join(__dirname, 'preload.js'), // Charge le script preload.js dans le processus de rendu
    },
  });

  // Charge l'index.html dans la fenêtre principale
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Ouvre la fenêtre en plein écran
  mainWindow.maximize();

  // Ouvre les outils de développement si l'application est en mode développement
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  ipcMain.on('open-coverage-page', (event, navData) => {
    let selectedAnalysis = navData.selectedAnalysis;
    let loadedAnalysisIdList = navData.loadedAnalysisIdList;
    mainWindow.loadFile(
      path.join(__dirname, 'coverage.html'), 
      { 
        query: { 
          tmp_path: tmp_path,
          selectedAnalysis: JSON.stringify(selectedAnalysis),
          loadedAnalysisIdList: JSON.stringify(loadedAnalysisIdList),
          } 
      }
    );
  }),
  ipcMain.on('open-home-page', (event, navData) => {
    let loadedAnalysisIdList = navData.loadedAnalysisIdList;
    mainWindow.loadFile(
      path.join(__dirname, 'index.html'), 
      { query: { 
        tmp_path: tmp_path,
        loadedAnalysisIdList: JSON.stringify(loadedAnalysisIdList) 
      } }
    );
  });
};

// Fonction pour exécuter le script Python avec les arguments spécifiés
const runPythonScriptMain = (formData) => {
  return new Promise((resolve, reject) => {
    const name = formData.name;
    const tool = formData.tool;
    const database = formData.file_database;
    let result;

    if (formData.tool === 'Proline') {
      result = formData.file_result;
    } else if (formData.tool === 'Ionbot' || formData.tool === 'Maxquant') {
      result = formData.folder_result;
    }
    const appPath = app.getAppPath();
    const scriptPath = path.join(appPath, 'src', 'main.py');


    // Exécute le script Python 'main.py' avec les arguments spécifiés
    const pythonPath = path.join(__dirname, '..', 'python', 'python.exe');
    const pythonProcess = spawn(pythonPath, [scriptPath, `--tmp-path=${tmp_path}`, `--name=${name}`, `--tool=${tool}`, `--result=${result}`, `--database=${database}`]);

    // Initialise une variable pour stocker la sortie du terminal
    let terminalOutput = '';

    // Événement pour gérer les données renvoyées par le processus Python (stdout)
    pythonProcess.stdout.on('data', (data) => {
      terminalOutput += data.toString();
      console.log(terminalOutput)
    });

    // Événement pour gérer les erreurs renvoyées par le processus Python (stderr)
    pythonProcess.stderr.on('data', (data) => {
      terminalOutput += data.toString();
    });

    // Événement pour gérer la fermeture du processus Python (code de sortie)
    pythonProcess.on('close', (code) => {
      terminalOutput += `Script execution finished with code ${code}`;
      // Résout la promesse avec la sortie du terminal
      resolve(terminalOutput);
    });
  });
};

const runPythonScriptGetCoverage = (data) => {
  return new Promise((resolve, reject) => {
    const selectedProteinDescriptions = data.selectedProteinDescriptions || []; // Utilisez un tableau vide par défaut
    const tool = data.tool;
    const runID = data.runID;
    const appPath = app.getAppPath();
    const scriptPath = path.join(appPath, 'src', 'main.py');
    const pythonPath = path.join(__dirname, '..', 'python', 'python.exe');


    // Créez un tableau pour stocker les arguments
    const pythonArgs = [
      scriptPath,
      `--tmp-path=${tmp_path}`,
      `--runID=${runID}`,
      `--tool=${tool}`,
    ];

    // Ajoutez l'argument pour chaque description de protéine sélectionnée
    selectedProteinDescriptions.forEach((description) => {
      pythonArgs.push(`--protein-descriptions="${description}"`);
    });

    // Exécutez le script Python avec les arguments spécifiés
    const pythonProcess = spawn(pythonPath, pythonArgs);

    // Initialisez une variable pour stocker la sortie du terminal
    let terminalOutput = '';

    // Événement pour gérer les données renvoyées par le processus Python (stdout)
    pythonProcess.stdout.on('data', (data) => {
      terminalOutput += data.toString();
      console.log(terminalOutput)
    });

    // Événement pour gérer les erreurs renvoyées par le processus Python (stderr)
    pythonProcess.stderr.on('data', (data) => {
      terminalOutput += data.toString();
    });

    // Événement pour gérer la fermeture du processus Python (code de sortie)
    pythonProcess.on('close', (code) => {
      terminalOutput += `Script execution finished with code ${code}`;
      // Résout la promesse avec la sortie du terminal
      resolve(terminalOutput);
    });
  });
};


// Fonction pour gérer l'exécution du script Python avec les données du formulaire
async function executeScriptMain(formDataObject) {
  try {
    const terminalOutput = await runPythonScriptMain(formDataObject);
    return terminalOutput;
  } catch (error) {
    throw new Error(`An error occurred: ${error.message}`);
  }
}

async function executeScriptGetCoverage(data) {
  try {
    const terminalOutput = await runPythonScriptGetCoverage(data);
    return terminalOutput;
  } catch (error) {
    throw new Error(`An error occurred: ${error.message}`);
  }
}

// Événement lorsqu'Electron est prêt à créer des fenêtres
app.whenReady().then(() => {
  // Définir le gestionnaire pour l'événement 'click-submit' ici
  ipcMain.handle('click-submit', async (event, formDataObject) => {
    const terminalOutput = await executeScriptMain(formDataObject);
    return terminalOutput;
  });

  // Définir le gestionnaire pour l'événement 'get-coverage' ici
  ipcMain.handle('get-coverage', async (event, args) => {
    // Placez ici la logique pour obtenir la couverture (coverage)
    const terminalOutput = await executeScriptGetCoverage(args);
    return terminalOutput;
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});


// Quitte l'application lorsque toutes les fenêtres sont fermées (sauf sur macOS)
app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    // Supprimer tous les fichiers du répertoire tmp/
    const tmpDir = path.join(__dirname, '../tmp');
    
    try {
      const files = await fs.promises.readdir(tmpDir);
      
      for (const file of files) {
        const filePath = path.join(tmpDir, file);
        await fs.promises.unlink(filePath);
      }
      app.quit();
    } catch (err) {
      console.error('Erreur lors de la suppression des fichiers temporaires :', err);
      app.quit();
    }
  }
});



// Recrée une fenêtre lorsque l'icône de l'application est cliquée et aucune fenêtre n'est ouverte (sur macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.commandLine.appendSwitch('no-sandbox');