// Importation des modules Electron nécessaires
const { app, BrowserWindow, ipcMain } = require('electron');

// Importation du module 'path' pour gérer les chemins de fichiers
const path = require('path');

// Importation du module 'fs' (file system) pour accéder aux fonctionnalités du système de fichiers
const fs = require('fs');

// Importation du module 'spawn' du sous-processus de Node.js pour exécuter des commandes shell
const { spawn } = require('child_process');

// Définition d'une variable booléenne 'isDev' pour vérifier si l'application est en mode développement ou production
const isDev = process.env.NODE_ENV !== 'production';

// Fonction pour créer la fenêtre de l'application
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: isDev ? 1200 : 800,
    height: 600,
    title: "ProteoTrace",
    webPreferences: {
      nodeIntegration: true, // Autorise l'utilisation de require() dans le processus de rendu
      preload: path.join(__dirname, 'preload.js'), // Charge le script preload.js dans le processus de rendu
    },
  });

  // Charge l'index.html dans la fenêtre principale
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Ouvre les outils de développement si l'application est en mode développement
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  ipcMain.on('open-coverage-page', (event, selectedAnalysis) => {
    mainWindow.loadFile(
      path.join(__dirname, 'coverage.html'), 
      { 
        query: { selectedAnalysis: JSON.stringify(selectedAnalysis) } 
      }
    );
  });
};

// Fonction pour exécuter le script Python avec les arguments spécifiés
const runPythonScript = (formData) => {
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

    const scriptPath = path.join(__dirname, 'main.py');

    // Exécute le script Python 'main.py' avec les arguments spécifiés
    const pythonProcess = spawn('python', [scriptPath, `--name=${name}`, `--tool=${tool}`, `--result=${result}`, `--database=${database}`]);

    // Initialise une variable pour stocker la sortie du terminal
    let terminalOutput = '';

    // Événement pour gérer les données renvoyées par le processus Python (stdout)
    pythonProcess.stdout.on('data', (data) => {
      terminalOutput += data.toString();
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
async function executeScript(formDataObject) {
  try {
    const terminalOutput = await runPythonScript(formDataObject);
    return terminalOutput;
  } catch (error) {
    throw new Error(`An error occurred: ${error.message}`);
  }
}

// Événement lorsqu'Electron est prêt à créer des fenêtres
app.whenReady().then(() => {
  // Définir le gestionnaire pour l'événement 'click-submit' ici
  ipcMain.handle('click-submit', async (event, formDataObject) => {
    console.log('Received form data in ipcMain:', formDataObject);
    const terminalOutput = await executeScript(formDataObject);
    return terminalOutput;
  });
  

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});



// Quitte l'application lorsque toutes les fenêtres sont fermées (sauf sur macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Supprimer tous les fichiers du répertoire tmp/
    const tmpDir = path.join(__dirname, '../tmp');
    
    fs.readdir(tmpDir, (err, files) => {
      if (err) {
        console.error('Erreur lors de la lecture du répertoire tmp/', err);
        app.quit();
        return;
      }

      files.forEach(file => {
        const filePath = path.join(tmpDir, file);
        fs.unlink(filePath, err => {
          if (err) {
            console.error(`Erreur lors de la suppression du fichier ${filePath}`, err);
          }
        });
      });
      
      app.quit();
    });
  }
});


// Recrée une fenêtre lorsque l'icône de l'application est cliquée et aucune fenêtre n'est ouverte (sur macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.commandLine.appendSwitch('no-sandbox');