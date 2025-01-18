// INIT
var consonantTable = document.getElementById("consonants");
var allowDuplicateConsonants = document.getElementById("allowduplicateconsonants");
var allowComplexConsonants = document.getElementById("allowcomplexconsonants");
var consonantSettingsDiv = document.getElementById("consonantFeatureSettings");

// CUSTOMIZATION
var globalConsonantConditions = {}
var customizableConsonantFeatures = {
    // rejected: tone, stress, consonantal
    // defined: sonorant, continuant, delayedrelease, approximant, nasal, lateral, labial, coronal, dorsal
    "syllabic": "syllabic?",
    "short": "short?",
    "long": "long?",
    "tap": "tap?",
    "trill": "trill?",
    "round": "labialized?",
    "labiodental": "labiodental?",
    "anterior": "anterior?",
    "distributed": "distributed?",
    "strident": "strident?",
    "high": "high?",
    "low": "low?",
    "front": "palatal?",
    "back": "back?",
    "tense": "tense?",
    "retractedtongueroot": "pharyngeal?",
    "advancedtongueroot": "+ATR?",
    "periodicglottalsource": "voiced?",
    "epilaryngealsource": "epiglottal?",
    "spreadglottis": "aspirated?",
    "constrictedglottis": "creaky?",
    "fortis": "fortis?",
    "raisedlarynxejective": "ejective?",
    "loweredlarynximplosive": "implosive?",
    "click": "click?"
}
for (let custom in customizableConsonantFeatures) {
    let form = 
        `<form>
            <p style="display: inline" title=${custom}>${customizableConsonantFeatures[custom]}</p>
            <label><input type="checkbox" name="${custom}" value="+" checked="true" class="forconsonants">+</label>
            <label><input type="checkbox" name="${custom}" value="0" checked="true" class="forconsonants">0</label>
            <label><input type="checkbox" name="${custom}" value="-" checked="true" class="forconsonants">-</label>
        </form>`;
    consonantSettingsDiv.innerHTML += form;
    globalConsonantConditions[custom] = ["+", "0", "-"];
}

// TABLE
var places = {
    "+labial": "labial",
    "+coronal": "coronal",
    "+dorsal": "dorsal",
    "-labial|-coronal|-dorsal": "glottal"
}
var poas = Object.keys(places);
var manners = {
    "-continuant|+sonorant": "nasal",
    "-continuant|-sonorant|-delayedrelease": "plosive",
    "-continuant|-sonorant|+delayedrelease": "affricate",
    "+continuant|-sonorant": "fricative",
    "+continuant|+sonorant|-lateral": "approximant",
    "+continuant|+sonorant|+lateral": "lateral",
}
var moas = Object.keys(manners);
var cTable = [[""]]
const emptyC = Array.from({ length: poas.length}, (_) => "");
cTable[0].push(...poas)
for (let i = 0; i < moas.length; i++) {
    let j = cTable.push([moas[i]]) - 1;
    cTable[j].push(...emptyC);
}

// FEATURE CONDITIONS
function ccompare(parameterValue, criteria) {
    let output = false;
    criteria.forEach(criterion => {
        if (!(allowComplexConsonants.checked)) {
            if (parameterValue == criterion) {
                output = true;
            }
        } else {
            if (parameterValue.split(",").includes(criterion)) {
                output = true;
            }
        }
        
    })
    return output;
}
function csatisfies(features, condition) {
    let flag = true
    let components = condition.split("|")
    for (let component in components) {

        let featureName = components[component].slice(1);
        let neededValue = components[component].charAt(0);
           
        if (!(ccompare(features[featureName], [neededValue]))) {
            flag = false
            continue;
        } else {
            Object.keys(globalConsonantConditions).forEach((testParameter) => {
                if (!(ccompare(features[testParameter], globalConsonantConditions[testParameter]))) {
                    flag = false;
                }
            })
        }
    }
    return flag;
}

// POPULATING TABLE AND DISPLAY
function regenerateConsonantTable() {
    var maxconsonants = 0
    var categorizedConsonants = []
    var uncategorizedConsonants = []
    fetch('/static/parameters.json')
        .then(response => response.json())
        .then((json) => {

            for (let moa in moas) {
                for (let poa in poas) {
                    cTable[parseInt(moa)+1][parseInt(poa)+1] = "";
                }
            }

            for (let phoneme in json) {
                if (json[phoneme]["segmentclass"] == "consonant") {
                    maxconsonants++;
                    for (let moa in moas) {
                        for (let poa in poas) {
                            let conditions = moas[moa] + "|" + poas[poa];
                            if (csatisfies(json[phoneme], conditions) && (allowDuplicateConsonants.checked || !(categorizedConsonants.includes(phoneme)))) {
                                cTable[parseInt(moa)+1][parseInt(poa)+1] += " " + phoneme.split("|")[0];
                                categorizedConsonants.push(phoneme.toString())
                            }
                        }
                    }
                    if (categorizedConsonants.indexOf(phoneme.toString())==-1 && uncategorizedConsonants.indexOf(phoneme.toString())==-1) {
                        uncategorizedConsonants.push(phoneme.toString())
                    }
                }
            }

            document.getElementById("consonantsTitle").innerHTML = "Consonants : " + categorizedConsonants.length + " out of " + maxconsonants;
            document.getElementById("uncategorizedConsonants").innerHTML = "Uncategorized : " + uncategorizedConsonants.length;
            document.getElementById("uncategorizedConsonants").title = uncategorizedConsonants.join(" ");

            consonantTable.childNodes.forEach(node => {
                node.remove();
            });

            let placesHeader = consonantTable.createTHead();
            let placesRow = placesHeader.insertRow(0);
            let r;
            for (let i = 0; i < cTable.length; i++) { // rows
                if (i != 0) {
                    r = consonantTable.insertRow(-1); 
                }
                cTable[i].forEach(cell => {
                    if (i == 0) {
                        let c = placesRow.insertCell(-1);
                        if (moas.includes(cell)) {
                            c.title = cell; 
                            cell = manners[cell]; 
                        }
                        else if (poas.includes(cell)) { 
                            c.title = cell;
                            cell = places[cell]; 
                        }
                        c.innerHTML = cell;
                    } else {
                        let c = r.insertCell(-1);
                        if (moas.includes(cell)) { 
                            c.title = cell; 
                            cell = manners[cell];
                        }
                        else if (poas.includes(cell)) { 
                            c.title = cell;
                            cell = places[cell]; 
                        }
                        c.innerHTML = cell;
                    }
                })
            }
        });
    ;
}

// SETTINGS
document.addEventListener('DOMContentLoaded', () => {
    const settings = document.querySelectorAll('input[type="checkbox"][class="forconsonants"]');
    settings.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) { // got checked
                if (Object.keys(globalConsonantConditions).includes(checkbox.name)) {
                    if (!(globalConsonantConditions[checkbox.name].includes(checkbox.value))) {
                        globalConsonantConditions[checkbox.name].push(checkbox.value);
                    }
                } else {
                    globalConsonantConditions[checkbox.name] = [checkbox.value];
                }
            } else {
                globalConsonantConditions[checkbox.name] = globalConsonantConditions[checkbox.name].filter(item => item != checkbox.value);
            }
            regenerateConsonantTable();
        });
    })

    document.querySelectorAll('input[type="radio"][class="forconsonants"]').forEach((radio) => {
        radio.addEventListener('click', regenerateConsonantTable)
    })
})

regenerateConsonantTable();