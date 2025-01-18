// INIT
var vowelTable = document.getElementById("vowels");
var allowDuplicateVowels = document.getElementById("allowduplicatevowels");
var allowComplexVowels = document.getElementById("allowcomplexvowels");
var vowelSettingsDiv = document.getElementById("vowelFeatureSettings");

// CUSTOMIZATION
var globalVowelConditions = {}
var customizableVowelFeatures = {
    "syllabic": "syllabic?",
    "short": "short?",
    "long": "long?",
    "round": "rounded?",
    "stress": "stressed?",
    "anterior": "anterior?",
    "distributed": "distributed?",
    "strident": "strident?",
    "front": "front?",
    "labial": "labial?",
    "coronal": "coronal?",
    "dorsal": "dorsal?",
    "tense": "tense?",
    "retractedtongueroot": "pharyngeal?",
    "advancedtongueroot": "+ATR?",
    "periodicglottalsource": "voiced?",
    "epilaryngealsource": "epiglottal?",
    "spreadglottis": "aspirated?",
    "constrictedglottis": "creaky?",
    "fortis": "fortis?",
    "raisedlarynxejective": "ejective?",
    "click": "click?"
}
for (let custom in customizableVowelFeatures) {
    let form = 
        `<form>
            <p style="display: inline" title=${custom}>${customizableVowelFeatures[custom]}</p>
            <label><input type="checkbox" name="${custom}" value="+" checked="true" class="forvowels">+</label>
            <label><input type="checkbox" name="${custom}" value="0" checked="true" class="forvowels">0</label>
            <label><input type="checkbox" name="${custom}" value="-" checked="true" class="forvowels">-</label>
        </form>`;
    vowelSettingsDiv.innerHTML += form;
    globalVowelConditions[custom] = ["+", "0", "-"];
}

// TABLE
var frontnesses = {
    "+front": "front",
    "0front": "front-central",
    "-front|-back": "central",
    "0back": "back-central",
    "+back": "back",
}
var foas = Object.keys(frontnesses);
var heights = {
    "+high": "high",
    "0high": "high-mid",
    "-high|-low": "mid",
    "0low": "low-mid",
    "+low": "low"
}
var hoas = Object.keys(heights);
var vTable = [[""]]
const emptyV = Array.from({ length: foas.length}, (_) => "");
vTable[0].push(...foas)
for (let i = 0; i < hoas.length; i++) {
    let j = vTable.push([hoas[i]]) - 1;
    vTable[j].push(...emptyV);
}

// FEATURE CONDITIONS
function compare(parameterValue, criteria) {
    let output = false;
    criteria.forEach(criterion => {
        if (!(allowComplexVowels.checked)) {
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
function satisfies(features, condition) {
    let flag = true
    let components = condition.split("|")
    for (let component in components) {

        let featureName = components[component].slice(1);
        let neededValue = components[component].charAt(0);
           
        if (!(compare(features[featureName], [neededValue]))) {
            flag = false
            continue;
        } else {
            Object.keys(globalVowelConditions).forEach((testParameter) => {
                if (!(compare(features[testParameter], globalVowelConditions[testParameter]))) {
                    flag = false;
                }
            })
        }
    }
    return flag;
}

// POPULATING TABLE AND DISPLAY
function regenerateVowelTable() {
    let maxvowels = 0
    let categorizedVowels = []
    let uncategorizedVowels = []
    fetch('/static/parameters.json')
        .then(response => response.json())
        .then((json) => {

            for (let moa in hoas) {
                for (let poa in foas) {
                    vTable[parseInt(moa)+1][parseInt(poa)+1] = "";
                }
            }

            for (let phoneme in json) {
                if (json[phoneme]["segmentclass"] == "vowel") {
                    maxvowels++;
                    for (let moa in hoas) {
                        for (let poa in foas) {
                            let conditions = hoas[moa] + "|" + foas[poa];
                            if (satisfies(json[phoneme], conditions) && (allowDuplicateVowels.checked || !(categorizedVowels.includes(phoneme)))) {
                                vTable[parseInt(moa)+1][parseInt(poa)+1] += " " + phoneme.split("|")[0];
                                categorizedVowels.push(phoneme.toString())
                            }
                        }
                    }
                    if (categorizedVowels.indexOf(phoneme.toString())==-1 && uncategorizedVowels.indexOf(phoneme.toString())==-1) {
                        uncategorizedVowels.push(phoneme.toString())
                    }
                }
            }

            document.getElementById("vowelsTitle").innerHTML = "Vowels : " + categorizedVowels.length + " out of " + maxvowels;
            document.getElementById("uncategorizedVowels").innerHTML = "Uncategorized : " + uncategorizedVowels.length;
            document.getElementById("uncategorizedVowels").title = uncategorizedVowels.join(" ");
            console.log(uncategorizedVowels.join(" "))

            vowelTable.childNodes.forEach(node => {
                node.remove();
            });

            let placesHeader = vowelTable.createTHead();
            let placesRow = placesHeader.insertRow(0);
            let r;
            for (let i = 0; i < vTable.length; i++) { // rows
                if (i != 0) {
                    r = vowelTable.insertRow(-1); 
                }
                vTable[i].forEach(cell => {
                    if (i == 0) {
                        let c = placesRow.insertCell(-1);
                        if (hoas.includes(cell)) {
                            c.title = cell; 
                            cell = heights[cell]; 
                        }
                        else if (foas.includes(cell)) { 
                            c.title = cell;
                            cell = frontnesses[cell]; 
                        }
                        c.innerHTML = cell;
                    } else {
                        let c = r.insertCell(-1);
                        if (hoas.includes(cell)) { 
                            c.title = cell; 
                            cell = heights[cell];
                        }
                        else if (foas.includes(cell)) { 
                            c.title = cell;
                            cell = frontnesses[cell]; 
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
    const vowelSettings = document.querySelectorAll('input[type="checkbox"][class="forvowels"]');
    vowelSettings.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) { // got checked
                if (Object.keys(globalVowelConditions).includes(checkbox.name)) {
                    if (!(globalVowelConditions[checkbox.name].includes(checkbox.value))) {
                        globalVowelConditions[checkbox.name].push(checkbox.value);
                    }
                } else {
                    globalVowelConditions[checkbox.name] = [checkbox.value];
                }
            } else {
                globalVowelConditions[checkbox.name] = globalVowelConditions[checkbox.name].filter(item => item != checkbox.value);
            }
            regenerateVowelTable();
        });
    })

    document.querySelectorAll('input[type="radio"][class="forvowels"]').forEach((radio) => {
        radio.addEventListener('click', regenerateVowelTable)
    })
})

regenerateVowelTable();