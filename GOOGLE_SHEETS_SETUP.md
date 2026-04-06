# Google Sheets Setup

1. Crie uma planilha no Google Sheets.
2. Na primeira linha, coloque estes titulos:
   `Data do registro | Nome | WhatsApp | Cidade | Espaco | Tipo | Orcamento | Espaco pronto | Prazo de compra | Qualificacao | Piscina recomendada | Detalhes | Data enviada pelo site`
3. No Google Sheets, abra `Extensoes > Apps Script`.
4. Apague o codigo padrao e cole o conteudo de [google-apps-script.js](./google-apps-script.js).
5. Clique em `Implantar > Nova implantacao`.
6. Escolha `Aplicativo da Web`.
7. Em acesso, selecione algo equivalente a `Qualquer pessoa`.
8. Implante e copie a URL gerada.
9. Abra [script.js](./script.js) e troque:
   `const GOOGLE_SCRIPT_URL = "COLE_AQUI_SUA_URL_DO_GOOGLE_APPS_SCRIPT";`
   pela URL publicada.

Depois disso, cada envio do formulario vai criar uma nova linha na planilha.

## Observacao

Eu deixei o projeto pronto para enviar os dados, mas nao consigo publicar o Apps Script da sua conta Google daqui. Essa parte precisa ser feita por voce no navegador com sua conta.
