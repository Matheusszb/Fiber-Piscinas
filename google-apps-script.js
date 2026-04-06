function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.nome || "",
    data.whatsapp || "",
    data.cidade || "",
    data.espaco || "",
    data.tipo || "",
    data.orcamento || "",
    data.espacoPronto || "",
    data.prazoCompra || "",
    data.qualificacao || "",
    data.piscina || "",
    data.detalhesPiscina || "",
    data.data || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
