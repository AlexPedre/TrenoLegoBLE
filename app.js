/**
 * TrenoLegoBLE 1.1.17 — application logic.
 *
 * This file retains the proven LEGO BLE handling from v1.1.16.
 * Keep commands serialized per hub and treat disconnected motors as unsafe.
 */

// Browser compatibility: identify unsupported iOS and iPadOS clients.

// iOS/iPadOS: all browsers use WebKit and Web Bluetooth is not supported.
// The iPadOS desktop user-agent can identify itself as a Mac.
window.TrenoLegoBLEUnsupportedIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Show a localized compatibility notice before initializing Bluetooth.

if (window.TrenoLegoBLEUnsupportedIOS) {
  const it = (navigator.language || '').toLowerCase().split('-')[0] === 'it';
  document.getElementById('ios-unsupported-title').textContent =
    it ? 'TrenoLegoBLE non disponibile su iOS' : 'TrenoLegoBLE is unavailable on iOS';
  document.getElementById('ios-unsupported-text').textContent = it
    ? 'I browser per iPhone e iPad non supportano Web Bluetooth, necessario per controllare gli hub LEGO Powered Up. Utilizza Chrome o Edge su Windows, oppure Chrome su Android.'
    : 'Browsers on iPhone and iPad do not support Web Bluetooth, which is required to control LEGO Powered Up hubs. Use Chrome or Edge on Windows, or Chrome on Android.';
  document.getElementById('ios-unsupported').hidden = false;
  document.title = 'TrenoLegoBLE — ' + (it ? 'non supportato' : 'unsupported');
}

// Application state, localization, LEGO protocol, motors, remotes and UI.

