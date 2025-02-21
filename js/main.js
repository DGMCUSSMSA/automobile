$(document).ready(function(){
  // Deploy URL del Google Apps Script
  const deployURL = 'https://script.google.com/macros/s/AKfycbyHH6t6GUVvrQxR0fD8voVQKVzx5-oNas06rT1njf_XBJXtwK-ebq7CTpUfirGAD1yuiw/exec';
  
  // Variabile globale per salvare i dati degli operatori (array di oggetti {display, email})
  let globalOperators = [];

  /**
   * Recupera la lista degli operatori e popola:
   * - Il select del form di creazione (#operatorSelect) (se usato come selezione singola)
   * - Il multi-select del modal di modifica (#editOperatorSelect)
   */
  function fetchOperators(){
    $.ajax({
      url: deployURL,
      dataType: 'jsonp',
      data: { action: 'getOperators' },
      success: function(data){
        globalOperators = data; // Salva per eventuali lookup
        // Popola il select per la creazione (se si usa una selezione singola)
        let $operatorSelect = $('#operatorSelect');
        $operatorSelect.empty();
        if(data && data.length > 0){
          $.each(data, function(i, op){
            $operatorSelect.append($('<option>', {
              value: op.email,
              text: op.display
            }));
          });
        } else {
          $operatorSelect.append($('<option>', { value: '', text: 'Nessun operatore trovato' }));
        }
        // Popola il multi-select per il modal di modifica
        let $editSelect = $('#editOperatorSelect');
        $editSelect.empty();
        if(data && data.length > 0){
          $.each(data, function(i, op){
            $editSelect.append($('<option>', {
              value: op.email,
              text: op.display
            }));
          });
        } else {
          $editSelect.append($('<option>', { value: '', text: 'Nessun operatore trovato' }));
        }
      },
      error: function(){
        $('#operatorSelect, #editOperatorSelect').html('<option value="">Errore nel caricamento</option>');
      }
    });
  }

  /**
   * Recupera la lista degli appuntamenti e la visualizza nella tabella.
   * Aggiunge anche un listener per aprire il modal di modifica al click della riga.
   */
  function fetchAppointments(){
    $.ajax({
      url: deployURL,
      dataType: 'jsonp',
      data: { action: 'getPrenotazioni' },
      success: function(data){
        let $tableBody = $('#appointmentsTableBody');
        $tableBody.empty();
        if(data && data.length > 0){
          $.each(data, function(i, app){
            let $row = $('<tr>').addClass('appointmentRow').data('appointment', app);
            $row.append($('<td>').text(app.title));
            $row.append($('<td>').text(app.start));
            $row.append($('<td>').text(app.end));
            $row.append($('<td>').text(app.email));
            $tableBody.append($row);
          });
          // Aggiungi il listener per il click su ogni riga
          $('.appointmentRow').on('click', function(){
            let appData = $(this).data('appointment');
            openEditModal(appData);
          });
        } else {
          $tableBody.html('<tr><td colspan="4" class="text-center">Nessun appuntamento trovato</td></tr>');
        }
      },
      error: function(){
        $('#appointmentsTableBody').html('<tr><td colspan="4" class="text-center">Errore nel caricamento</td></tr>');
      }
    });
  }

  /**
   * Aggiorna il campo email del modal (#editOperatorEmail) in base agli operatori selezionati nel multi-select.
   */
  function updateEditOperatorEmail(){
    let selectedEmails = [];
    $('#editOperatorSelect option:selected').each(function(){
      selectedEmails.push($(this).val());
    });
    $('#editOperatorEmail').val(selectedEmails.join(', '));
  }
  
  // Aggiunge il listener per aggiornare il campo email in tempo reale quando cambia la selezione
  $('#editOperatorSelect').on('change', updateEditOperatorEmail);
  
  /**
   * Apre il modal di modifica, pre-compilando i campi con i dati dell'appuntamento selezionato.
   */
  function openEditModal(appData){
    // Pre-compila i campi del modal. Supponiamo che appData.start e appData.end siano nel formato "yyyy-MM-ddTHH:mm"
    let startParts = appData.start.split('T');
    let endParts = appData.end.split('T');
    $('#editDate').val(startParts[0]);
    $('#editOraInizio').val(startParts[1]);
    $('#editOraFine').val(endParts[1]);
    // Supponiamo che il titolo sia formattato come "operatori - motivo - luogo"
    let parts = appData.title.split(" - ");
    $('#editMotivo').val(parts[1] || '');
    $('#editLuogo').val(parts[2] || '');
    // Salva l'ID dell'appuntamento (assumendo che appData.id esista)
    $('#editId').val(appData.id);
    
    // Se appData.nomiOperatori è una stringa separata da virgola, imposta la selezione nel multi-select
    let operatorNames = appData.nomiOperatori ? appData.nomiOperatori.split(',') : [];
    operatorNames = operatorNames.map(function(n){ return n.trim(); });
    
    // Imposta la selezione in base al testo dell'opzione (che rappresenta il nome)
    $('#editOperatorSelect option').each(function(){
      let optionText = $(this).text().trim();
      if(operatorNames.indexOf(optionText) !== -1){
        $(this).prop('selected', true);
      } else {
        $(this).prop('selected', false);
      }
    });
    
    // Aggiorna il campo email in base agli operatori selezionati
    updateEditOperatorEmail();
    
    // Mostra il modal (assumendo Bootstrap)
    $('#editModal').modal('show');
  }
  
  /**
   * Gestione del submit del form per la creazione di una nuova prenotazione.
   */
  $('#prenotazioneForm').on('submit', function(e){
    e.preventDefault();
    
    let prenotazioneData = {
      data: $('#data').val(),
      oraInizio: $('#oraInizio').val(),
      oraFine: $('#oraFine').val(),
      motivoPrenotazione: $('#motivo').val(),
      luogoVisita: $('#luogo').val(),
      email: $('#email').val(),
      // Se vuoi che anche la creazione supporti più operatori, usa un multi-select; altrimenti, puoi usare il select singolo.
      nomiOperatori: $('#operatorSelect').find('option:selected')
                         .map(function(){ return $(this).text().trim(); })
                         .get()
                         .join(', '),
      stato: "Attiva"
    };
    
    $.ajax({
      url: deployURL,
      dataType: 'jsonp',
      data: {
        action: 'aggiungiPrenotazione',
        payload: encodeURIComponent(JSON.stringify(prenotazioneData))
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
  
  /**
   * Gestione del submit del form di modifica dell'appuntamento.
   */
  $('#editForm').on('submit', function(e){
    e.preventDefault();
    
    let editData = {
      id: $('#editId').val(),
      data: $('#editDate').val(),
      oraInizio: $('#editOraInizio').val(),
      oraFine: $('#editOraFine').val(),
      motivoPrenotazione: $('#editMotivo').val(),
      luogoVisita: $('#editLuogo').val(),
      email: $('#editOperatorEmail').val(),
      nomiOperatori: $('#editOperatorSelect').find('option:selected')
                        .map(function(){ return $(this).text().trim(); })
                        .get()
                        .join(', '),
      stato: "Attiva"
    };
    
    $.ajax({
      url: deployURL,
      dataType: 'jsonp',
      data: {
        action: 'modificaPrenotazione',
        id: editData.id,
        payload: encodeURIComponent(JSON.stringify(editData))
      },
      success: function(data){
        alert('Modifica: ' + data.message);
        $('#editModal').modal('hide');
        fetchAppointments();
      },
      error: function(){
        alert('Errore durante la modifica della prenotazione.');
      }
    });
  });
  
  // Inizializza il caricamento degli operatori e degli appuntamenti
  fetchOperators();
  fetchAppointments();
});
