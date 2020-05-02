function newSold() {
    // Get orchestrator spreadsheet
    var ssOchestrator = SpreadsheetApp.getActive().getSheetByName('orchestrator');
  
    // Get spreadsheet last row from orchestrator
    var lr = ssOchestrator.getLastRow();
  
    // Get all active sheets list
    for (var i = 2; i <= lr; i++) {
  
      // Check if it is mark as done
      var check = ssOchestrator.getRange(i, 2).getValue();
  
      // Check if has mark done 
      if (check != "done") {
  
        // Get one by one all active sheets
        var activeSheet = ssOchestrator.getRange(i, 1).getValue();
  
        // Catch the spreadsheet to evaluate if we find a new sold
        var ssSoldId = SpreadsheetApp.getActive().getSheetByName(activeSheet);
  
        // Get cell where is the id
        var soldId = ssSoldId.getRange(2, 9).getValue();
  
        // check if artwork is sold
        if (activeSheet == soldId) {
  
          // Archive form
          archiveForm(soldId);
  
          // Copy to data lake
          copyDataLake(soldId);
  
          // Mandamos mail al comprador
          sendBuyerMail();
  
          // Delete sold spreadsheet tab
          deleteSoldTab(soldId);
  
          // Mark as done spreadsheet id in orchestrator spreadsheet
          markAsDone(soldId);
        }
      }
    }
    // Delete all done ids. Cleaning function
    deleteIdOrch();
  }
  
  // Change form and move to another workspace
  // THIS IS MY TYPEFORM PAYLOAD WHEN I SOLD A ARYWORK 
  function archiveForm(soldId) {
    var formCode = soldId;
  
    var url = "https://api.typeform.com/forms/" + formCode;
  
    var payload = {
      "id": formCode,
      "title": formCode,
      "theme": {
        "href": "https://api.typeform.com/themes/XXXXX"
      },
      "workspace": {
        "href": "https://api.typeform.com/workspaces/XXXX"
      },
      "settings": {
        "is_public": false,
        "is_trial": false,
        "language": "en",
        "progress_bar": "proportion",
        "show_progress_bar": true,
        "show_typeform_branding": true,
        "meta": {
          "allow_indexing": false
        }
      },
      "thankyou_screens": [
        {
          "ref": "21e5cfd6-949f-49a7-9ad7-70469c23213f",
          "title": "Sorry, this *artwork* has been *sold*.\nLo siento, esta *obra* ha sido *vendida*.",
          "properties": {
            "show_button": false,
            "share_icons": false,
            "button_mode": "reload",
            "button_text": "repetir"
          },
          "attachment": {
            "type": "image",
            "href": "https://images.typeform.com/images/XXXXXX"
          }
        },
        {
          "ref": "default_tys",
          "title": "¡Hecho! Tu información se ha enviado perfectamente.",
          "properties": {
            "show_button": false,
            "share_icons": false
          }
        }
      ],
      "_links": {
        "display": "https://alexdolara.typeform.com/to/" + formCode
      }
    };
    var options = {
      "method": "put",
      "timeout": 0,
      "headers": {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": "Bearer YOUR TYPEFORM TOKEN",
        "Cookie": "device_view=full"
      },
      "payload": JSON.stringify(payload)
    };
  
    return UrlFetchApp.fetch(url, options);
  }
  
  // Copy sold data tab to data lake
  function copyDataLake(soldId) {
    //Get sold spreadsheet
    var soldIdSheet = SpreadsheetApp.getActive().getSheetByName(soldId);
  
    // Get sold spreadsheet data
    var data = soldIdSheet.getRange(2, 1, 1, 10).getValues();
  
    // Get data lake spreadsheet
    var ssDataLake = SpreadsheetApp.getActive().getSheetByName('date lake');
  
    // Get last row empty from data lake spreadsheet
    var lastRow = ssDataLake.getLastRow() + 1;
  
    // Get date to include on data lake spreadsheet
    var day = new Date();
  
    // Add all data in data lake spreadsheet
    for (var i = 2; i <= lastRow; i++) {
      ssDataLake.getRange(lastRow, 1, 1, 10).setValues(data);
      ssDataLake.getRange(lastRow, 11).setValue(day);
    }
  }
  
  // Send mail to buyer
  function sendBuyerMail() {
  
    // Get the data lake spreadsheet
    var ssDataLake = SpreadsheetApp.getActive().getSheetByName('date lake');
  
    // Get last row 
    var lr = ssDataLake.getLastRow();
  
    for (var i = 2; i <= lr; i++) {
  
      var alreadySend = ssDataLake.getRange(i, 12).getValue();
  
      if (alreadySend != 'yes') {
  
        var language = ssDataLake.getRange(i, 6).getValue();
  
        if (language == "7Spain / España") {
  
          var htmlBody = HtmlService.createHtmlOutputFromFile('email_es');
  
        } else {
  
          var htmlBody = HtmlService.createHtmlOutputFromFile('email_en');
  
        }
  
        var data = ssDataLake.getRange(i, 1, 1, 7).getValues();
  
        var name = data[0][0];
        var address = data[0][1];
        var city = data[0][2];
        var postalCode = data[0][3];
        var state = data[0][4];
        var country = data[0][5];
        var email = data[0][6];
  
  
        var subject = "a  l  e  x  d  o  l  a  r  a  ™";
        var message = htmlBody.getContent()
        message = message.replace("%name", name);
        message = message.replace("%address", address);
        message = message.replace("%city", city);
        message = message.replace("%postalCode", postalCode);
        message = message.replace("%state", state);
        message = message.replace("%country", country);
  
        MailApp.sendEmail({
          to: email,
          subject: subject,
          htmlBody: message
        });
      };
      var date = new Date();
  
      ssDataLake.getRange(i, 12).setValue('yes');
      ssDataLake.getRange(i, 13).setValue(date);
    }
  }
  
  // Delete sold sheet
  function deleteSoldTab(soldId) {
    // Get Spreadsheet Object
    var ssDelete = SpreadsheetApp.getActive();
  
    // Get target sheet object
    var sheetTab = ssDelete.getSheetByName(soldId);
  
    // Delete tab
    deleteSheet.deleteSheet(sheetTab);
  }
  
  // Mark as done id at orchestrator spreadsheet
  function markAsDone(soldId) {
  
    // Get orchestrator spreadsheet
    var ssOchestrator = SpreadsheetApp.getActive().getSheetByName('orchestrator');
  
    // Get orchestrator last filled row
    var lr = ssOchestrator.getLastRow();
  
    // Get all active sheets list
    for (var i = 2; i <= lr; i++) {
  
      // Get cell where is the id
      var orchestratorId = ssOchestrator.getRange(i, 1).getValue();
  
      if (soldId == orchestratorId) {
  
        ssOchestrator.getRange(i, 2).setValue('done');
      }
    }
  }
  
  // Delete all id marked as "done" in orchestrator spreadsheet
  function deleteIdOrch() {
    // Get orchestrator spreadsheet
    var ssOchestrator = SpreadsheetApp.getActive().getSheetByName('orchestrator');
  
    // Get spreadsheet last row from orchestrator
    var lr = ssOchestrator.getLastRow();
  
    // Get all active sheets list
    for (var i = 2; i <= lr; i++) {
      var check = ssOchestrator.getRange(i, 2).getValue();
  
      // Check if the second column has done in the cell
      if (check == "done") {
        // Delete row
        ssOchestrator.deleteRow(i);
  
        // Update i 
        var i = (i) - 1;
      }
    }
  }