if (!window.TrenoLegoBLEUnsupportedIOS) {

// --- Localization and user interface language ---
const LANG=(navigator.language||'en').toLowerCase().split('-')[0]==='it'?'it':'en';
const I18N={
 it:{subtitle:'Controller Bluetooth multi-treno',controls:'Controlli',settings:'Impostazioni',reconnectAll:'Riconnetti tutti',stopAll:'STOP TUTTI',pair:'+ Accoppia hub',disclaimer:'La luminosità delle luci si configura in Impostazioni. Le luci Powered Up devono essere collegate a una porta diversa dal motore. La regolazione imposta la potenza, non la velocità misurata. In caso di perdita Bluetooth, sospensione della pagina o chiusura del browser, l’arresto non è garantito. Sorvegliare i treni.',connected:'Connesso',disconnected:'Disconnesso',battery:'Batteria',waiting:'in attesa…',target:'Obiettivo',lightsOn:'Luci ON',lightsOff:'Luci OFF',reconnect:'Riconnetti',name:'Nome del treno',motorPort:'Porta motore',lightPort:'Porta luci',none:'Nessuna',brightness:'Luminosità luci',acceleration:'Accelerazione',ramp:'Rampa attiva',reverse:'Inverti senso di marcia',disconnect:'Disconnetti',delete:'Elimina treno',motorPower:'Potenza motore',noTrains:'Nessun treno configurato. Vai in Impostazioni per accoppiare un hub.',noHubs:'Nessun hub associato. Premi Accoppia hub per iniziare.',train:'Treno',readError:'Impossibile leggere i treni salvati',saveError:'Impossibile salvare i treni in localStorage',openSecure:'Apri la pagina da localhost o HTTPS.',hubDisconnected:'Hub disconnesso',lightsError:'comando luci fallito',portConflict:'La porta motore e la porta luci devono essere diverse.',lightConflict:'La porta luci deve essere diversa dalla porta motore.',lost:'disconnesso. Arresto NON garantito: verificare il treno.',connectedNotice:'connesso.',connectionFailed:'Connessione non riuscita',reconnectionFailed:'Riconnessione non riuscita',bluetoothUnavailable:'Web Bluetooth non disponibile.',bluetoothSecure:'Web Bluetooth non disponibile: usare Chrome/Edge su HTTPS o localhost.',wrongHub:'Hub selezionato diverso',usePair:'Usa + Accoppia hub per associarlo.',alreadyConnected:'Questo hub è già connesso.',manual:'Riconnessione manuale: premi Riconnetti sul treno desiderato.',noSaved:'Nessun hub salvato trovato tra i dispositivi autorizzati. Usa Riconnetti su ogni scheda.',autoUnavailable:'Riconnessione automatica non disponibile: usa Riconnetti su ciascun treno.',manualSingle:'Riconnessione automatica non disponibile: usa Riconnetti sulla scheda del singolo treno.'},
 en:{subtitle:'Multi-train Bluetooth controller',controls:'Controls',settings:'Settings',reconnectAll:'Reconnect all',stopAll:'STOP ALL',pair:'+ Pair hub',disclaimer:'Configure light brightness in Settings. Powered Up lights must use a different port from the motor. The slider controls power, not measured speed. Stopping is not guaranteed if Bluetooth disconnects, the page is suspended or the browser closes. Always supervise the trains.',connected:'Connected',disconnected:'Disconnected',battery:'Battery',waiting:'waiting…',target:'Target',lightsOn:'Lights ON',lightsOff:'Lights OFF',reconnect:'Reconnect',name:'Train name',motorPort:'Motor port',lightPort:'Lights port',none:'None',brightness:'Light brightness',acceleration:'Acceleration',ramp:'Enable ramp',reverse:'Reverse direction',disconnect:'Disconnect',delete:'Remove train',motorPower:'Motor power',noTrains:'No trains configured. Go to Settings to pair a hub.',noHubs:'No hubs paired. Select Pair hub to begin.',train:'Train',readError:'Cannot read saved trains',saveError:'Cannot save trains to localStorage',openSecure:'Open this page from localhost or HTTPS.',hubDisconnected:'Hub disconnected',lightsError:'light command failed',portConflict:'Motor and lights must use different ports.',lightConflict:'Lights and motor must use different ports.',lost:'disconnected. STOP is NOT guaranteed: check the train.',connectedNotice:'connected.',connectionFailed:'Connection failed',reconnectionFailed:'Reconnection failed',bluetoothUnavailable:'Web Bluetooth is unavailable.',bluetoothSecure:'Web Bluetooth unavailable: use Chrome/Edge over HTTPS or localhost.',wrongHub:'Selected hub does not match',usePair:'Use + Pair hub to associate it.',alreadyConnected:'This hub is already connected.',manual:'Manual reconnection: select Reconnect on the train.',noSaved:'No saved hubs found among authorized devices. Use Reconnect on each card.',autoUnavailable:'Automatic reconnection unavailable: use Reconnect on each train.',manualSingle:'Automatic reconnection unavailable: use Reconnect on an individual train.'}
};
Object.assign(I18N.it,{duoGroups:'Treni Duo',duoName:'Nome Duo',firstHub:'Primo hub',secondHub:'Secondo hub',createDuo:'Crea Duo',duoHelp:'Ogni hub può appartenere a un solo Duo. Le impostazioni dei singoli hub restano disponibili qui.',removeDuo:'Sciogli Duo',duoMissing:'Seleziona due hub differenti e disponibili.',duoReady:'Pronto',duoOffline:'Hub disconnesso',duoStopped:'Duo arrestato: un hub si è disconnesso. Verificare entrambi i treni.',duoConnectFirst:'Connettere entrambi gli hub per muovere il Duo.',duoLabel:'Duo',duoLights:'Luci Duo'});
Object.assign(I18N.en,{duoGroups:'Duo trains',duoName:'Duo name',firstHub:'First hub',secondHub:'Second hub',createDuo:'Create Duo',duoHelp:'Each hub can belong to only one Duo. Individual hub settings remain available here.',removeDuo:'Ungroup Duo',duoMissing:'Select two different available hubs.',duoReady:'Ready',duoOffline:'Hub disconnected',duoStopped:'Duo stopped: one hub disconnected. Check both trains.',duoConnectFirst:'Connect both hubs before moving the Duo.',duoLabel:'Duo',duoLights:'Duo lights'});
Object.assign(I18N.it,{reconnectProgress:'Hub connessi',reconnectSelect:'Seleziona prossimo hub',reconnectDone:'Tutti gli hub sono connessi.',reconnectRemaining:'Da connettere',reconnectCancel:'Chiudi',reconnectStart:'Seleziona un hub nella finestra Bluetooth. Ripeti per gli hub rimanenti.',reconnectCancelled:'Selezione annullata. Puoi riprendere quando vuoi.',reconnectUnknown:'Hub non registrato: seleziona uno dei treni salvati.',reconnectBusy:'Connessione in corso…'});
Object.assign(I18N.en,{reconnectProgress:'Connected hubs',reconnectSelect:'Select next hub',reconnectDone:'All hubs are connected.',reconnectRemaining:'Still to connect',reconnectCancel:'Close',reconnectStart:'Select a hub in the Bluetooth dialog. Repeat for remaining hubs.',reconnectCancelled:'Selection cancelled. You can resume at any time.',reconnectUnknown:'Hub not registered: select one of the saved trains.',reconnectBusy:'Connecting…'});
Object.assign(I18N.it,{bluetoothName:'Nome Bluetooth hub',bluetoothNameHelp:'Massimo 14 caratteri ASCII. La modifica viene inviata all’hub soltanto premendo Imposta.',bluetoothRead:'Leggi nome',bluetoothSet:'Imposta',bluetoothReset:'Ripristina LEGO',bluetoothUnknown:'Non letto',bluetoothInvalid:'Il nome Bluetooth deve contenere da 1 a 14 caratteri ASCII.',bluetoothOffline:'Connettere l’hub per leggere o modificare il nome Bluetooth.',bluetoothSent:'Nome Bluetooth inviato',bluetoothResetSent:'Richiesto il ripristino del nome LEGO',bluetoothReadSent:'Richiesta lettura del nome inviata',bluetoothError:'Operazione sul nome Bluetooth non riuscita',bluetoothConfirmReset:'Ripristinare il nome Bluetooth predefinito LEGO?',bluetoothCurrent:'Nome attuale'});
Object.assign(I18N.en,{bluetoothName:'Hub Bluetooth name',bluetoothNameHelp:'Maximum 14 ASCII characters. The name is sent to the hub only when you press Set.',bluetoothRead:'Read name',bluetoothSet:'Set',bluetoothReset:'Reset LEGO name',bluetoothUnknown:'Not read',bluetoothInvalid:'Bluetooth name must be 1 to 14 ASCII characters.',bluetoothOffline:'Connect the hub to read or change its Bluetooth name.',bluetoothSent:'Bluetooth name command sent',bluetoothResetSent:'LEGO default name reset requested',bluetoothReadSent:'Name read request sent',bluetoothError:'Bluetooth name operation failed',bluetoothConfirmReset:'Restore the default LEGO Bluetooth name?',bluetoothCurrent:'Current name'});
Object.assign(I18N.it,{rssi:'Segnale',hubInfo:'Informazioni hub',firmwareVersion:'Firmware',hardwareVersion:'Hardware',radioFirmwareVersion:'Firmware radio',protocolVersion:'Protocollo LEGO',batteryType:'Tipo batteria',batteryNormal:'Normale',batteryRechargeable:'Ricaricabile',hubUnknown:'Non disponibile'});
Object.assign(I18N.en,{rssi:'Signal',hubInfo:'Hub information',firmwareVersion:'Firmware',hardwareVersion:'Hardware',radioFirmwareVersion:'Radio firmware',protocolVersion:'LEGO protocol',batteryType:'Battery type',batteryNormal:'Normal',batteryRechargeable:'Rechargeable',hubUnknown:'Unavailable'});
Object.assign(I18N.it,{confirmDelete:'Eliminare il treno \"{name}\"? Questa operazione cancellerà le impostazioni salvate e scioglierà l’eventuale Duo.'});
Object.assign(I18N.en,{confirmDelete:'Remove train \"{name}\"? This deletes its saved settings and ungroups any Duo.'});
Object.assign(I18N.it,{energySaving:'Risparmio energetico',energyEnable:'Disconnetti hub e telecomandi inattivi',energyMinutes:'Minuti di inattività',energyHelp:'Impostazione globale. Ogni treno viene disconnesso dopo il periodo di inattività; i due hub di un Duo vengono disconnessi insieme, solo a motori fermi.',energyDisconnected:'disconnesso per inattività.'});
Object.assign(I18N.en,{energySaving:'Power saving',energyEnable:'Disconnect inactive hubs and remotes',energyMinutes:'Inactivity (minutes)',energyHelp:'Global setting. Each train disconnects after inactivity; both hubs of a Duo disconnect together, only when motors are stopped.',energyDisconnected:'disconnected due to inactivity.'});
Object.assign(I18N.it,{portA:'Porta A',portB:'Porta B',deviceType:'Dispositivo collegato',motor:'Motore',lights:'Luci',nothing:'Nulla',linkMotors:'Unisci i controlli dei motori A e B',portMotor:'Motore porta',noMotor:'Nessun motore configurato',twoMotors:'Motori A + B',lightPortLabel:'Luci porta'});
Object.assign(I18N.en,{portA:'Port A',portB:'Port B',deviceType:'Connected device',motor:'Motor',lights:'Lights',nothing:'None',linkMotors:'Link motor controls A and B',portMotor:'Motor port',noMotor:'No motor configured',twoMotors:'Motors A + B',lightPortLabel:'Lights port'});
Object.assign(I18N.it,{reorderTrain:'Trascina per riordinare i treni. Usa anche le frecce su e giù.',reorderSaved:'Ordine dei treni salvato.'});
Object.assign(I18N.it,{ledTitle:'LED dell’hub',ledCustom:'Usa colore LEGO predefinito',ledColor:'Colore LED',ledNative:'Se disattivato, TrenoLegoBLE non controlla il LED. Il ritorno allo stato originale potrebbe richiedere il riavvio dell’hub.',ledApplied:'Colore LED applicato',ledError:'Impossibile impostare il LED',ledColors:['Spento','Rosa','Viola','Blu','Azzurro','Ciano','Verde','Giallo','Arancione','Rosso','Bianco']});
Object.assign(I18N.en,{ledTitle:'Hub LED',ledCustom:'Use predefined LEGO color',ledColor:'LED color',ledNative:'When disabled, TrenoLegoBLE does not control the LED. Original indications may return only after restarting the hub.',ledApplied:'LED color applied',ledError:'Unable to set LED color',ledColors:['Off','Pink','Purple','Blue','Light blue','Cyan','Green','Yellow','Orange','Red','White']});
Object.assign(I18N.en,{reorderTrain:'Drag to reorder trains. You can also use the up and down arrow keys.',reorderSaved:'Train order saved.'});
Object.assign(I18N.it,{remotes:'Telecomandi',remoteAdd:'+ Aggiungi telecomando',remoteTitle:'Telecomandi LEGO Powered Up 88010',remoteHelp:'Ogni telecomando può avere associati più coppie di motori. Il pulsante centrale seleziona la coppia successiva. Il doppio clic su STOP A o STOP B arresta immediatamente tutti i treni.',remoteEmpty:'Nessun telecomando configurato.',remoteConnected:'Connesso',remoteDisconnected:'Disconnesso',remotePair:'Coppia di motori',remoteGroupA:'Pulsanti sinistra',remoteGroupB:'Pulsanti destra',remoteColor:'Colore LED',remoteAddPair:'+ Aggiungi coppia di motori',remoteRemove:'Elimina telecomando',remoteRemovePair:'Elimina coppia',remoteMode:'Modalità',remoteStepMode:'A scatti',remoteContinuous:'Continua (pressione prolungata)',remoteStep:'Incremento (%)',remoteContinuousStep:'Incremento ogni 150 ms (%)',remoteNoTarget:'Non assegnato',remoteConnect:'Riconnetti',remoteDisconnect:'Disconnetti',remoteName:'Nome telecomando',remoteActive:'Attiva',remoteConfirm:'Eliminare questo telecomando e tutte le sue assegnazioni?',remoteHint:'Accendi il telecomando e usa Riconnetti. Se Chrome non riesce a ritrovarlo, selezionalo nella finestra Bluetooth.',remoteAdded:'Telecomando aggiunto',remoteNotFound:'Telecomando diverso da quello configurato. Usa Aggiungi telecomando.',remoteNoPair:'Configura almeno una coppia.',remoteCount:'Telecomandi connessi',remoteUnassigned:'Gruppo non assegnato.',remoteBadLink:'Dispositivo non disponibile oppure porta non configurata come motore.'});
Object.assign(I18N.en,{remotes:'Remotes',remoteAdd:'+ Add remote',remoteTitle:'LEGO Powered Up 88010 remotes',remoteHelp:'Each remote can be assigned multiple pairs of motors. The center button selects the next pair. Double-click STOP A or STOP B to stop all trains immediately.',remoteEmpty:'No remotes configured.',remoteConnected:'Connected',remoteDisconnected:'Disconnected',remotePair:'Motor pair',remoteGroupA:'Left buttons',remoteGroupB:'Right buttons',remoteColor:'LED color',remoteAddPair:'+ Add motor pair',remoteRemove:'Remove remote',remoteRemovePair:'Remove pair',remoteMode:'Control mode',remoteStepMode:'Step-by-step',remoteContinuous:'Continuous (hold button)',remoteStep:'Step size (%)',remoteContinuousStep:'Increment every 150 ms (%)',remoteNoTarget:'Unassigned',remoteConnect:'Reconnect',remoteDisconnect:'Disconnect',remoteName:'Remote name',remoteActive:'Active',remoteConfirm:'Remove this remote and all its assignments?',remoteHint:'Turn on the remote and select Reconnect. If Chrome cannot find it, select it in the Bluetooth chooser.',remoteAdded:'Remote added',remoteNotFound:'Different remote selected. Use Add remote.',remoteNoPair:'Configure at least one pair.',remoteCount:'Connected remotes',remoteUnassigned:'Group is unassigned.',remoteBadLink:'Device unavailable or port not configured as a motor.'});

Object.assign(I18N.it,{backupTitle:'Backup della configurazione',backupHelp:'Esporta tutte le impostazioni in un file JSON oppure importa un backup per sostituire la configurazione corrente. Le autorizzazioni Bluetooth non sono trasferibili.',backupExport:'Esporta configurazione',backupImport:'Importa configurazione',backupInvalid:'File di configurazione non valido o non compatibile',backupConfirm:'Sostituire TUTTA la configurazione corrente con il backup selezionato? Questa operazione non può essere annullata.',backupMoving:'Ferma tutti i motori prima di importare la configurazione.',backupDone:'Configurazione importata. Ricaricamento…',backupSaved:'Backup esportato',backupError:'Errore durante il backup',remoteDuoExclusive:'Le porte degli hub appartenenti a un Duo non possono essere assegnate singolarmente.'});
Object.assign(I18N.it,{boostTitle:'Torque Boost',boostEnable:'Abilita Torque Boost',boostPower:'Potenza massima',boostDuration:'Durata totale',boostHelp:'Tre step fissi di avviamento, solo da fermo. STOP e variazioni di potenza annullano il boost.'});
Object.assign(I18N.en,{boostTitle:'Torque Boost',boostEnable:'Enable Torque Boost',boostPower:'Maximum power',boostDuration:'Total duration',boostHelp:'Three fixed startup steps, only from a standstill. STOP and power changes cancel the boost.'});
Object.assign(I18N.en,{backupTitle:'Configuration backup',backupHelp:'Export all settings to a JSON file or import a backup to replace the current configuration. Bluetooth permissions cannot be transferred.',backupExport:'Export configuration',backupImport:'Import configuration',backupInvalid:'Invalid or incompatible configuration file',backupConfirm:'Replace ALL current settings with the selected backup? This cannot be undone.',backupMoving:'Stop all motors before importing a configuration.',backupDone:'Configuration imported. Reloading…',backupSaved:'Backup exported',backupError:'Backup error',remoteDuoExclusive:'Ports belonging to a Duo cannot be assigned individually.'});
const tr=key=>I18N[LANG][key];
document.documentElement.lang=LANG;
for(const el of document.querySelectorAll('[data-i18n]'))el.textContent=tr(el.dataset.i18n);
const SERVICE='00001623-1212-efde-1623-785feabcd123';

const CHARACTERISTIC='00001624-1212-efde-1623-785feabcd123';
let remoteConfigReady=false;const trains=new Map();let nextId=1;const duos=new Map();const DUO_STORAGE='trenolegoble_duos';
const STORAGE_KEY='trenolegoble_trains';
// Global setting with independent inactivity clocks for each train / Duo.
const ENERGY_STORAGE='trenolegoble_energy';
function validEnergyMinutes(value){const n=Number(value);return Number.isInteger(n)&&n>=1&&n<=240?n:5;}
function loadEnergySettings(){
  try{const x=JSON.parse(localStorage.getItem(ENERGY_STORAGE)||'{}');return {enabled:x.enabled===true,minutes:validEnergyMinutes(x.minutes)};}
  catch{return {enabled:false,minutes:5};}
}
const energy=loadEnergySettings();
const HAPTIC_STORAGE='trenolegoble_haptic';
let hapticEnabled=localStorage.getItem(HAPTIC_STORAGE)==='true';
function haptic(ms){
 if(!hapticEnabled||typeof navigator.vibrate!=='function')return;
 try{navigator.vibrate(0);navigator.vibrate(Math.min(5000,Math.max(100,Math.round(ms))));}catch{}
}
function hapticForTargets(targets,isStop=false){
 const remaining=targets.flatMap(({hub,ports,target})=>ports.map(i=>{
  const p=hub.ports[i];return hub.ramp?Math.ceil(Math.abs(target-p.actual)/5)*100:(isStop?500:300);
 }));
 haptic(remaining.length?Math.max(...remaining):isStop?500:300);
}
const LOW_BATTERY_STORAGE='trenolegoble_low_battery_alerts';
let lowBatteryStates={};
try{lowBatteryStates=JSON.parse(localStorage.getItem(LOW_BATTERY_STORAGE)||'{}')||{};}catch{}
const lowBatteryQueue=new Map();let lowBatteryDialogOpen=false;
function checkLowBattery(id,name,value){
 if(!Number.isFinite(value)||value<0||value>100)return;
 if(value>=30){if(lowBatteryStates[id]){delete lowBatteryStates[id];localStorage.setItem(LOW_BATTERY_STORAGE,JSON.stringify(lowBatteryStates));}return;}
 if(value>=20||lowBatteryStates[id])return;
 lowBatteryStates[id]=true;
 try{localStorage.setItem(LOW_BATTERY_STORAGE,JSON.stringify(lowBatteryStates));}catch{}
 lowBatteryQueue.set(id,`${name}: ${value}%`);
 if(!lowBatteryDialogOpen)setTimeout(showLowBatteryDialog,150);
}
function showLowBatteryDialog(){
 if(lowBatteryDialogOpen||!lowBatteryQueue.size)return;
 lowBatteryDialogOpen=true;
 const overlay=document.createElement('div');overlay.className='low-battery-overlay';overlay.setAttribute('role','presentation');
 const box=document.createElement('div');box.className='low-battery-dialog';box.setAttribute('role','alertdialog');box.setAttribute('aria-modal','true');
 const title=document.createElement('h2');title.textContent=tr('batteryLowTitle');
 const desc=document.createElement('p');desc.textContent=[...lowBatteryQueue.values()].join('\n')+'\n'+tr('batteryLowMessage');lowBatteryQueue.clear();
 const ok=document.createElement('button');ok.textContent='OK';ok.addEventListener('click',()=>{overlay.remove();lowBatteryDialogOpen=false;setTimeout(showLowBatteryDialog,150);});
 box.append(title,desc,ok);overlay.append(box);document.body.append(overlay);ok.focus();
}

const MOTOR='motor', LIGHTS='lights', NONE='none';
function normalizeBoostPower(v){const n=Number(v);return Number.isFinite(n)?Math.max(20,Math.min(100,Math.round(n/5)*5)):50;}
function normalizeBoostDuration(v){const n=Number(v);return Number.isFinite(n)?Math.max(75,Math.min(500,Math.round(n/25)*25)):150;}
function boostSettings(p){return {boostEnabled:p.boostEnabled===true,boostPower:normalizeBoostPower(p.boostPower),boostDuration:normalizeBoostDuration(p.boostDuration)};}
function cancelBoost(p){
 if(p.boostTimer!==null&&p.boostTimer!==undefined)clearTimeout(p.boostTimer);
 p.boostTimer=null;p.boostToken=(p.boostToken||0)+1;p.boostActive=false;
}
function startBoost(t,i,target){
 const p=t.ports[i];const peak=Math.min(100,normalizeBoostPower(p.boostPower));
 if(!p.boostEnabled||!t.device?.gatt?.connected||!target||Math.abs(target)>=peak)return false;
 const direction=Math.sign(target),duration=normalizeBoostDuration(p.boostDuration);
 cancelBoost(p);const token=p.boostToken;
 p.boostActive=true;
 // Three ascending PWM levels, with the last level held for one interval.
 const step=(index)=>{
  if(!p.boostActive||p.boostToken!==token||p.target!==target||!t.device?.gatt?.connected)return;
  p.actual=direction*Math.round(peak*(index+1)/3);
  void sendPort(t,i,p.actual);markMotion(t);update(t);
  if(index<2)p.boostTimer=setTimeout(()=>step(index+1),duration/3);
  else p.boostTimer=setTimeout(()=>{
   if(!p.boostActive||p.boostToken!==token||p.target!==target)return;
   p.boostTimer=null;p.boostActive=false;
   // With ramp enabled, ordinary ramp control resumes from the last boost step.
   // Otherwise restore the requested PWM immediately.
   if(!t.ramp){p.actual=p.target;void sendPort(t,i,p.actual);}
   markMotion(t);update(t);
  },duration/3);
 };
 step(0);return true;
}
function makePorts(entry={}){
  if(Array.isArray(entry.ports)&&entry.ports.length===2){
    return entry.ports.map(p=>({type:[MOTOR,LIGHTS,NONE].includes(p?.type)?p.type:NONE,reverse:p?.reverse===true,brightness:Number.isFinite(p?.brightness)?Math.max(0,Math.min(100,p.brightness)):100,...boostSettings(p||{}),boostActive:false,boostTimer:null,boostToken:0,target:0,actual:0,lightOn:false}));
  }
  // 1.0.x migration: keep the original motor, lights and direction settings.
  const motor=entry.port===1?1:0;
  const light=(entry.lightPort===0||entry.lightPort===1)&&entry.lightPort!==motor?entry.lightPort:-1;
  return [0,1].map(i=>({type:i===motor?MOTOR:i===light?LIGHTS:NONE,reverse:i===motor&&entry.reverse===true,brightness:Number.isFinite(entry.lightBrightness)?Math.max(0,Math.min(100,entry.lightBrightness)):100,...boostSettings({}),boostActive:false,boostTimer:null,boostToken:0,target:0,actual:0,lightOn:false}));
}
function isMotor(p){return p.type===MOTOR;}
function motorIndexes(t){return [0,1].filter(i=>isMotor(t.ports[i]));}
function lightIndexes(t){return [0,1].filter(i=>t.ports[i].type===LIGHTS);}
function motorsIdle(t){return t.ports.every(p=>!isMotor(p)||(p.target===0&&p.actual===0));}
function motorTargets(t,percent,selection=motorIndexes(t)){
  for(const i of selection){
   const p=t.ports[i];if(p.target===percent)continue;
   const fromRest=p.target===0&&p.actual===0&&!p.boostActive;
   cancelBoost(p);p.target=percent;
   if(fromRest&&startBoost(t,i,percent))continue;
   if(!t.ramp){p.actual=percent;void sendPort(t,i,percent);}
  }
  interact(t);markMotion(t);update(t);
}
function allMotorsOff(t,immediate=true){
  for(const i of motorIndexes(t)){const p=t.ports[i];cancelBoost(p);p.target=0;if(immediate){p.actual=0;void sendPort(t,i,0);}}
  interact(t);markMotion(t);update(t);
}
function updatePortControls(t){
  const container=t.card.querySelector('.motor-controls');
  container.replaceChildren();
  const motors=motorIndexes(t), linked=motors.length===2&&t.motorsLinked;
  const groups=linked?[motors]:motors.map(i=>[i]);
  for(const group of groups){
    const label=document.createElement('div');label.className='motor-label';label.textContent=`${tr('portMotor')} ${group[0]===0?'A':'B'}`;
    const row=document.createElement('div');row.className='motor-row';
    const slider=document.createElement('input');slider.type='range';slider.className='slider';slider.min='-100';slider.max='100';slider.step='1';slider.value=String(t.ports[group[0]].target);slider.dataset.port=String(group[0]);slider.setAttribute('aria-label',label.textContent);
    const reading=document.createElement('span');reading.className='reading';reading.textContent='0%';
    row.append(slider,reading);if(motors.length===2&&!linked)container.append(label);container.append(row);
    slider.addEventListener('input',()=>{const value=Number(slider.value);hapticForTargets([{hub:t,ports:group,target:value}]);motorTargets(t,value,group);});
  }
  if(!groups.length){const msg=document.createElement('span');msg.className='muted';msg.textContent=tr('noMotor');container.append(msg);}
  const lights=t.card.querySelector('.lights-controls');lights.replaceChildren();
  lights.classList.toggle('two-lights',lightIndexes(t).length===2);
  for(const i of lightIndexes(t)){
    const button=document.createElement('button');button.type='button';button.className='light-toggle';button.dataset.port=String(i);
    button.addEventListener('click',()=>{interact(t);void setPortLights(t,i,!t.ports[i].lightOn);});lights.append(button);
  }
  update(t);
}

function saveEnergySettings(){
  try{localStorage.setItem(ENERGY_STORAGE,JSON.stringify(energy));}
  catch(err){notice(`${tr('saveError')}: ${err.message}`);}
}
let lastHubIdleDisconnectAt=0;
function resetIdleClocks(){
  const now=Date.now();
  for(const t of trains.values()){
    t.lastInteraction=now;
    t.zeroSince=motorsIdle(t)?now:null;
  }
}
function interact(t){t.lastInteraction=Date.now();}
function markMotion(t){if(!motorsIdle(t))t.zeroSince=null;else if(t.zeroSince===null)t.zeroSince=Date.now();}
let energyCheckBusy=false;
async function checkEnergySaving(){
  if(!energy.enabled||energyCheckBusy)return;
  energyCheckBusy=true;
  try{
    const now=Date.now();
    const groups=[...duos.values()].map(d=>d.members.map(id=>trains.get(id)).filter(Boolean));
    for(const t of trains.values())if(!duoOf(t))groups.push([t]);
    for(const members of groups){
      const connected=members.filter(t=>t.device?.gatt?.connected);
      if(!connected.length||members.some(t=>t.connecting||t.idleDisconnect))continue;
      // A group is idle only if every motor is stopped and every ramp has completed.
      if(members.some(t=>!motorsIdle(t))){
        for(const t of members)if(!motorsIdle(t))t.zeroSince=null;
        continue;
      }
      for(const t of members)if(t.zeroSince===null)t.zeroSince=now;
      const idleFrom=Math.max(...members.map(t=>Math.max(t.lastInteraction,t.zeroSince)));
      if(now-idleFrom<energy.minutes*60000)continue;
      for(const t of connected)t.idleDisconnect=true;
      try{
        for(const t of connected)if(lightIndexes(t).length)await allLights(t,false);
        await Promise.allSettled(connected.map(t=>t.pending));
        // Check conditions again in case the user interacted during an async write.
        if(!energy.enabled||members.some(t=>!motorsIdle(t))||
           Date.now()-Math.max(...members.map(t=>Math.max(t.lastInteraction,t.zeroSince??Date.now())))<energy.minutes*60000)continue;
        // Mark all members intentional before disconnecting any Duo member.
        for(const t of connected)t.intentionalIdleDisconnect=true;
        for(const t of connected){
          if(t.device?.gatt?.connected){
           // Prefer a real LEGO hub shutdown over merely dropping the GATT connection.
           // Action 0x01 = Switch Off Hub (LEGO Wireless Protocol 3.0).
           try{await queueWrite(t,Uint8Array.of(4,0,0x02,0x01));}catch(err){console.warn('Hub shutdown action:',err);}
           if(t.device?.gatt?.connected)t.device.gatt.disconnect();
           lastHubIdleDisconnectAt=Date.now();notice(`${t.name} ${tr('energyDisconnected')}`);
          }
        }
      }finally{for(const t of connected)t.idleDisconnect=false;}
    }
    // Keep remotes connected until all hubs have been disconnected for at least 30 seconds.
  // Reconnection or renewed user activity cancels the pending remote shutdown.
  if(typeof remotes!=='undefined'){
   const now=Date.now(),allHubsOffline=[...trains.values()].every(t=>!t.device?.gatt?.connected&&!t.connecting);
   const allStopped=[...trains.values()].every(t=>motorsIdle(t));
   if(allHubsOffline&&allStopped){
    for(const r of remotes.values()){
     if(!r.device?.gatt?.connected||r.connecting||r.repeatTimers.size||r.stopTimers.size)continue;
     const earliest=Math.max(lastHubIdleDisconnectAt,r.lastActivity+energy.minutes*60000);
     if(now-earliest>=30000){r.device.gatt.disconnect();notice(`${r.name} ${tr('energyDisconnected')}`);}
    }
   }
  }
 }finally{energyCheckBusy=false;}
}

function readSaved(){
  try {
    const data=JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(data)
      ? data.filter(x=>x && typeof x.id==='string' && typeof x.name==='string').slice(0,25)
      : [];
  }catch(err){
    notice(`${tr('readError')}: ${err.message}`);
    return [];
  }
}
let saved=readSaved();
function saveStorage(){
  try {
    localStorage.setItem(STORAGE_KEY,JSON.stringify(saved));
  }catch(err){
    notice(`${tr('saveError')}: ${err.message}. ${tr('openSecure')}`);
  }
}
function readDuos(){try{const x=JSON.parse(localStorage.getItem(DUO_STORAGE)||'[]');return Array.isArray(x)?x.filter(d=>d&&typeof d.id==='string'&&Array.isArray(d.members)&&d.members.length===2):[];}catch{return [];}}
function saveDuos(){try{localStorage.setItem(DUO_STORAGE,JSON.stringify([...duos.values()].map(d=>({id:d.id,name:d.name,members:d.members}))));}catch(e){notice(`${tr('saveError')}: ${e.message}`);}}
function duoOf(t){return [...duos.values()].find(d=>d.members.includes(t.key));}
function duoReady(d){return d.members.every(id=>{const t=trains.get(id);return t?.device?.gatt?.connected&&!t.connecting&&motorIndexes(t).length>0;});}
function duoHalt(d,alert=false){
 d.target=0;d.actual=0;d.lightOn=false;
 for(const id of d.members){const t=trains.get(id);if(t)allMotorsOff(t,true);}
 if(d.card)d.card.querySelector('.slider').value='0';updateDuo(d);
 if(alert)notice(`${d.name}: ${tr('duoStopped')}`);
}
function updateDuos(){for(const d of duos.values())updateDuo(d);}
function refreshDuoOptions(){const free=[...trains.values()].filter(t=>!duoOf(t));for(const id of ['duo-first','duo-second']){const sel=$(id),old=sel.value;sel.replaceChildren();for(const t of free){const opt=document.createElement('option');opt.value=t.key;opt.textContent=t.name;sel.append(opt);}if(free.some(t=>t.key===old))sel.value=old;}const a=$('duo-first'),b=$('duo-second');if(a.options.length>1&&a.value===b.value)b.selectedIndex=1;$('duo-add').disabled=free.length<2;}
// Stable order keys distinguish hub entries from virtual Duo entries.
const ORDER_STORAGE='trenolegoble_control_order';
function readControlOrder(){
 try{const list=JSON.parse(localStorage.getItem(ORDER_STORAGE)||'[]');return Array.isArray(list)?list.filter(x=>typeof x==='string'):[];}
 catch{return [];}
}
let controlOrder=readControlOrder();
function displayedCards(){return [...$('trains').children].filter(el=>el.classList.contains('card')&&!el.hidden&&el.dataset.orderKey);}
function applyControlOrder(){
 const container=$('trains');
 const cards=displayedCards();
 // Unlisted cards follow the saved ones; hidden Duo members are not moved.
 cards.sort((a,b)=>{
  const ai=controlOrder.indexOf(a.dataset.orderKey),bi=controlOrder.indexOf(b.dataset.orderKey);
  return (ai<0?Number.MAX_SAFE_INTEGER:ai)-(bi<0?Number.MAX_SAFE_INTEGER:bi);
 });
 for(const card of cards)container.append(card);
}
function saveControlOrder(){
 const visible=displayedCards().map(card=>card.dataset.orderKey);
 // Preserve hidden train IDs for when a Duo is dissolved.
 controlOrder=[...visible,...controlOrder.filter(key=>!visible.includes(key))];
 try{localStorage.setItem(ORDER_STORAGE,JSON.stringify(controlOrder));}
 catch(err){console.warn('Cannot save train order:',err);}
}
function createReorderHandle(card,key){
 card.dataset.orderKey=key;
 const head=card.querySelector('.head');
 const handle=document.createElement('button');
 handle.type='button';handle.className='reorder-handle';handle.textContent='⠿';
 handle.title=tr('reorderTrain');handle.setAttribute('aria-label',tr('reorderTrain'));
 head.append(handle);
 let drag=null;
 const clearMarkers=()=>{for(const el of displayedCards())el.classList.remove('drag-drop-before','drag-drop-after');};
 const finish=()=>{
  if(!drag)return;
  card.classList.remove('drag-reordering');clearMarkers();
  if(drag.moved){
   if(drag.before&&drag.before.isConnected)$('trains').insertBefore(card,drag.before);
   else if(drag.after&&drag.after.isConnected)drag.after.after(card);
   saveControlOrder();
  }
  drag=null;
 };
 handle.addEventListener('pointerdown',e=>{
  if(e.button!==0||card.hidden)return;
  drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,moved:false};
  handle.setPointerCapture(e.pointerId);
 });
 handle.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  if(!drag.moved&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<6)return;
  drag.moved=true;card.classList.add('drag-reordering');
  const other=displayedCards().filter(el=>el!==card);
  let placed=false;
  clearMarkers();
  for(const candidate of other){
   const rect=candidate.getBoundingClientRect();
   if(e.clientY<rect.top+rect.height/2){
    drag.before=candidate;drag.after=null;
    candidate.classList.add('drag-drop-before');placed=true;break;
   }
  }
  if(!placed){
   const last=other[other.length-1];
   if(last){drag.after=last;drag.before=null;last.classList.add('drag-drop-after');}
  }
  if(e.clientY<42)window.scrollBy(0,-12);
  else if(e.clientY>window.innerHeight-42)window.scrollBy(0,12);
 });
 handle.addEventListener('pointerup',e=>{if(drag&&e.pointerId===drag.id)finish();});
 handle.addEventListener('pointercancel',finish);
 handle.addEventListener('lostpointercapture',finish);
 handle.addEventListener('keydown',e=>{
  if(e.key!=='ArrowUp'&&e.key!=='ArrowDown')return;
  const cards=displayedCards(),index=cards.indexOf(card);
  const destination=cards[index+(e.key==='ArrowUp'?-1:1)];
  if(!destination)return;
  e.preventDefault();
  if(e.key==='ArrowUp')destination.before(card);else destination.after(card);
  saveControlOrder();handle.focus();
 });
 return handle;
}
function cleanupDuoRemoteAssignments(){
 if(!remoteConfigReady)return;
 let changed=false;
 for(const r of remotes.values())for(const pair of r.pairs)for(const side of ['a','b']){
  const target=pair[side];
  if(target?.kind==='port'&&trains.has(target.id)&&duoOf(trains.get(target.id))){
   remoteCancelInput(r);pair[side]=null;changed=true;
  }
 }
 if(changed){saveRemotes();renderRemotes();notice(tr('remoteDuoExclusive'));}
}
function refreshDuoVisibility(){for(const t of trains.values())t.card.hidden=!!duoOf(t);refreshDuoOptions();updateDuos();applyControlOrder();updateStopAllButton();if(remoteConfigReady)cleanupDuoRemoteAssignments();}
function createDuo(data,persist=true){if(duos.has(data.id)||data.members.length!==2||data.members[0]===data.members[1]||data.members.some(id=>!trains.has(id)||duoOf(trains.get(id))))return false;
 const d={id:data.id,name:data.name||tr('duoLabel'),members:[...data.members],target:0,actual:0,lightOn:false,card:null,settingsCard:null};duos.set(d.id,d);
 const card=document.createElement('section');card.className='card';card.innerHTML=`<div class="head"><div class="connected-title"><span class="status"></span><strong class="train-title"></strong></div><div class="duo-summary telemetry-line"><span class="battery"></span><span class="rssi"></span></div></div><div class="duo-hubs"></div><div class="motor-row"><input class="slider" type="range" min="-100" max="100" step="1" value="0" aria-label="${tr('motorPower')}"><span class="reading">0%</span></div><div class="train-actions"><button class="reconnect">${tr('reconnect')}</button><button class="light-toggle">${tr('lightsOn')}</button><button class="danger stop">STOP</button></div>`;
 const settings=document.createElement('div');settings.className='card';settings.innerHTML=`<div class="head"><strong class="train-title"></strong></div><div class="controls"><label class="field">${tr('duoName')}<input class="trainname" maxlength="48"></label><button class="danger remove-duo">${tr('removeDuo')}</button></div><div class="duo-note"></div>`;
 d.card=card;d.settingsCard=settings;createReorderHandle(card,'duo:'+d.id);card.querySelector('.train-title').textContent=d.name;settings.querySelector('.train-title').textContent=d.name;settings.querySelector('.trainname').value=d.name;
 settings.querySelector('.trainname').addEventListener('change',e=>{d.name=e.target.value.trim()||tr('duoLabel');e.target.value=d.name;card.querySelector('.train-title').textContent=d.name;settings.querySelector('.train-title').textContent=d.name;saveDuos();});
 settings.querySelector('.remove-duo').addEventListener('click',()=>{duoHalt(d);duos.delete(d.id);card.remove();settings.remove();saveDuos();refreshDuoVisibility();renderEmpty();});
 card.querySelector('.slider').addEventListener('input',e=>{if(!duoReady(d)){duoHalt(d);notice(tr('duoConnectFirst'));return;}d.target=Number(e.target.value);hapticForTargets(d.members.map(id=>({hub:trains.get(id),ports:motorIndexes(trains.get(id)),target:d.target})));for(const id of d.members)interact(trains.get(id));applyDuoTarget(d);updateDuo(d);});
 card.querySelector('.stop').addEventListener('click',()=>{hapticForTargets(d.members.map(id=>({hub:trains.get(id),ports:motorIndexes(trains.get(id)),target:0})),true);for(const id of d.members)interact(trains.get(id));d.target=0;d.card.querySelector('.slider').value='0';applyDuoTarget(d);updateDuo(d);});
 card.querySelector('.reconnect').addEventListener('click',()=>{const missing=d.members.map(id=>trains.get(id)).filter(t=>!t.device?.gatt?.connected);if(missing.length)void reconnect(missing[0]);});
 card.querySelector('.light-toggle').addEventListener('click',async()=>{if(!duoReady(d))return;for(const id of d.members)interact(trains.get(id));d.lightOn=!d.lightOn;await Promise.allSettled(d.members.map(id=>{const t=trains.get(id);return allLights(t,d.lightOn);}));updateDuo(d);});
 $('trains').append(card);$('duo-settings').append(settings);if(persist)saveDuos();refreshDuoVisibility();renderEmpty();return true;
}
function applyDuoTarget(d){
 if(!duoReady(d)){duoHalt(d,true);return;}
 for(const id of d.members){const t=trains.get(id);motorTargets(t,d.target);}
}
function updateDuo(d){
 if(!d.card)return;
 const ready=duoReady(d);
 d.card.querySelector('.status').replaceChildren(statusDot(ready));
 d.card.querySelector('.slider').disabled=!ready;
 d.card.querySelector('.reconnect').disabled=ready;
 d.card.querySelector('.stop').disabled=!d.members.some(id=>!!trains.get(id)?.device?.gatt?.connected);
 d.card.querySelector('.reading').textContent=`${d.target>0?'+':''}${d.target}%`;
 const members=d.members.map(id=>trains.get(id));
 const allConnected=members.every(t=>!!t?.device?.gatt?.connected);
 const batteryKnown=allConnected&&members.every(t=>Number.isFinite(t.battery));
 const signalKnown=allConnected&&members.every(t=>Number.isFinite(t.rssi));
 const averageBattery=batteryKnown?Math.round(members.reduce((sum,t)=>sum+t.battery,0)/members.length):null;
 const weakestSignal=signalKnown?Math.min(...members.map(t=>t.rssi)):null;
 const summary=d.card.querySelector('.duo-summary');
 const summaryBattery=summary.querySelector('.battery');
 const summaryRssi=summary.querySelector('.rssi');
 summaryBattery.textContent=`🔋 ${averageBattery===null?'—':averageBattery+'%'}`;
 summaryBattery.classList.toggle('low',averageBattery!==null&&averageBattery<=20);
 summaryRssi.textContent=`📡 ${weakestSignal===null?'—':weakestSignal+' dBm'}`;
 summaryRssi.classList.toggle('weak',weakestSignal!==null&&weakestSignal<=-85);
 const hubs=d.card.querySelector('.duo-hubs');
 hubs.replaceChildren();
 for(const t of members){
  const div=document.createElement('div');div.className='duo-hub';
  const strong=document.createElement('strong');strong.textContent=t.name;
  const status=document.createElement('span');status.className='status';status.append(statusDot(!!t.device?.gatt?.connected));
  const battery=document.createElement('span');battery.className='battery';battery.textContent=`🔋 ${t.device?.gatt?.connected&&t.battery!==null?t.battery+'%':'—'}`;
  battery.classList.toggle('low',t.battery!==null&&t.battery<=20);
  const rssi=document.createElement('span');rssi.className='rssi';rssi.textContent=`📡 ${t.device?.gatt?.connected&&t.rssi!==null?t.rssi+' dBm':'—'}`;
  rssi.classList.toggle('weak',t.rssi!==null&&t.rssi<=-85);
  const memberTitle=document.createElement('div');memberTitle.className='duo-member-title';memberTitle.append(status,strong);
  const memberTelemetry=document.createElement('div');memberTelemetry.className='duo-member-telemetry';memberTelemetry.append(battery,rssi);
  div.append(memberTitle,memberTelemetry);hubs.append(div);
 }
 d.card.querySelector('.light-toggle').hidden=!members.some(t=>lightIndexes(t).length>0);
 d.card.querySelector('.light-toggle').disabled=!ready;
 d.card.querySelector('.light-toggle').textContent=d.lightOn?tr('lightsOff'):tr('lightsOn');
 d.settingsCard.querySelector('.duo-note').textContent=members.map(t=>t.name).join(' + ');
}
function saveTrain(t){
 const record={id:t.key,name:t.name,ports:t.ports.map(p=>({type:p.type,reverse:p.reverse,brightness:p.brightness,boostEnabled:p.boostEnabled,boostPower:p.boostPower,boostDuration:p.boostDuration})),motorsLinked:t.motorsLinked,ramp:t.ramp,bluetoothName:t.bluetoothName,ledMode:t.ledMode,ledIndex:t.ledIndex};
 saved=saved.filter(x=>x.id!==record.id);saved.push(record);saveStorage();
}
const $=id=>document.getElementById(id);
Object.assign(I18N.it,{hapticEnable:'Abilita feedback aptico',batteryLowTitle:'Batteria quasi scarica',batteryLowMessage:'Sostituire o ricaricare le batterie.',remoteInfo:'Informazioni telecomando'});
Object.assign(I18N.en,{hapticEnable:'Enable haptic feedback',batteryLowTitle:'Low battery',batteryLowMessage:'Replace or recharge the batteries.',remoteInfo:'Remote information'});
$('haptic-enabled').checked=hapticEnabled;
$('haptic-enabled').nextElementSibling.textContent=tr('hapticEnable');
$('haptic-enabled').addEventListener('change',e=>{hapticEnabled=e.target.checked;localStorage.setItem(HAPTIC_STORAGE,String(hapticEnabled));if(!hapticEnabled&&navigator.vibrate)navigator.vibrate(0);});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function notice(msg){
  console.log('[TrenoLegoBLE]',msg);
  const stack=$('message');
  const toast=document.createElement('div');
  toast.className='toast visible';
  toast.textContent=msg;
  stack.append(toast);
  setTimeout(()=>{
    toast.classList.remove('visible');
    toast.classList.add('leaving');
    setTimeout(()=>toast.remove(),700);
  },4200);
}
function command(port,power){return Uint8Array.of(8,0,0x81,port,0x11,0x51,0, power & 255);}
function queueWrite(t,bytes){
  t.pending=t.pending.catch(()=>{}).then(async()=>{
    if(!t.device.gatt.connected)throw Error(tr('hubDisconnected'));
    if(t.char.writeValueWithoutResponse)await t.char.writeValueWithoutResponse(bytes);
    else await t.char.writeValue(bytes);
  });
  return t.pending;
}
// LEGO Powered Up internal LED port 0x32: preset color mode (0).
// Previous RGB configuration keys are deliberately ignored, with no migration.
const LED_SWATCHES=['#343434','#ff69b4','#a020f0','#0066ff','#66bfff','#00ffff','#00cc00','#ffdd00','#ff8800','#ff2020','#ffffff'];
function normalizeLedIndex(value){const n=Number(value);return Number.isInteger(n)&&n>=0&&n<=10?n:3;}
async function applyHubLed(t,notify=false){
 if(t.ledMode!=='preset'||!t.device?.gatt?.connected||!t.char)return;
 try{
  // Select indexed color mode 0, then send the index through WriteDirectModeData.
  await queueWrite(t,Uint8Array.of(10,0,0x41,0x32,0x00,1,0,0,0,0));
  await queueWrite(t,Uint8Array.of(8,0,0x81,0x32,0x11,0x51,0x00,normalizeLedIndex(t.ledIndex)));
  if(notify)notice(`${t.name}: ${tr('ledApplied')}`);
 }catch(err){console.warn('Hub LED:',err);if(notify)notice(`${t.name}: ${tr('ledError')}: ${err.message}`);}
}
// LEGO Version Number Encoding: 4 bytes, little endian and BCD.
function decodeBCD(byte){return (byte>>4)*10+(byte&15);}
// --- LEGO firmware and hardware version decoding ---
function decodeVersion(view){
  if(view.byteLength<9)return null;
  const b0=view.getUint8(5),b1=view.getUint8(6),b2=view.getUint8(7),b3=view.getUint8(8);
  const digits=[b0>>4,b0&15,b1>>4,b1&15,b2>>4,b2&15,b3&15];
  if(digits.some(d=>d>9))return null;
  const major=(b3>>4)&7, minor=b3&15;
  return `${major}.${minor}.${decodeBCD(b2)}.${decodeBCD(b1)*100+decodeBCD(b0)}`;
}
function infoText(t,key){
  const val=t.hubInfo?.[key];
  if(key==='batteryType'&&val!==null&&val!==undefined)return val===0?tr('batteryNormal'):val===1?tr('batteryRechargeable'):tr('hubUnknown');
  return val??'—';
}
// --- Hub telemetry and expandable information display ---
function updateHubInfo(t){
  if(!t.settingsCard)return;
  for(const key of ['firmwareVersion','hardwareVersion','radioFirmwareVersion','protocolVersion','batteryType']){
    const el=t.settingsCard.querySelector(`[data-hub-info="${key}"]`);
    if(el)el.textContent=t.device?.gatt?.connected?infoText(t,key):'—';
  }
}
function updateStopAllButton(){
 const anyConnected=[...trains.values()].some(t=>!!t.device?.gatt?.connected);
 $('stopall').disabled=!anyConnected;
}
function statusDot(connected){
 const dot=document.createElement('span');
 dot.className='connection-dot '+(connected?'is-connected':'is-disconnected');
 dot.setAttribute('role','img');
 dot.setAttribute('aria-label',connected?tr('connected'):tr('disconnected'));
 dot.title=connected?tr('connected'):tr('disconnected');
 return dot;
}
function updateRSSI(t){
  const el=t.card?.querySelector('.rssi');
  if(el){el.textContent=`📡 ${t.device?.gatt?.connected&&t.rssi!==null?t.rssi+' dBm':'—'}`;el.classList.toggle('weak',t.rssi!==null&&t.rssi<=-85);}
}
function update(t){
 if(!t.card||!t.settingsCard)return;
 const connected=!!t.device?.gatt?.connected;
 t.card.querySelector('.status').replaceChildren(statusDot(connected));
 t.settingsCard.querySelector('.status').textContent=connected?tr('connected'):tr('disconnected');
 for(const battery of [t.card,t.settingsCard].map(el=>el.querySelector('.battery'))){
  battery.textContent=battery.closest('.card')===t.card?(connected?`🔋 ${t.battery===null?tr('waiting'):t.battery+'%'}`:'🔋 —'):(connected?(t.battery===null?`🔋 ${tr('waiting')}`:`🔋 ${t.battery}%`):'🔋 —');
  battery.classList.toggle('low',t.battery!==null&&t.battery<=20);
 }
 for(const row of t.card.querySelectorAll('.motor-row')){
   const slider=row.querySelector('.slider'),i=Number(slider.dataset.port),p=t.ports[i];
   slider.disabled=!connected;
   if(document.activeElement!==slider)slider.value=String(p.target);
   const actual=p.actual;row.querySelector('.reading').textContent=`${actual>0?'+':''}${actual}%`;
 }
 for(const button of t.card.querySelectorAll('.light-toggle')){
   const p=t.ports[Number(button.dataset.port)];button.disabled=!connected;
   {const text=p.lightOn?tr('lightsOff'):tr('lightsOn');const suffix=lightIndexes(t).length===2?' '+(button.dataset.port==='0'?'A':'B'):'';button.textContent=text.replace(/^(Luci|Lights)/,'$1'+suffix);}
 }
 t.card.querySelector('.reconnect').disabled=connected||!!t.connecting;
 t.card.querySelector('.stop').disabled=!connected;
 t.settingsCard.querySelectorAll('.bluetooth-read,.bluetooth-set,.bluetooth-reset').forEach(b=>b.disabled=!connected);
 t.settingsCard.querySelector('.disconnect').disabled=!connected;
 updateRSSI(t);updateHubInfo(t);updateDuos();updateStopAllButton();
}
async function sendPort(t,i,power){
 if(!t.device?.gatt?.connected||!isMotor(t.ports[i]))return;
 const value=t.ports[i].reverse?-power:power;
 try{await queueWrite(t,command(i,value));}catch(err){notice(`${t.name}: ${err.message}`);}
}
function halt(t){allMotorsOff(t,true);}
async function setPortLights(t,i,enabled){
 const p=t.ports[i];if(p.type!==LIGHTS)return;
 p.lightOn=enabled;update(t);
 if(t.device?.gatt?.connected){
  try{await queueWrite(t,command(i,enabled?p.brightness:0));}
  catch(err){notice(`${t.name}: ${tr('lightsError')}: ${err.message}`);}
 }
}
async function allLights(t,enabled){
 for(const i of lightIndexes(t))await setPortLights(t,i,enabled);
}

