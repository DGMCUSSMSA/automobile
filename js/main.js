// js/main.js

document.addEventListener('DOMContentLoaded', function() {
  // URL del deploy del Google Apps Script
  const deployURL = 'https://script.google.com/macros/s/AKfycbxZ6p-v0FpzpZMlP1QWkuuldCaS1CeZNH_qzUHtxxew3WVGRWkbhm_KHQyMjIqf3mdo/exec';

  // Funzione per recuperare la lista degli operatori
  function fetchOperators() {
    fetch(`${deployURL}?action=getOperators`)
      .then(response => response.json())
      .then(data => {
        const operatorSelect = document.getElementById('operatorSelect');
        operatorSelect.innerHTML = ''; // Svuota le opzioni precedenti
        if (data && data.length > 0) {
          data.forEach(operator => {
            const option = document.createElement('option');
            option.value = operator.email;
            option.textContent = operator.display;
            operatorSelect.appendChild(option);
          });
        } else {
          operatorSelect.innerHTML = '<option value="">Nessun operatore trovato</option>';
        }
      })
      .catch(error => {
        console.error('Errore nel recupero operatori:', error);
        document.getElementById('operatorSelect').innerHTML = '<option value="">Errore nel caricamento</option>';
      });
  }

  // Funzione per recuperare e visualizzare gli appuntamenti
  function fetchAppointments() {
    fetch(`${deployURL}?action=getPrenotazioni`)
      .then(response => response.json())
      .then(data => {
        const tableBody = document.getElementById('appointmentsTableBody');
        tableBody.innerHTML = ''; // Pulisce la tabella
        if (data && data.length > 0) {
          data.forEach(appointment => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${appointment.title}</td>
              <td>${appointment.start}</td>
              <td>${appointment.end}</td>
              <td>${appointment.email}</td>
            `;
            tableBody.appendChild(row);
          });
        } else {
          tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Nessun appuntamento trovato</td></tr>';
        }
      })
      .catch(error => {
        console.error('Errore nel recupero appuntamenti:', error);
        document.getElementById('appointmentsTableBody').innerHTML = '<tr><td colspan="4" class="text-center">Errore nel caricamento</td></tr>';
      });
  }

  // Gestione del submit del form per l'invio della prenotazione
  document.getElementById('prenotazioneForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const prenotazioneData = {
      data: document.getElementById('data').value,
      oraInizio: document.getElementById('oraInizio').value,
      oraFine: document.getElementById('oraFine').value,
      motivoPrenotazione: document.getElementById('motivo').value,
      luogoVisita: document.getElementById('luogo').value,
      email: document.getElementById('email').value,
      // Usa l'operatore selezionato per "nomiOperatori"
      nomiOperatori: document.getElementById('operatorSelect').value,
      stato: "Attiva"
    };

    // Invio della prenotazione tramite POST
    fetch(deployURL, {
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
      document.getElementById('prenotazioneForm').reset();
      // Aggiorna la lista degli appuntamenti dopo l'invio
      fetchAppointments();
    })
    .catch(error => {
      console.error('Errore durante l\'invio della prenotazione:', error);
      alert('Errore durante l\'invio della prenotazione.');
    });
  });

  // Carica operatori e appuntamenti al caricamento della pagina
  fetchOperators();
  fetchAppointments();
});
