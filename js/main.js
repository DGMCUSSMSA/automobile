document.addEventListener('DOMContentLoaded', function() {
  // Nuovo deploy URL del Google Apps Script
  const deployURL = 'https://script.google.com/macros/s/AKfycbyHH6t6GUVvrQxR0fD8voVQKVzx5-oNas06rT1njf_XBJXtwK-ebq7CTpUfirGAD1yuiw/exec';
  
  // Variabile globale per salvare i dati degli operatori (nome ed email)
  let globalOperators = [];

  /**
   * Recupera la lista degli operatori e popola il menu a tendina sia per la prenotazione che per il modal di modifica.
   */
  function fetchOperators(){
    $.ajax({
      url: deployURL,
      dataType: 'jsonp',
      data: { action: 'getOperators' },
      success: function(data){
        globalOperators = data; // Salva globalmente per lookup
        // Popola il select del form di prenotazione (singolo select)
        var operatorSelect = $('#operatorSelect');
        operatorSelect.empty();
        if(data && data.length > 0){
          $.each(data, function(i, op){
            operatorSelect.append($('<option>', { value: op.email, text: op.display }));
          });
        } else {
          operatorSelect.append($('<option>', { value: '', text: 'Nessun operatore trovato' }));
        }
        // Popola il select del modal per la modifica (multi-select)
        var editSelect = $('#editOperatorSelect');
        editSelect.empty();
        if(data && data.length > 0){
          $.each(data, function(i, op){
            editSelect.append($('<option>', { value: op.email, text: op.display }));
          });
        } else {
          editSelect.append($('<option>', { value: '', text: 'Nessun operatore trovato' }));
        }
      },
      error: function(){
        $('#operatorSelect').html('<option value="">Errore nel caricamento</option>');
        $('#editOperatorSelect').html('<option value="">Errore nel caricamento</option>');
      }
    });
  }
  
  /**
   * Recupera e visualizza gli appuntamenti in una tabella.
   * Aggiunge anche un listener per il click su ogni riga per aprire il modal di modifica.
   */
  function fetchAppointments(){
    $.ajax({
      url: deployURL,
      dataType: 'jsonp',
      data: { action: 'getPrenotazioni' },
      success: function(data){
        var tableBody = $('#appointmentsTableBody');
        tableBody.empty(); // Pulisce la tabella
        if(data && data.length > 0){
          $.each(data, function(i, app){
            var row = $('<tr>').addClass('appointmentRow').data('appointment', app);
            row.append($('<td>').text(app.title));
            row.append($('<td>').text(app.start));
            row.append($('<td>').text(app.end));
            row.append($('<td>').text(app.email));
            tableBody.append(row);
          });
          // Aggiunge il listener per il click sulle righe degli appuntamenti
          $('.appointmentRow').on('click', function(){
            var appData = $(this).data('appointment');
            openEditModal(appData);
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
   * Apertura del modal di modifica, pre-compilando i campi con i dati dell'appuntamento selezionato.
   * Il campo per gli operatori è un multi-select e il campo email viene aggiornato automaticamente.
   */
  function openEditModal(appData) {
    // Pre-compila i campi del modal
    $('#editDate').val(appData.start.split('T')[0]); // Supponendo formato "yyyy-MM-ddTHH:mm"
    $('#editOraInizio').val(appData.start.split('T')[1]);
    $('#editOraFine').val(appData.end.split('T')[1]);
    $('#editMotivo').val(appData.title.split(" - ")[1] || ""); // Personalizza come vuoi
    $('#editLuogo').val(appData.title.split(" - ")[2] || "");
    
    // Seleziona nel multi-select gli operatori in base al campo "nomiOperatori"
    // Assumiamo che appData.nomiOperatori sia una stringa con nomi separati da virgola
    var operatorNames = appData.nomiOperatori ? appData.nomiOperatori.split(',') : [];
    // Rimuoviamo eventuali spazi
    operatorNames = operatorNames.map(function(op) { return op.trim(); });
    
    // Seleziona le opzioni nel multi-select corrispondenti (confrontando il testo)
    $('#editOperatorSelect option').each(function(){
      var optionText = $(this).text().trim();
      if(operatorNames.indexOf(optionText) !== -1){
        $(this).prop('selected', true);
      } else {
        $(this).prop('selected', false);
      }
    });
    
    // Aggiorna il campo email (disabilitato) unendo le email degli operatori selezionati
    updateEditOperatorEmail();
    
    // Mostra il modal (utilizza il plugin/modal che preferisci; qui si assume Bootstrap)
    $('#editModal').modal('show');
  }
  
  /**
   * Aggiorna il campo email del modal in base agli operatori selezionati.
   */
  function updateEditOperatorEmail(){
    var selectedEmails = [];
    $('#editOperatorSelect option:selected').each(function(){
      selectedEmails.push($(this).val());
    });
    // Imposta il campo email (disabilitato) con le email selezionate, separate da virgola
    $('#editOperatorEmail').val(selectedEmails.join(', '));
  }
  
  // Aggiunge il listener per aggiornare automaticamente il campo email quando la selezione cambia nel modal
  $('#editOperatorSelect').on('change', updateEditOperatorEmail);
  
  /**
   * Gestione del submit del form per l'invio di una nuova prenotazione (creazione).
   */
  $('#prenotazioneForm').on('submit', function(e){
    e.preventDefault();
    
    var prenotazioneData = {
      data: $('#data').val(),
      oraInizio: $('#oraInizio').val(),
      oraFine: $('#oraFine').val(),
      motivoPrenotazione: $('#motivo').val(),
      luogoVisita: $('#luogo').val(),
      email: $('#email').val(),  // Campo email editabile nel form di creazione
      nomiOperatori: $('#operatorSelect').find('option:selected').text(), // Selezione singola
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
   * (Dovrai implementare una funzione simile al backend per la modifica.)
   */
  $('#editForm').on('submit', function(e){
    e.preventDefault();
    
    // Raccogli i dati modificati dal modal
    var editData = {
      id: $('#editId').val(), // id dell'appuntamento, da salvare nel data-attribute quando apri il modal
      data: $('#editDate').val(),
      oraInizio: $('#editOraInizio').val(),
      oraFine: $('#editOraFine').val(),
      motivoPrenotazione: $('#editMotivo').val(),
      luogoVisita: $('#editLuogo').val(),
      // Il campo email è disabilitato, lo aggiorniamo automaticamente
      email: $('#editOperatorEmail').val(),
      // Il multi-select consente la selezione di più operatori; qui li uniamo in una stringa
      nomiOperatori: $('#editOperatorSelect').find('option:selected').map(function(){ return $(this).text().trim(); }).get().join(', '),
      stato: "Attiva"
    };
    
    // Qui dovresti fare una chiamata AJAX per modificare l'appuntamento (es. action=modificaPrenotazione)
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
  
  // Inizializza il caricamento iniziale degli operatori e degli appuntamenti
  fetchOperators();
  fetchAppointments();
});