function bluetoothNameDisplay(t){
  const el=t.settingsCard?.querySelector('.bluetooth-current');
  if(el)el.textContent=t.bluetoothName??tr('bluetoothUnknown');
  const input=t.settingsCard?.querySelector('.bluetooth-name');
  if(input && !input.dataset.edited && document.activeElement!==input)
    input.value=t.bluetoothName??t.device?.name??'';
}
async function readBluetoothName(t){
  if(!t.device?.gatt?.connected){notice(tr('bluetoothOffline'));return;}
  try{
    await queueWrite(t,Uint8Array.of(5,0,1,1,5));
  }catch(e){notice(`${t.name}: ${tr('bluetoothError')}: ${e.message}`);}
}
async function setBluetoothName(t){
  const name=t.settingsCard.querySelector('.bluetooth-name').value.trim();
  if(!/^[\x20-\x7E]{1,14}$/.test(name)){notice(tr('bluetoothInvalid'));return;}
  if(!t.device?.gatt?.connected){notice(tr('bluetoothOffline'));return;}
  const bytes=new TextEncoder().encode(name);
  try{
    await queueWrite(t,Uint8Array.of(5+bytes.length,0,1,1,1,...bytes));
    notice(`${t.name}: ${tr('bluetoothSent')}: ${name}`);
    const input=t.settingsCard.querySelector('.bluetooth-name');
    delete input.dataset.edited;
    await readBluetoothName(t);
  }catch(e){notice(`${t.name}: ${tr('bluetoothError')}: ${e.message}`);}
}
async function resetBluetoothName(t){
  if(!t.device?.gatt?.connected){notice(tr('bluetoothOffline'));return;}
  if(!confirm(tr('bluetoothConfirmReset')))return;
  try{
    await queueWrite(t,Uint8Array.of(5,0,1,1,4));
    notice(`${t.name}: ${tr('bluetoothResetSent')}`);
    const input=t.settingsCard.querySelector('.bluetooth-name');
    delete input.dataset.edited;
    await readBluetoothName(t);
  }catch(e){notice(`${t.name}: ${tr('bluetoothError')}: ${e.message}`);}
}
// --- Hub cards, motor controls and per-hub settings ---
function createCard(t){
 const card=document.createElement('section');card.className='card';
 card.innerHTML=`<div class="head"><div class="connected-title"><span class="status"></span><span class="train-title"></span></div><div class="telemetry-line"><span class="battery"></span><span class="rssi"></span></div></div><div class="motor-controls"></div><div class="train-actions"><button class="reconnect">${tr('reconnect')}</button><button class="danger stop">STOP</button><div class="lights-controls"></div></div>`;
 const settings=document.createElement('section');settings.className='card';
 settings.innerHTML=`<div class="head"><span class="train-title"></span><span class="status"></span><span class="battery"></span></div><div class="setting-grid"><label class="field">${tr('name')}<input class="trainname" type="text" maxlength="48"></label><label class="field">${tr('acceleration')}<label class="check"><input class="ramp" type="checkbox"> ${tr('ramp')}</label></label></div><div class="port-settings"></div><label class="check"><input class="motors-linked" type="checkbox"> ${tr('linkMotors')}</label><div class="bluetooth-name-setting"><label class="field">${tr('bluetoothName')}<input class="trainname bluetooth-name" type="text" maxlength="14" autocomplete="off" spellcheck="false"></label><small class="muted">${tr('bluetoothCurrent')}: <strong class="bluetooth-current">${tr('bluetoothUnknown')}</strong></small><div class="controls"><button type="button" class="bluetooth-read">${tr('bluetoothRead')}</button><button type="button" class="bluetooth-set">${tr('bluetoothSet')}</button><button type="button" class="bluetooth-reset">${tr('bluetoothReset')}</button></div><small class="muted">${tr('bluetoothNameHelp')}</small></div><div class="hub-led-setting"><strong>${tr('ledTitle')}</strong><label class="check"><input class="hub-led-enabled" type="checkbox"> ${tr('ledCustom')}</label><div class="hub-led-color"><label for="" class="muted">${tr('ledColor')}</label><select class="hub-led-picker" aria-label="${tr('ledColor')}">${tr('ledColors').map((name,i)=>`<option value="${i}">${name}</option>`).join('')}</select><span class="hub-led-preview" aria-hidden="true"></span></div><small class="muted">${tr('ledNative')}</small></div><details class="hub-information"><summary>${tr('hubInfo')}</summary><div class="hub-info-grid">${[['firmwareVersion','firmwareVersion'],['hardwareVersion','hardwareVersion'],['radioFirmwareVersion','radioFirmwareVersion'],['protocolVersion','protocolVersion'],['batteryType','batteryType']].map(([label,key])=>`<div class="hub-info-field"><span class="muted">${tr(label)}</span><strong data-hub-info="${key}">—</strong></div>`).join('')}</div></details><div class="controls"><button class="disconnect">${tr('disconnect')}</button><button class="forget danger">${tr('delete')}</button></div>`;
 // Show detailed hub information directly below the hub name.
 // The collapsible panel mirrors the remote controller information UI.
 const hubDetails=settings.querySelector('.hub-information');
 settings.querySelector('.head').after(hubDetails);
 t.card=card;t.settingsCard=settings;createReorderHandle(card,'hub:'+t.key);
 const ledCheck=settings.querySelector('.hub-led-enabled');
 const ledPicker=settings.querySelector('.hub-led-picker');
 const ledRow=settings.querySelector('.hub-led-color');
 const ledPreview=settings.querySelector('.hub-led-preview');
 ledCheck.checked=t.ledMode==='preset';
 ledPicker.value=String(normalizeLedIndex(t.ledIndex));
 ledRow.hidden=!ledCheck.checked;
 const refreshLedPreview=()=>{ledPreview.style.backgroundColor=LED_SWATCHES[normalizeLedIndex(ledPicker.value)];};
 refreshLedPreview();
 ledCheck.addEventListener('change',()=>{
  t.ledMode=ledCheck.checked?'preset':'native';
  ledRow.hidden=t.ledMode!=='preset';
  saveTrain(t);
  // No LED commands in native mode; firmware may need restart to take over.
  if(t.ledMode==='preset')void applyHubLed(t,true);
 });
 ledPicker.addEventListener('change',()=>{
  t.ledIndex=normalizeLedIndex(ledPicker.value);
  refreshLedPreview();
  saveTrain(t);
  if(t.ledMode==='preset')void applyHubLed(t,true);
 });
 for(let i=0;i<2;i++){
  const box=document.createElement('div');box.className='port-box';box.dataset.port=String(i);
  box.innerHTML=`<strong>${i===0?tr('portA'):tr('portB')}</strong><label class="field">${tr('deviceType')}<select class="port-type"><option value="motor">${tr('motor')}</option><option value="lights">${tr('lights')}</option><option value="none">${tr('nothing')}</option></select></label><label class="check"><input type="checkbox" class="port-reverse"> ${tr('reverse')}</label><label class="field light-brightness">${tr('brightness')}<div class="port-light-brightness"><input type="range" min="0" max="100" step="5" class="light-slider"><span class="light-value"></span></div></label><div class="port-boost"><strong>${tr('boostTitle')}</strong><label class="check"><input type="checkbox" class="boost-enabled"> ${tr('boostEnable')}</label><div class="boost-options"><label class="field">${tr('boostPower')}<div class="port-light-brightness"><input type="range" min="20" max="100" step="5" class="boost-power"><span class="boost-power-value"></span></div></label><label class="field">${tr('boostDuration')}<div class="port-light-brightness"><input type="range" min="75" max="500" step="25" class="boost-duration"><span class="boost-duration-value"></span></div></label><small class="muted">${tr('boostHelp')}</small></div></div>`;
  settings.querySelector('.port-settings').append(box);
  const sel=box.querySelector('.port-type'),reverse=box.querySelector('.port-reverse'),brightness=box.querySelector('.light-slider');
  sel.value=t.ports[i].type;reverse.checked=t.ports[i].reverse;brightness.value=String(t.ports[i].brightness);
  const boostEnabled=box.querySelector('.boost-enabled');
  const boostPower=box.querySelector('.boost-power'),boostDuration=box.querySelector('.boost-duration');
  boostEnabled.checked=t.ports[i].boostEnabled;
  boostPower.value=String(t.ports[i].boostPower);boostDuration.value=String(t.ports[i].boostDuration);
  const refresh=()=>{
   reverse.closest('.check').hidden=t.ports[i].type!==MOTOR;
   box.querySelector('.light-brightness').hidden=t.ports[i].type!==LIGHTS;
   box.querySelector('.light-value').textContent=`${t.ports[i].brightness}%`;
   box.querySelector('.port-boost').hidden=t.ports[i].type!==MOTOR;
   box.querySelector('.boost-options').hidden=!t.ports[i].boostEnabled;
   box.querySelector('.boost-power-value').textContent=`${t.ports[i].boostPower}%`;
   box.querySelector('.boost-duration-value').textContent=`${t.ports[i].boostDuration} ms`;
  };
  boostEnabled.addEventListener('change',()=>{const port=t.ports[i];port.boostEnabled=boostEnabled.checked;if(port.boostActive){cancelBoost(port);if(!t.ramp){port.actual=port.target;void sendPort(t,i,port.actual);}update(t);}refresh();saveTrain(t);});
  boostPower.addEventListener('input',()=>{t.ports[i].boostPower=normalizeBoostPower(boostPower.value);refresh();saveTrain(t);});
  boostDuration.addEventListener('input',()=>{t.ports[i].boostDuration=normalizeBoostDuration(boostDuration.value);refresh();saveTrain(t);});
  sel.addEventListener('change',async()=>{
   const p=t.ports[i];const old=p.type;
   // Stop the previous device before changing its port assignment.
   if(old===MOTOR){cancelBoost(p);p.target=0;p.actual=0;if(t.device?.gatt?.connected)await queueWrite(t,command(i,0)).catch(console.warn);}
   else if(old===LIGHTS&&p.lightOn){await setPortLights(t,i,false);}
   p.type=sel.value;p.target=0;p.actual=0;p.lightOn=false;
   if(motorIndexes(t).length!==2)t.motorsLinked=false;
   if(duoOf(t))duoHalt(duoOf(t));
   interact(t);markMotion(t);refresh();refreshLink();updatePortControls(t);saveTrain(t);
  });
  reverse.addEventListener('change',()=>{t.ports[i].reverse=reverse.checked;interact(t);saveTrain(t);if(isMotor(t.ports[i])&&t.device?.gatt?.connected)void sendPort(t,i,t.ports[i].actual);});
  brightness.addEventListener('input',()=>{t.ports[i].brightness=Number(brightness.value);interact(t);refresh();saveTrain(t);if(t.ports[i].lightOn)void setPortLights(t,i,true);});
  refresh();
 }
 const linked=settings.querySelector('.motors-linked');
 function refreshLink(){linked.disabled=motorIndexes(t).length!==2;linked.checked=t.motorsLinked&&motorIndexes(t).length===2;}
 linked.addEventListener('change',()=>{
  // Stop both motors before changing control topology.
  allMotorsOff(t,true);t.motorsLinked=linked.checked;saveTrain(t);updatePortControls(t);
 });
 refreshLink();
 const btInput=settings.querySelector('.bluetooth-name');btInput.value=t.bluetoothName??t.device?.name??'';
 btInput.addEventListener('input',()=>{btInput.dataset.edited='true';});bluetoothNameDisplay(t);
 settings.querySelector('.bluetooth-read').addEventListener('click',()=>void readBluetoothName(t));
 settings.querySelector('.bluetooth-set').addEventListener('click',()=>void setBluetoothName(t));
 settings.querySelector('.bluetooth-reset').addEventListener('click',()=>void resetBluetoothName(t));
 const title=()=>{card.querySelector('.train-title').textContent=t.name;settings.querySelector('.train-title').textContent=t.name;refreshDuoOptions();updateDuos();};title();
 const name=settings.querySelector('.trainname');name.value=t.name;
 name.addEventListener('change',()=>{t.name=name.value.trim()||t.device?.name||tr('train');name.value=t.name;title();saveTrain(t);});
 const ramp=settings.querySelector('.ramp');ramp.checked=t.ramp;
 ramp.addEventListener('change',()=>{t.ramp=ramp.checked;saveTrain(t);});
 card.querySelector('.stop').addEventListener('click',()=>{hapticForTargets([{hub:t,ports:motorIndexes(t),target:0}],true);motorTargets(t,0);});
 card.querySelector('.reconnect').addEventListener('click',()=>void reconnect(t));
 settings.querySelector('.disconnect').addEventListener('click',async()=>{await allLights(t,false);halt(t);await t.pending.catch(()=>{});t.device?.gatt?.disconnect();});
 settings.querySelector('.forget').addEventListener('click',async()=>{
  if(!window.confirm(tr('confirmDelete').replace('{name}',t.name)))return;
  if(t.device?.gatt?.connected){await allLights(t,false);halt(t);await t.pending.catch(()=>{});t.device.gatt.disconnect();}
  const group=duoOf(t);if(group){duoHalt(group);duos.delete(group.id);group.card.remove();group.settingsCard.remove();saveDuos();}
  trains.delete(t.key);saved=saved.filter(x=>x.id!==t.key);saveStorage();card.remove();settings.remove();refreshDuoVisibility();renderEmpty();
 });
 $('trains').append(card);$('settings-trains').append(settings);updatePortControls(t);refreshDuoVisibility();renderEmpty();
}
function renderEmpty(){
  for(const [id,container,msg] of [['trains',$('trains'),tr('noTrains')],['settings-trains',$('settings-trains'),tr('noHubs')]]){
    let el=container.querySelector('.empty');
    if(!trains.size&&!el){el=document.createElement('p');el.className='empty';el.textContent=msg;container.append(el);}
    if(trains.size&&el)el.remove();
  }
}
function showPage(page){
  for(const p of ['controls','remotes','settings'])$('page-'+p).hidden=page!==p;
  for(const p of ['controls','remotes','settings']){$('tab-'+p).classList.toggle('active',p===page);if(p===page)$('tab-'+p).setAttribute('aria-current','page');else $('tab-'+p).removeAttribute('aria-current');}
}
const energyCheck=$('energy-enabled'),energyInput=$('energy-minutes');
energyCheck.checked=energy.enabled;
energyInput.value=String(energy.minutes);
energyInput.disabled=!energy.enabled;
energyCheck.addEventListener('change',()=>{
  energy.enabled=energyCheck.checked;
  energyInput.disabled=!energy.enabled;
  resetIdleClocks();saveEnergySettings();
});
energyInput.addEventListener('change',()=>{
  energy.minutes=validEnergyMinutes(energyInput.value);
  energyInput.value=String(energy.minutes);
  resetIdleClocks();saveEnergySettings();
});
$('tab-controls').addEventListener('click',()=>showPage('controls'));
$('tab-settings').addEventListener('click',()=>showPage('settings'));
$('tab-remotes').addEventListener('click',()=>{renderRemotes();showPage('remotes');});
function attachDevice(t,device){
  if(t.device===device)return;
  if(t.device&&t.disconnectListener)t.device.removeEventListener('gattserverdisconnected',t.disconnectListener);
  t.device=device;
  if(t.bluetoothName==null && device.name) t.bluetoothName=device.name;
  bluetoothNameDisplay(t);
  t.disconnectListener=()=>{
    if(trains.get(t.key)!==t)return;
    const group=duoOf(t);const idle=!!t.intentionalIdleDisconnect;t.intentionalIdleDisconnect=false;if(group)duoHalt(group,!idle);
    for(const p of t.ports){cancelBoost(p);p.target=0;p.actual=0;p.lightOn=false;}t.battery=null;t.rssi=null;t.hubInfo={};update(t);
    if(!idle)notice(`${t.name} ${tr('lost')}`);
  };
  device.addEventListener('gattserverdisconnected',t.disconnectListener);
}
async function connectDevice(t,device){
  if(t.connecting)return;
  t.connecting=true;update(t);
  try{
    const server=await device.gatt.connect();
    const service=await server.getPrimaryService(SERVICE);
    t.char=await service.getCharacteristic(CHARACTERISTIC);
    attachDevice(t,device);
    t.battery=null;t.rssi=null;t.hubInfo={};
    // LEGO Wireless Protocol: Hub Properties (0x01), Battery Voltage (0x06).
    // Subscribe to property updates (operation 0x02), received as 0x06.
    if(t.notificationChar&&t.batteryListener)
      t.notificationChar.removeEventListener('characteristicvaluechanged',t.batteryListener);
    t.notificationChar=t.char;
    t.batteryListener=event=>{
      const view=event.target.value;
      if(view.byteLength>=5&&view.getUint8(2)===0x82&&view.getUint8(3)===0x32){
        const feedback=view.getUint8(4);
        console.debug('[TrenoLegoBLE] LED output feedback:',feedback.toString(16));
        if(feedback&0x04)console.warn('[TrenoLegoBLE] LED command discarded by hub',t.name);
        return;
      }
      if(view.byteLength<5||view.getUint8(2)!==0x01)return;
      // Hub Properties: Advertising Name (0x01), Update (0x06)
      if(view.getUint8(3)===0x01&&view.getUint8(4)===0x06){
        const bytes=new Uint8Array(view.buffer,view.byteOffset+5,view.byteLength-5);
        const name=new TextDecoder().decode(bytes).replace(/\0+$/,'');
        t.bluetoothName=name;
        bluetoothNameDisplay(t);
        // Never change the user's train name or automatically write the hub name.
        saveTrain(t);
        return;
      }
      if(view.getUint8(4)!==0x06)return;
      const property=view.getUint8(3);
      if(property===0x03||property===0x04){
        const version=decodeVersion(view);
        if(version!==null)t.hubInfo[property===0x03?'firmwareVersion':'hardwareVersion']=version;
      }else if(property===0x05&&view.byteLength>=6){
        t.rssi=view.getInt8(5);
      }else if(property===0x06&&view.byteLength>=6){
        const value=view.getUint8(5);if(value<=100){t.battery=value;checkLowBattery('hub:'+t.key,t.name,value);}
      }else if(property===0x07&&view.byteLength>=6){
        t.hubInfo.batteryType=view.getUint8(5);
      }else if(property===0x09&&view.byteLength>=6){
        const data=new Uint8Array(view.buffer,view.byteOffset+5,view.byteLength-5);
        t.hubInfo.radioFirmwareVersion=new TextDecoder().decode(data).replace(/\0+$/,'');
      }else if(property===0x0A&&view.byteLength>=7){
        const lo=view.getUint8(5),hi=view.getUint8(6);
        if([lo>>4,lo&15,hi>>4,hi&15].every(d=>d<=9))
          t.hubInfo.protocolVersion=`${decodeBCD(hi)}.${decodeBCD(lo)}`;
      }
      update(t);
    };
    try{
      await t.char.startNotifications();
      t.char.addEventListener('characteristicvaluechanged',t.batteryListener);
      // Request current level (0x05) and subscribe to changes (0x02).
      await queueWrite(t,Uint8Array.of(5,0,1,6,2));
      await queueWrite(t,Uint8Array.of(5,0,1,6,5));
      // RSSI property supports periodic updates and a current-value request.
      // Version properties provide one-time responses (operation 0x05).
      for(const [property,operation] of [[5,2],[5,5],[3,5],[4,5],[9,5],[10,5],[7,5]]){
        try{await queueWrite(t,Uint8Array.of(5,0,1,property,operation));}
        catch(err){console.warn('Hub property request failed:',property,err);}
      }
      await readBluetoothName(t);
    }catch(batteryError){
      console.warn('Lettura batteria non disponibile:',batteryError);
    }
    for(const p of t.ports){cancelBoost(p);p.target=0;p.actual=0;p.lightOn=false;}t.lastInteraction=Date.now();t.zeroSince=t.lastInteraction;t.intentionalIdleDisconnect=false;
    await applyHubLed(t);
    update(t);notice(`${t.name} ${tr('connectedNotice')}`);
  }catch(err){
    if(device.gatt?.connected)device.gatt.disconnect();
    notice(`${tr('connectionFailed')}: ${t.name} (${err.name}): ${err.message}`);
    console.error('Errore GATT',t.name,err);
  }finally{t.connecting=false;update(t);updateDuos();}
}
async function reconnect(t){
  if(t.connecting||t.device?.gatt?.connected)return;
  if(!navigator.bluetooth){notice(tr('bluetoothUnavailable'));return;}
  // IMPORTANT: requestDevice must be the first asynchronous operation
  // in the click handler's call chain (transient user activation).
  try{
    const device=await navigator.bluetooth.requestDevice({filters:[{services:[SERVICE]}]});
    if(device.id!==t.key){
      notice(`${tr('wrongHub')} ${t.name}. ${tr('usePair')}`);
      return;
    }
    attachDevice(t,device);
    await connectDevice(t,device);
  }catch(err){
    if(err.name!=='NotFoundError')notice(`${tr('reconnectionFailed')}: ${t.name} (${err.name}): ${err.message}`);
  }
}
// A requestDevice() chooser selects only one device. Subsequent chooser calls need
// a fresh user gesture, so Reconnect all offers a guided multi-step workflow.
let reconnectFlow=false;
let reconnectBusy=false;
function missingTrains(){return [...trains.values()].filter(t=>!t.device?.gatt?.connected);}
function renderReconnectFlow(info=''){
  const panel=$('reconnect-panel');
  if(!reconnectFlow){panel.hidden=true;return;}
  panel.hidden=false;
  const missing=missingTrains();
  $('reconnect-progress').textContent=`${tr('reconnectProgress')}: ${trains.size-missing.length}/${trains.size}`;
  $('reconnect-details').textContent=missing.length
    ? `${tr('reconnectRemaining')}: ${missing.map(t=>t.name).join(', ')}${info?' — '+info:''}`
    :tr('reconnectDone');
  const next=$('reconnect-next');
  next.hidden=!missing.length;
  next.disabled=reconnectBusy;
  next.textContent=reconnectBusy?tr('reconnectBusy'):tr('reconnectSelect');
  $('reconnect-close').textContent=tr('reconnectCancel');
}
function startReconnectFlow(){
  reconnectFlow=true;
  renderReconnectFlow(tr('reconnectStart'));
}
async function selectNextReconnect(){
  if(reconnectBusy||!missingTrains().length)return;
  if(!navigator.bluetooth){notice(tr('bluetoothUnavailable'));return;}
  reconnectBusy=true;
  renderReconnectFlow();
  try{
    // Must be invoked before any other await, directly from button click.
    const device=await navigator.bluetooth.requestDevice({filters:[{services:[SERVICE]}]});
    const t=trains.get(device.id);
    if(!t){renderReconnectFlow(tr('reconnectUnknown'));return;}
    if(t.device?.gatt?.connected){renderReconnectFlow(tr('alreadyConnected'));return;}
    attachDevice(t,device);
    await connectDevice(t,device);
    renderReconnectFlow();
  }catch(err){
    if(err.name==='NotFoundError')renderReconnectFlow(tr('reconnectCancelled'));
    else {notice(`${tr('reconnectionFailed')} (${err.name}): ${err.message}`);renderReconnectFlow(err.message);}
  }finally{reconnectBusy=false;renderReconnectFlow();}
}
$('reconnect-next').addEventListener('click',()=>void selectNextReconnect());
$('reconnect-close').addEventListener('click',()=>{reconnectFlow=false;renderReconnectFlow();});

