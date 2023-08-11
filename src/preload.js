// preload.js

// Importez l'API Electron pour pouvoir y accéder dans ce script
const { contextBridge, ipcRenderer } = require('electron');

// Exposez uniquement les fonctions que vous souhaitez rendre disponibles dans le processus de rendu
// Dans ce cas, nous exposons la fonction 'clickSubmit' pour pouvoir l'appeler depuis le processus de rendu
contextBridge.exposeInMainWorld('electronAPI', {
  clickSubmit: async (args) => {
    try {
      // Utilisez ipcRenderer.invoke pour appeler la fonction 'click-submit' du processus principal
      const terminalOutput = await ipcRenderer.invoke('click-submit', args);
      return terminalOutput;
    } catch (error) {
      // En cas d'erreur, rejet de la promesse avec le message d'erreur
      throw new Error(`An error occurred: ${error.message}`);
    }
  }
});

window.addEventListener('DOMContentLoaded', () => {
});
