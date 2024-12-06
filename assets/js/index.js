import { Ticket } from "./ticket.js";
import { TextToSpeech } from "./texttospeech.js";

let voiceList = window.speechSynthesis.getVoices().filter((i) => {
    return i.lang == navigator.language;
});

window.speechSynthesis.addEventListener("voiceschanged", () => {
    voiceList = speechSynthesis.getVoices().filter((i) => {
        return i.lang == navigator.language;
    });
    updateDisplayTicket("o");
});

let voiceConfig = {
    rate: 1.4,
    pitch: 0.9,
    volume: 1,
    lang: navigator.language,
};

const normalTicket = new Ticket(3);
const preferentialTicket = new Ticket(3);
const textToSpeech = new TextToSpeech(voiceConfig);

//============================================================

function ticketIncrement(type) {
    if (type == "N") normalTicket.increment();
    if (type == "P") preferentialTicket.increment();
}

function ticketDecrement(type) {
    if (type == "N") normalTicket.decrement();
    if (type == "P") preferentialTicket.decrement();
}

//============================================================

function callTicket(type) {
    const beepDuration = 500;
    beep(1000, beepDuration);
    setTimeout(() => {
        beep(730, beepDuration);

        setTimeout(() => {
            beep(1000, beepDuration);

            if (document.getElementById("inVoiceList").selectedOptions[0].value != "mute")
                setTimeout(() => {
                    speakTicket(type, type == "P" ? preferentialTicket.number : normalTicket.number);
                }, beepDuration);
        }, beepDuration);
    }, beepDuration);

    updateDisplayTicket(type);
}

function updateDisplayTicket(opt) {
    if (opt != "o") {
        if (opt == "N") {
            document.getElementById("ticketNormal").classList.toggle("blink");
            setTimeout(() => {
                document.getElementById("ticketNormal").classList.toggle("blink");
            }, 2000);
        }
        if (opt == "P") {
            document.getElementById("ticketPreferential").classList.toggle("blink");
            setTimeout(() => {
                document.getElementById("ticketPreferential").classList.toggle("blink");
            }, 2000);
        }
    }

    document.getElementById("ticketNormal").innerText = normalTicket.number;
    document.getElementById("inNormalTicket").value = normalTicket.number;

    document.getElementById("ticketPreferential").innerText = "P" + preferentialTicket.number;
    document.getElementById("inPreferTicket").value = preferentialTicket.number;

    if (opt == "o") {
        voiceList.forEach((voice) => {
            const option = document.createElement("option");
            option.value = voice.voiceURI;
            option.label = voice.name;
            if (voice.name.includes("Maria")) option.selected = true;

            document.getElementById("inVoiceList").appendChild(option);
        });

        document.getElementById("inVoiceRate").value = voiceConfig.rate;
        document.getElementById("inVoicePitch").value = voiceConfig.pitch;
    }
}

function speakTicket(type, ticket) {
    let speechText = "Senha";
    speechText += type == "P" ? "Preferencial " : " ";
    speechText += ticket.toString().padStart(3, "0");

    const speech = new SpeechSynthesisUtterance(speechText);

    voiceList.forEach((voice) => {
        if (voice.voiceURI == document.getElementById("inVoiceList").selectedOptions[0].value) speech.voice = voice;
    });
    speech.volume = configs.voiceVolume;
    speech.pitch = configs.voicePitch;
    speech.rate = configs.voiceRate;

    window.speechSynthesis.speak(speech);
}

function beep(frequency, duration) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var oscillator = audioCtx.createOscillator();
    var gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "sine";
    gainNode.gain.value = 0.25;

    oscillator.detune.value = -75;
    oscillator.frequency.value = frequency;

    oscillator.start();

    setTimeout(function () {
        oscillator.stop();
    }, duration);
}

//============================================================

document.addEventListener("keydown", (event) => {
    switch (event.code) {
        case "NumpadAdd":
            ticketIncrement("N");
            callTicket("N");
            break;
        case "NumpadComma":
        case "Period":
            ticketIncrement("P");
            callTicket("P");
            break;
        case "NumpadDivide":
            ticketDecrement("N");
            callTicket("N");
            break;
        case "NumpadMultiply":
            ticketDecrement("P");
            callTicket("P");
            break;
        case "NumpadSubtract":
            callTicket("N");
            break;
        case "NumpadDecimal":
            callTicket("P");
            break;
        default:
            return event;
    }
    updateDisplayTicket();
});

document.getElementById("formSettingsPanel").addEventListener("change", (e) => {
    switch (e["target"].id) {
        case "inNormalTicket":
            normalTicket.number = parseInt(e["target"].value, 10);
            break;
        case "inPreferTicket":
            preferentialTicket.number = parseInt(e["target"].value, 10);
            break;
        case "inVoiceRate":
            configs.voiceRate = e["target"].value;
            break;
        case "inVoicePitch":
            configs.voicePitch = e["target"].value;
            break;
        default:
            break;
    }
    updateDisplayTicket();
});

document.getElementById("formSettingsPanel").addEventListener("reset", (e) => {
    e.preventDefault();
    location.reload(true);
});

document.querySelectorAll(".floatingIcon .fa-solid").forEach((iconFunc) => {
    iconFunc.addEventListener("click", (e) => {
        document.getElementById(e.target.id).classList.toggle("fa-circle-xmark");
        document.querySelector(`div:has(#${e.target.id})`).classList.toggle("active");
        document.querySelector(`div:has(#${e.target.id})`).lastElementChild.classList.toggle("hidden");
    });
});

//============================================================

updateDisplayTicket("o");
