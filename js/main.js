
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('prenotazioneForm');
  form.addEventListener('submit', function(event) {
    event.preventDefault();

    // Raccogliamo i dati del form
    const prenotazioneData = {
      data: document.getElementById('data').value,
      oraInizio: document.getElementById('oraInizio').value,
      oraFine: document.getElementById('oraFine').value,
      motivoPrenotazione: document.getElementById('motivo').value,
      luogoVisita: document.getElementById('luogo').value,
      email: document.getElementById('email').value,
      nomiOperatori: document.getElementById('operatori').value,
      stato: "Attiva"  // Stato predefinito
    };

    // Inserisci qui l'URL del tuo Google Apps Script pubblicato come Web App
    const scriptURL = 'URL_DEL_TUO_SCRIPT';

    // Effettua la chiamata AJAX con fetch
    fetch(scriptURL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(prenotazioneData)
    })
    .then(response => response.json())
    .then(data => {
      alert('Risultato: ' + data.message);
      form.reset();
    })
    .catch(error => {
      console.error('Errore:', error);
      alert('Errore durante l\'invio della prenotazione.');
    });
  });
});
