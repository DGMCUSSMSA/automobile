$(document).ready(function(){
  // Nuovo deploy URL del Google Apps Script
  const deployURL = 'https://script.google.com/macros/s/AKfycbztZqbYuSSMW6SvGlXSpW8A24fP1v2NtFgt9KoZiZT8bOIFWh2JKzQv4acMcZCsfhZJmw/exec';
  
  /**
   * Recupera la lista degli operatori e popola il menu a tendina.
   */
  function fetchOperators(){
    $.ajax({
      url: deployURL,
      dataType: 'jsonp',
      data: { action: 'getOperators' },
      success: function(data){
        var operatorSelect = $('#operatorSelect');
        operatorSelect.empty();
        if(data && data.length > 0){
          $.each(data, function(i, op){
            operatorSelect.append($('<option>', { value: op.email, text: op.display }));
          });
        } else {
          operatorSelect.append($('<option>', { value: '', text: 'Nessun operatore trovato' }));
        }
      },
      error: function(){
        $('#operatorSelect').html('<option value="">Errore nel caricamento</option>');
      }
    });
  }
  
  /**
   * Recupera e visualizza gli appuntamenti in una tabella.
   */
  function fetchAppointments(){
    $.ajax({
      url: deployURL,
      dataType: 'jsonp',
      data: { action: 'getPrenotazioni' },
      success: function(data){
        var tableBody = $('#appointmentsTableBody');
        tableBody.empty();
        if(data && data.length > 0){
          $.each(data, function(i, app){
            var row = $('<tr>');
            row.append($('<td>').text(app.title));
            row.append($('<td>').text(app.start));
            row.append($('<td>').text(app.end));
            row.append($('<td>').text(app.email));
            tableBody.append(row);
          });
        } else {
          tableBody.html('<tr><td colspan="4" class="text-center">Nessun appuntamento trovato</td></tr>');
        }
      },
      error: function(){
        $('#appointmentsTableBody').html('<tr><td colspan="4" class="text-center">Errore nel caricamento</td></tr>');
      }
    });
  }
  
  /**
   * Gestisce il submit del form per inviare una nuova prenotazione.
   * I dati del form vengono convertiti in una stringa JSON, poi URI-encoded e inviati come parametro "payload".
   */
  $('#prenotazioneForm').on('submit', function(e){
    e.preventDefault();
    
    var prenotazioneData = {
      data: $('#data').val(),
      oraInizio: $('#oraInizio').val(),
      oraFine: $('#oraFine').val(),
      motivoPrenotazione: $('#motivo').val(),
      luogoVisita: $('#luogo').val(),
      email: $('#email').val(),
      nomiOperatori: $('#operatorSelect').val(),
      stato: "Attiva"
    };
    
    // Converti l'oggetto in JSON e codificalo per l'URL
    var payload = encodeURIComponent(JSON.stringify(prenotazioneData));
    
    $.ajax({
      url: deployURL,
      dataType: 'jsonp',
      data: {
        action: 'aggiungiPrenotazione',
        payload: payload
      },
      success: function(data){
        alert('Risultato: ' + data.message);
        $('#prenotazioneForm')[0].reset();
        fetchAppointments();
      },
      error: function(){
        alert('Errore durante l\'invio della prenotazione.');
      }
    });
  });
  
  // Carica operatori e appuntamenti al caricamento della pagina
  fetchOperators();
  fetchAppointments();
});