function register(device){
  let t=trains.get(device.id);
  if(t){if(t.device?.gatt?.connected){notice(tr('alreadyConnected'));return null;}attachDevice(t,device);return t;}
  const existing=saved.find(x=>x.id===device.id);
  const id=nextId++;
  t={key:device.id,name:existing?.name||device.name||`${tr('train')} ${id}`,device:null,char:null,ports:makePorts(existing),motorsLinked:existing?.motorsLinked===true,battery:null,rssi:null,hubInfo:{},notificationChar:null,batteryListener:null,ramp:existing?.ramp!==false,reverse:existing?.reverse===true,bluetoothName:existing?.bluetoothName??null,ledMode:existing?.ledMode==='preset'?'preset':'native',ledIndex:normalizeLedIndex(existing?.ledIndex),lastInteraction:Date.now(),zeroSince:Date.now(),idleDisconnect:false,pending:Promise.resolve(),card:null,settingsCard:null,connecting:false};
  trains.set(t.key,t);attachDevice(t,device);createCard(t);saveTrain(t);return t;
}
async function addTrain(){
  if(!navigator.bluetooth){notice(tr('bluetoothSecure'));return;}
  try{
    const device=await navigator.bluetooth.requestDevice({filters:[{services:[SERVICE]}]});
    const t=register(device);if(t)await connectDevice(t,device);
  }catch(err){if(err.name!=='NotFoundError')notice(`${tr('connectionFailed')}: ${err.message}`);}
}
for(const entry of saved){
  const t={key:entry.id,name:entry.name,device:null,char:null,ports:makePorts(entry),motorsLinked:entry.motorsLinked===true,battery:null,rssi:null,hubInfo:{},notificationChar:null,batteryListener:null,ramp:entry.ramp!==false,reverse:entry.reverse===true,bluetoothName:entry.bluetoothName??null,ledMode:entry.ledMode==='preset'?'preset':'native',ledIndex:normalizeLedIndex(entry.ledIndex),lastInteraction:Date.now(),zeroSince:Date.now(),idleDisconnect:false,pending:Promise.resolve(),card:null,settingsCard:null,connecting:false};
  trains.set(t.key,t);createCard(t);
}
async function restoreConnections(){
  if(typeof navigator.bluetooth?.getDevices!=='function'){
    // Modalita' manuale: le schede restano disponibili e ogni pulsante
    // Riconnetti apre il selettore BLE tramite requestDevice().
    notice(tr('manual'));
    return;
  }
  try{
    const devices=await navigator.bluetooth.getDevices();
    console.log('[TrenoLegoBLE] Hub autorizzati:',devices.map(d=>({id:d.id,name:d.name})));
    const pending=[];
    for(const t of trains.values()){
      if(t.device?.gatt?.connected)continue;
      const device=devices.find(d=>d.id===t.key);
      if(device){attachDevice(t,device);pending.push(connectDevice(t,device));}
    }
    if(!pending.length && trains.size)notice(tr('noSaved'));
    await Promise.allSettled(pending);
  }catch(err){
    console.warn('Recupero hub autorizzati non riuscito:',err);
    notice(tr('autoUnavailable'));
  }
}
$('restore').addEventListener('click',startReconnectFlow);
$('duo-add').addEventListener('click',()=>{const a=$('duo-first').value,b=$('duo-second').value;if(!a||!b||a===b){notice(tr('duoMissing'));return;}const name=$('duo-name').value.trim()||tr('duoLabel');if(!createDuo({id:'duo-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),name,members:[a,b]}))notice(tr('duoMissing'));});
for(const data of readDuos())createDuo(data,false);
refreshDuoVisibility();

// LEGO Powered Up 88010 remotes. Reuses verified button notification protocol.
const REMOTE_STORAGE='trenolegoble_remotes_v1';
const remotes=new Map();
const REMOTE_COLORS=LED_SWATCHES;
let nextRemotePairId=1;
function safeRemotePairs(pairs){
 const valid=x=>x&&typeof x==='object'&&typeof x.kind==='string'&&typeof x.id==='string';
 return Array.isArray(pairs)?pairs.slice(0,32).map(p=>({id:String(p.id||('pair'+nextRemotePairId++)),a:valid(p.a)?p.a:null,b:valid(p.b)?p.b:null,color:normalizeLedIndex(p.color)})):[];
}
function loadRemotes(){
 try{const items=JSON.parse(localStorage.getItem(REMOTE_STORAGE)||'[]');return Array.isArray(items)?items.filter(x=>x&&typeof x.id==='string').map(x=>({id:x.id,name:String(x.name||'LEGO Remote').slice(0,48),mode:x.mode==='step'?'step':'continuous',step:[5,10,15,20,25].includes(+x.step)?+x.step:10,pairs:safeRemotePairs(x.pairs)})):[];}catch{return [];}
}
function saveRemotes(){try{localStorage.setItem(REMOTE_STORAGE,JSON.stringify([...remotes.values()].map(r=>({id:r.id,name:r.name,mode:r.mode,step:r.step,pairs:r.pairs}))));}catch(e){notice(`${tr('saveError')}: ${e.message}`);}}
function remoteTargetOptions(){
 const opts=[{value:'',text:tr('remoteNoTarget')}];
 for(const t of trains.values())if(!duoOf(t))for(const i of motorIndexes(t))opts.push({value:'port:'+t.key+':'+i,text:t.name+' · '+(i?'B':'A')});
 for(const d of duos.values())opts.push({value:'duo:'+d.id,text:d.name+' (Duo)'});
 return opts;
}
function targetValue(t){return t?t.kind+':'+t.id+(t.kind==='port'?':'+t.port:''):'';}
function parseTarget(value){
 if(!value)return null;
 if(value.startsWith('port:')){const suffix=value.slice(5);const idx=suffix.lastIndexOf(':');if(idx<0)return null;const id=suffix.slice(0,idx),port=Number(suffix.slice(idx+1));return (port===0||port===1)?{kind:'port',id,port}:null;}
 if(value.startsWith('duo:'))return {kind:'duo',id:value.slice(4)};
 return null;
}
function remoteTargetState(t){
 if(!t)return null;
 if(t.kind==='port'){
  const hub=trains.get(t.id);
  if(!hub||duoOf(hub)||!isMotor(hub.ports[t.port])||!hub.device?.gatt?.connected)return null;
  return {power:hub.ports[t.port].target,set:v=>motorTargets(hub,v,[t.port]),stop:()=>motorTargets(hub,0,[t.port])};
 }
 if(t.kind==='duo'){
  const d=duos.get(t.id);if(!d||!duoReady(d))return null;
  return {power:d.target,set:v=>{d.target=v;d.card.querySelector('.slider').value=String(v);applyDuoTarget(d);updateDuo(d);},stop:()=>{d.target=0;d.card.querySelector('.slider').value='0';applyDuoTarget(d);updateDuo(d);}};
 }
 return null;
}
function remoteSetPower(r,side,delta){
 const pair=r.pairs[r.active];if(!pair)return;
 const target=remoteTargetState(side===0?pair.a:pair.b);if(!target)return;
 const power=Math.max(-100,Math.min(100,target.power+delta));target.set(power);
}
function remoteCancelInput(r){
 for(const timer of r.repeatTimers.values())clearInterval(timer);
 r.repeatTimers.clear();
 for(const timer of r.stopTimers.values())clearTimeout(timer);
 r.stopTimers.clear();r.stopLast.clear();r.values.clear();r.centerDown=false;
}
async function remoteLed(r){
 if(!r.char||!r.device?.gatt?.connected||!r.pairs.length)return;
 const color=normalizeLedIndex(r.pairs[r.active]?.color);
 try{
  // Remote RGB LED port 0x34, indexed mode 0.
  await remoteWrite(r,Uint8Array.of(10,0,0x41,0x34,0,1,0,0,0,0));
  await remoteWrite(r,Uint8Array.of(8,0,0x81,0x34,0x11,0x51,0,color));
 }catch(err){console.warn('[TrenoLegoBLE] Remote LED:',err);}
}
function remoteNextPair(r){r.lastActivity=Date.now();if(r.pairs.length<2)return;remoteCancelInput(r);r.active=(r.active+1)%r.pairs.length;void remoteLed(r);renderRemotes();}
function remoteStop(r,side){
 r.lastActivity=Date.now();const now=Date.now(),previous=r.stopLast.get(side)||0;
 if(now-previous<=350){
  clearTimeout(r.stopTimers.get(side));r.stopTimers.delete(side);r.stopLast.delete(side);
  for(const rr of remotes.values())remoteCancelInput(rr);
  stopAllTrains();return;
 }
 r.stopLast.set(side,now);
 const captured=r.pairs[r.active]?.[side===0?'a':'b'];
 r.stopTimers.set(side,setTimeout(()=>{
  r.stopTimers.delete(side);r.stopLast.delete(side);
  remoteTargetState(captured)?.stop();
 },350));
}
function remoteButton(r,side,value){
 if(side!==0&&side!==1)return;
 if(r.values.get(side)===value)return;
 r.values.set(side,value);r.lastActivity=Date.now();
 clearInterval(r.repeatTimers.get(side));r.repeatTimers.delete(side);
 if(value===127){remoteStop(r,side);return;}
 if(value!==1&&value!==255)return;
 // Every press changes power once; continuous mode repeats while held.
 const delta=(value===1?1:-1)*r.step;
 remoteSetPower(r,side,delta);
 if(r.mode==='continuous')r.repeatTimers.set(side,setInterval(()=>{
  if(!r.device?.gatt?.connected||r.values.get(side)!==value){clearInterval(r.repeatTimers.get(side));r.repeatTimers.delete(side);return;}
  remoteSetPower(r,side,delta);
 },150));
}
function remoteProperty(r,msg){
 if(msg.length<6||msg[4]!==0x06)return;
 const prop=msg[3],view=new DataView(msg.buffer,msg.byteOffset,msg.byteLength);
 if(prop===0x05)r.rssi=view.getInt8(5);
 else if(prop===0x06){const v=msg[5];if(v<=100){r.battery=v;checkLowBattery('remote:'+r.id,r.name,v);}}
 else if(prop===0x03||prop===0x04){const val=decodeVersion(view);if(val!==null)r.hubInfo[prop===0x03?'firmwareVersion':'hardwareVersion']=val;}
 else if(prop===0x09)r.hubInfo.radioFirmwareVersion=new TextDecoder().decode(msg.subarray(5)).replace(/\0+$/,'');
 else if(prop===0x0A&&msg.length>=7){const lo=msg[5],hi=msg[6];if([lo>>4,lo&15,hi>>4,hi&15].every(d=>d<=9))r.hubInfo.protocolVersion=`${decodeBCD(hi)}.${decodeBCD(lo)}`;}
 else if(prop===0x07)r.hubInfo.batteryType=msg[5];
 updateRemoteTelemetry(r);
}
function updateRemoteTelemetry(r){
 const el=document.querySelector(`[data-remote-telemetry="${CSS.escape(r.id)}"]`);
 if(el){const connected=!!r.device?.gatt?.connected;el.textContent=`🔋 ${connected&&r.battery!==null?r.battery+'%':'—'}    📡 ${connected&&r.rssi!==null?r.rssi+' dBm':'—'}`;}
 const info=document.querySelector(`[data-remote-info="${CSS.escape(r.id)}"]`);
 if(info){for(const key of ['firmwareVersion','hardwareVersion','radioFirmwareVersion','protocolVersion','batteryType']){
  const field=info.querySelector(`[data-key="${key}"]`);if(!field)continue;
  const val=r.device?.gatt?.connected?r.hubInfo[key]:null;
  field.textContent=val===undefined||val===null?'—':key==='batteryType'?(val===0?tr('batteryNormal'):val===1?tr('batteryRechargeable'):tr('hubUnknown')):String(val);
 }}
}
function remoteReceive(r,event){
 const view=event.target.value,bytes=new Uint8Array(view.buffer,view.byteOffset,view.byteLength);
 for(let pos=0;pos<bytes.length;){
  const len=bytes[pos];if(len<3||pos+len>bytes.length)break;
  const msg=bytes.subarray(pos,pos+len);
  if(msg[2]===0x45&&msg.length>=5&&(msg[3]===0||msg[3]===1))remoteButton(r,msg[3],msg[4]);
  else if(msg[2]===0x01&&msg.length>=6&&msg[3]===0x02&&msg[4]===0x06){
   const down=msg[5]!==0;
   if(down&&!r.centerDown)remoteNextPair(r);
   r.centerDown=down;
  }
  else if(msg[2]===0x01)remoteProperty(r,msg);
  pos+=len;
 }
}
async function remoteWrite(r,data){
 r.pending=r.pending.catch(()=>{}).then(async()=>{
  if(!r.device?.gatt?.connected||!r.char)throw new Error('Remote disconnected');
  if(r.char.writeValueWithoutResponse)await r.char.writeValueWithoutResponse(data);
  else await r.char.writeValue(data);
 });
 return r.pending;
}
function remoteAttach(r,device){
 if(r.device===device)return;
 if(r.device&&r.disconnectHandler)r.device.removeEventListener('gattserverdisconnected',r.disconnectHandler);
 r.device=device;
 r.disconnectHandler=()=>{remoteCancelInput(r);r.char=null;r.battery=null;r.rssi=null;r.hubInfo={};r.pending=Promise.resolve();renderRemotes();};
 device.addEventListener('gattserverdisconnected',r.disconnectHandler);
}
async function remoteConnect(r,device){
 if(r.connecting||device.gatt.connected)return;
 remoteAttach(r,device);r.connecting=true;renderRemotes();
 try{
  const server=await device.gatt.connect(),service=await server.getPrimaryService(SERVICE);
  r.char=await service.getCharacteristic(CHARACTERISTIC);
  await r.char.startNotifications();
  r.listener=e=>remoteReceive(r,e);
  r.char.addEventListener('characteristicvaluechanged',r.listener);
  for(const port of [0,1])await remoteWrite(r,Uint8Array.of(10,0,0x41,port,0,1,0,0,0,1));
  await remoteWrite(r,Uint8Array.of(5,0,0x01,0x02,0x02));
  r.battery=null;r.rssi=null;r.hubInfo={};r.lastActivity=Date.now();
  for(const [prop,op] of [[6,2],[6,5],[5,2],[5,5],[3,5],[4,5],[9,5],[10,5],[7,5]]){
   try{await remoteWrite(r,Uint8Array.of(5,0,0x01,prop,op));}catch(e){console.warn('Remote property:',prop,e);}
  }
  await remoteLed(r);
 }catch(e){console.warn('[TrenoLegoBLE] Remote connection:',e);notice(`${tr('connectionFailed')}: ${e.message}`);if(device.gatt.connected)device.gatt.disconnect();}
 finally{r.connecting=false;renderRemotes();}
}
function makeRemote(cfg,device=null){
 const r={...cfg,device:null,char:null,connecting:false,active:0,listener:null,disconnectHandler:null,pending:Promise.resolve(),values:new Map(),repeatTimers:new Map(),stopLast:new Map(),stopTimers:new Map(),centerDown:false,battery:null,rssi:null,hubInfo:{},lastActivity:Date.now()};
 if(!r.pairs.length)r.pairs.push({id:'p'+nextRemotePairId++,a:null,b:null,color:3});
 remotes.set(r.id,r);if(device)remoteAttach(r,device);renderRemotes();return r;
}
async function remoteSelectDevice(existing=null){
 if(!navigator.bluetooth){notice(tr('bluetoothUnavailable'));return;}
 try{
  // The chooser must be opened synchronously from the click handler.
  const device=await navigator.bluetooth.requestDevice({filters:[{services:[SERVICE]}]});
  if(existing&&existing.id!==device.id){notice(tr('remoteNotFound'));return;}
  if(trains.has(device.id)){notice(tr('remoteNotFound'));return;}
  let r=remotes.get(device.id);
  if(!r){r=makeRemote({id:device.id,name:device.name||'LEGO Remote',mode:'continuous',step:10,pairs:[{id:'p'+nextRemotePairId++,a:null,b:null,color:3}]},device);saveRemotes();}
  await remoteConnect(r,device);
 }catch(e){if(e.name!=='NotFoundError')notice(`${tr('connectionFailed')}: ${e.message}`);}
}
function remoteSummary(){
 const connected=[...remotes.values()].filter(r=>r.device?.gatt?.connected).length;
 $('remote-count').textContent=`${connected}/${remotes.size} ${tr('remoteCount')}`;
 $('remote-summary').hidden=!remotes.size;
 $('remote-summary').textContent=`🎮 ${tr('remoteCount')}: ${connected}/${remotes.size}`;
}
// --- Remote controller cards and button mapping ---
function renderRemotes(){
 const root=$('remote-list');root.replaceChildren();remoteSummary();
 if(!remotes.size){const div=document.createElement('p');div.className='empty';div.textContent=tr('remoteEmpty');root.append(div);return;}
 const targetOptions=remoteTargetOptions();
 function select(options,value,callback){
  const sel=document.createElement('select');
  for(const opt of options){const item=document.createElement('option');item.value=opt.value;item.textContent=opt.text;sel.append(item);}
  if(value&&!options.some(o=>o.value===value)){value='';}
  sel.value=value||'';sel.addEventListener('change',()=>callback(sel.value));return sel;
 }
 function field(label,control){const el=document.createElement('label');el.className='field';const title=document.createElement('span');title.textContent=label;el.append(title,control);return el;}
 for(const r of remotes.values()){
  const card=document.createElement('section');card.className='card remote-layout';
  const head=document.createElement('div');head.className='head';
  const title=document.createElement('strong');title.textContent=r.name;
  const status=document.createElement('span');status.className=r.device?.gatt?.connected?'remote-connected':'remote-offline';status.textContent=r.device?.gatt?.connected?tr('remoteConnected'):tr('remoteDisconnected');head.append(title,status);card.append(head);
  const telemetry=document.createElement('div');telemetry.className='remote-telemetry';telemetry.dataset.remoteTelemetry=r.id;card.append(telemetry);
  const info=document.createElement('details');info.className='remote-information';info.dataset.remoteInfo=r.id;
  const infoSummary=document.createElement('summary');infoSummary.textContent=tr('remoteInfo');info.append(infoSummary);
  const infoGrid=document.createElement('div');infoGrid.className='hub-info-grid';
  for(const key of ['firmwareVersion','hardwareVersion','radioFirmwareVersion','protocolVersion','batteryType']){
   const field=document.createElement('div');field.className='hub-info-field';
   const label=document.createElement('span');label.className='muted';label.textContent=tr(key);
   const value=document.createElement('strong');value.dataset.key=key;value.textContent='—';field.append(label,value);infoGrid.append(field);
  }
  info.append(infoGrid);card.append(info);
  const actions=document.createElement('div');actions.className='remote-actions';
  const reconnect=document.createElement('button');reconnect.textContent=tr('remoteConnect');reconnect.disabled=r.connecting||!!r.device?.gatt?.connected;
  reconnect.onclick=()=>{if(r.device&&!r.device.gatt.connected)void remoteConnect(r,r.device);else void remoteSelectDevice(r);};
  const choose=document.createElement('button');choose.textContent=LANG==='it'?'Seleziona via Bluetooth':'Select via Bluetooth';choose.disabled=r.connecting||!!r.device?.gatt?.connected;choose.onclick=()=>void remoteSelectDevice(r);
  const disconnect=document.createElement('button');disconnect.textContent=tr('remoteDisconnect');disconnect.disabled=!r.device?.gatt?.connected;disconnect.onclick=()=>r.device.gatt.disconnect();
  const remove=document.createElement('button');remove.className='danger';remove.textContent=tr('remoteRemove');remove.onclick=()=>{if(!confirm(tr('remoteConfirm')))return;remoteCancelInput(r);r.device?.gatt?.disconnect();remotes.delete(r.id);saveRemotes();renderRemotes();};
  actions.append(reconnect,choose,disconnect,remove);card.append(actions);
  const name=document.createElement('input');name.className='trainname';name.maxLength=48;name.value=r.name;name.addEventListener('change',()=>{r.name=name.value.trim()||'LEGO Remote';saveRemotes();renderRemotes();});card.append(field(tr('remoteName'),name));
  const mode=document.createElement('div');mode.className='remote-mode';
  mode.append(field(tr('remoteMode'),select([{value:'step',text:tr('remoteStepMode')},{value:'continuous',text:tr('remoteContinuous')}],r.mode,v=>{r.mode=v;remoteCancelInput(r);saveRemotes();}))); 
  const step=document.createElement('select');for(const n of [5,10,15,20,25]){const op=document.createElement('option');op.value=String(n);op.textContent=n+'%';step.append(op);}step.value=String(r.step);step.addEventListener('change',()=>{r.step=Number(step.value);saveRemotes();});
  mode.append(field(tr('remoteStep'),step));card.append(mode);
  const active=document.createElement('div');active.className='muted';active.textContent=`${tr('remoteActive')}: ${tr('remotePair')} ${r.active+1}/${r.pairs.length}`;card.append(active);
  r.pairs.forEach((pair,i)=>{
   const box=document.createElement('div');box.className='remote-pair'+(i===r.active?' active':'');
   const heading=document.createElement('div');heading.className='head';
   const label=document.createElement('div');label.className='remote-label';const swatch=document.createElement('span');swatch.className='remote-swatch';swatch.style.backgroundColor=REMOTE_COLORS[pair.color];label.append(swatch,document.createTextNode(`${tr('remotePair')} ${i+1}`));
   const removePair=document.createElement('button');removePair.className='danger';removePair.textContent='×';removePair.title=tr('remoteRemovePair');removePair.disabled=r.pairs.length===1;removePair.onclick=()=>{remoteCancelInput(r);r.pairs.splice(i,1);r.active=Math.min(r.active,r.pairs.length-1);saveRemotes();void remoteLed(r);renderRemotes();};heading.append(label,removePair);box.append(heading);
   const grid=document.createElement('div');grid.className='remote-grid';
   for(const [side,key] of [[tr('remoteGroupA'),'a'],[tr('remoteGroupB'),'b']])grid.append(field(side,select(targetOptions,targetValue(pair[key]),v=>{pair[key]=parseTarget(v);saveRemotes();})));
   box.append(grid);box.append(field(tr('remoteColor'),select(tr('ledColors').map((name,num)=>({value:String(num),text:name})),String(pair.color),v=>{pair.color=normalizeLedIndex(v);swatch.style.backgroundColor=REMOTE_COLORS[pair.color];saveRemotes();if(i===r.active)void remoteLed(r);})));card.append(box);
  });
  const addPair=document.createElement('button');addPair.textContent=tr('remoteAddPair');addPair.disabled=r.pairs.length>=32;addPair.onclick=()=>{r.pairs.push({id:'p'+nextRemotePairId++,a:null,b:null,color:r.pairs.length%10+1});saveRemotes();renderRemotes();};card.append(addPair);
  const hint=document.createElement('small');hint.className='muted';hint.textContent=tr('remoteHint');card.append(hint);root.append(card);updateRemoteTelemetry(r);
 }
}
$('remote-add').addEventListener('click',()=>void remoteSelectDevice());
for(const config of loadRemotes())makeRemote(config);
remoteConfigReady=true;cleanupDuoRemoteAssignments();
// Versioned, portable configuration backup. BLE permissions and runtime state are excluded.
const BACKUP_FORMAT='TrenoLegoBLE', BACKUP_SCHEMA=1;
const BACKUP_KEYS=[STORAGE_KEY,DUO_STORAGE,REMOTE_STORAGE,ENERGY_STORAGE,ORDER_STORAGE,HAPTIC_STORAGE];
function exportConfiguration(){
 try{
  // Capture current in-memory values rather than possibly stale localStorage.
  const payload={format:BACKUP_FORMAT,schemaVersion:BACKUP_SCHEMA,appVersion:'1.1.17',exportedAt:new Date().toISOString(),
   trains:saved.map(t=>({...t})),
   duos:[...duos.values()].map(d=>({id:d.id,name:d.name,members:[...d.members]})),
   remotes:[...remotes.values()].map(r=>({id:r.id,name:r.name,mode:r.mode,step:r.step,pairs:r.pairs.map(p=>({id:p.id,a:p.a,b:p.b,color:p.color}))})),
   energy:{enabled:energy.enabled,minutes:energy.minutes},hapticEnabled,controlOrder:[...controlOrder]};
  const blob=new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  const date=new Date().toLocaleDateString('en-CA');
  link.href=url;link.download='TrenoLegoBLE-config-'+date+'.json';document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);notice(tr('backupSaved'));
 }catch(e){notice(tr('backupError')+': '+e.message);}
}
function validBackup(x){
 const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const str=(v,max=128)=>typeof v==='string'&&v.length>0&&v.length<=max;
 if(!plain(x)||x.format!==BACKUP_FORMAT||x.schemaVersion!==BACKUP_SCHEMA||
    !Array.isArray(x.trains)||!Array.isArray(x.duos)||!Array.isArray(x.remotes)||
    !Array.isArray(x.controlOrder)||!plain(x.energy)||x.trains.length>25||x.remotes.length>32||x.duos.length>12||x.controlOrder.length>100)return false;
 if(typeof x.energy.enabled!=='boolean'||!Number.isInteger(x.energy.minutes)||x.energy.minutes<1||x.energy.minutes>240)return false;
 if(x.hapticEnabled!==undefined&&typeof x.hapticEnabled!=='boolean')return false;
 const ids=new Set();
 for(const t of x.trains){
  if(!plain(t)||!str(t.id,256)||!str(t.name,48)||ids.has(t.id)||!Array.isArray(t.ports)||t.ports.length!==2||
     typeof t.ramp!=='boolean'||typeof t.motorsLinked!=='boolean'||!['native','preset'].includes(t.ledMode)||
     !Number.isInteger(t.ledIndex)||t.ledIndex<0||t.ledIndex>10)return false;
  ids.add(t.id);
  if(t.ports.some(p=>!plain(p)||!['motor','lights','none'].includes(p.type)||typeof p.reverse!=='boolean'||
      typeof p.brightness!=='number'||!Number.isFinite(p.brightness)||p.brightness<0||p.brightness>100||
      (p.boostEnabled!==undefined&&typeof p.boostEnabled!=='boolean')||
      (p.boostPower!==undefined&&(!Number.isInteger(p.boostPower)||p.boostPower<20||p.boostPower>100||p.boostPower%5!==0))||
      (p.boostDuration!==undefined&&(!Number.isInteger(p.boostDuration)||p.boostDuration<75||p.boostDuration>500||p.boostDuration%25!==0))))return false;
 }
 const duoIds=new Set(),memberIds=new Set();
 for(const d of x.duos){
  if(!plain(d)||!str(d.id,128)||!str(d.name,48)||duoIds.has(d.id)||!Array.isArray(d.members)||d.members.length!==2||
     d.members[0]===d.members[1]||d.members.some(id=>!ids.has(id)||memberIds.has(id)))return false;
  duoIds.add(d.id);d.members.forEach(id=>memberIds.add(id));
 }
 const remoteIds=new Set();
 for(const r of x.remotes){
  if(!plain(r)||!str(r.id,256)||!str(r.name,48)||remoteIds.has(r.id)||!['step','continuous'].includes(r.mode)||
     ![5,10,15,20,25].includes(r.step)||!Array.isArray(r.pairs)||r.pairs.length<1||r.pairs.length>32)return false;
  remoteIds.add(r.id);const pairIds=new Set();
  for(const pair of r.pairs){
   if(!plain(pair)||!str(pair.id,128)||pairIds.has(pair.id)||!Number.isInteger(pair.color)||pair.color<0||pair.color>10)return false;
   pairIds.add(pair.id);
   for(const side of ['a','b']){
    const target=pair[side];if(target===null)continue;
    if(!plain(target)||!str(target.id,256))return false;
    if(target.kind==='port'){
     const hub=x.trains.find(t=>t.id===target.id);
     if(!hub||![0,1].includes(target.port)||hub.ports[target.port].type!=='motor'||memberIds.has(target.id))return false;
    }else if(target.kind==='duo'){
     if(!duoIds.has(target.id))return false;
    }else return false;
   }
  }
 }
 if(x.controlOrder.some(k=>typeof k!=='string'||k.length>300||
     (!k.startsWith('hub:')&&!k.startsWith('duo:'))))return false;
 return true;
}
async function importConfiguration(file){
 if(!file)return;
 try{
  if(file.size>1024*1024)throw Error(tr('backupInvalid'));
  const data=JSON.parse(await file.text());
  if(!validBackup(data))throw Error(tr('backupInvalid'));
  if([...trains.values()].some(t=>!motorsIdle(t))||[...duos.values()].some(d=>d.target!==0)){
   notice(tr('backupMoving'));return;
  }
  if(!confirm(tr('backupConfirm')))return;
  // Validate everything before writing, and roll back partial writes on quota/storage errors.
  const replacement=[JSON.stringify(data.trains),JSON.stringify(data.duos),JSON.stringify(data.remotes),JSON.stringify(data.energy),JSON.stringify(data.controlOrder),String(data.hapticEnabled===true)];
  const previous=BACKUP_KEYS.map(key=>localStorage.getItem(key));
  try{
   BACKUP_KEYS.forEach((key,i)=>localStorage.setItem(key,replacement[i]));
  }catch(e){
   BACKUP_KEYS.forEach((key,i)=>{try{if(previous[i]===null)localStorage.removeItem(key);else localStorage.setItem(key,previous[i]);}catch{}});
   throw e;
  }
  notice(tr('backupDone'));
  location.reload();
 }catch(e){notice(tr('backupError')+': '+e.message);}
}
$('backup-export').addEventListener('click',exportConfiguration);
$('backup-import').addEventListener('click',()=>$('backup-file').click());
$('backup-file').addEventListener('change',async e=>{
 const file=e.target.files?.[0];e.target.value='';await importConfiguration(file);
});

// Restore previously authorized remotes using the same permissions as hubs.
async function restoreRemoteConnections(){
 if(typeof navigator.bluetooth?.getDevices!=='function')return;
 try{const devices=await navigator.bluetooth.getDevices();await Promise.allSettled([...remotes.values()].map(r=>{
  const d=devices.find(x=>x.id===r.id);return d?remoteConnect(r,d):Promise.resolve();
 }));}catch(e){console.warn('[TrenoLegoBLE] Remote auto reconnect:',e);}
}
void restoreRemoteConnections();

// Avvio: riconnessione automatica solo se getDevices e' disponibile.
renderEmpty();
updateStopAllButton();
void restoreConnections();
$('add').addEventListener('click',addTrain);
// --- Global emergency stop and motor shutdown ---
function stopAllTrains(){
 for(const d of duos.values()){d.target=0;d.actual=0;d.lightOn=false;if(d.card)d.card.querySelector('.slider').value='0';}
 for(const t of trains.values())allMotorsOff(t,true);
 updateDuos();
}
$('stopall').addEventListener('click',()=>{haptic(500);stopAllTrains();});
// Browsers may pause background timers when the phone is locked; check again on resume.
setInterval(()=>void checkEnergySaving(),5000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void checkEnergySaving();});
// One ramp step per motor every 100 ms. Writes remain serialized per hub.
setInterval(()=>{for(const t of trains.values()){
 if(!t.device?.gatt?.connected||!t.ramp)continue;
 let changed=false;
 for(const i of motorIndexes(t)){
  const p=t.ports[i];if(p.boostActive||p.actual===p.target)continue;
  const delta=p.target-p.actual;
  p.actual+=Math.sign(delta)*Math.min(5,Math.abs(delta));
  changed=true;void sendPort(t,i,p.actual);
 }
 if(changed){markMotion(t);update(t);}
}},100);

}

// Offline PWA shell registration; Bluetooth operations remain in this page.

// PWA shell only: the Service Worker does not communicate with Bluetooth.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', {scope: './'})
      .catch(err => console.warn('[TrenoLegoBLE] Service Worker:', err));
  });
}
