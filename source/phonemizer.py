import json, re


# boolean methods
def has(features, f1):
    if "+" in features[f1]:
        return True
    return False

def both(features, f1, f2):
    if has(features, f1) and has(features, f2):
        return True
    return False

def but(features, f1, f2):
    if has(features, f1) and not has(features, f2):
        return True
    return False

def mixed(features, fs):
    for f in fs:
        if "," in features[f]:
            return True
    return False

def phthongs(master, multiphthong):
    out = []
    i = 0
    j = 1
    while len(multiphthong) != i+j:
        if multiphthong[i+j] in master:
            out.append(multiphthong[i:i+j])
            i = i+j
            j = 0
        j += 1
    out.append(multiphthong[i:i+j])
    return out

def tridentify(features, ft, trait, upper, lower, default):
    ft[trait] = default
    if has(features, upper):
        ft[trait] = upper
        return 2
    elif has(features, lower):
        ft[trait] = lower
        return 0
    return 1

def bidentify(features, ft, trait, marked, default):
    ft[trait] = default
    if has(features, marked):
        ft[trait] = marked
        return 1
    return 0

def duodentify(features, ft, trait, one, other, dual, neither):
    a = has(features, one)
    b = has(features, other)
    
    ft[trait] = neither
    if a and b:
        ft[trait] = dual
        return 3
    if a:
        ft[trait] = one
        return 1
    if b:
        ft[trait] = other
        return 2
    return 0

def idictify(features, ft, trait, pairings, default):
    ft[trait] = default
    for i in range(len(pairings.keys())):
        if has(features, list(pairings.keys())[i]):
            ft[trait] = pairings[list(pairings.keys())[i]]
            return i + 2
    return 1

def concatenate_ints(src, field):
    out = ""
    for key in src.keys():
        out += str(src[key][field])
    return int(out)

pb_all_phonemes = {}
with open("parameters.json", newline='', encoding='UTF8') as parameters_file:
    pb_all_phonemes = dict(json.load(parameters_file))

    with open("vowels.json", encoding="UTF8", mode="w") as output_file:
        my_all_phonemes = dict()
        my_unidentified_glides = dict() # format: { glide: [dipthong occurences] }
        my_identified_monophthongs = []

        for this_phoneme in pb_all_phonemes.keys():
            pb_phoneme_features = pb_all_phonemes[this_phoneme]
            my_phoneme_features = dict()

            my_phoneme_features["type"] = pb_phoneme_features["segmentclass"]

            if my_phoneme_features["type"] == "vowel":

                my_phoneme_id = ""

                if mixed(pb_phoneme_features, ["high", "low", "back", "front", "round", "tense", "labial", "nasal"]):
                    my_phoneme_features["grade"] = "multiphthong"
                    my_phoneme_features["components"] = dict()
                    for phthong in phthongs(my_all_phonemes.keys(), this_phoneme):
                        if not phthong in my_identified_monophthongs:
                            my_phoneme_features["components"][phthong] = {}
                            if not phthong in my_unidentified_glides.keys():
                                my_unidentified_glides[phthong] = [this_phoneme]
                            else:
                                my_unidentified_glides[phthong].append(this_phoneme)
                        else:
                            my_phoneme_features["components"][phthong] = my_all_phonemes[phthong]

                            my_phoneme_id = int(str(my_all_phonemes[phthong]["identifier"]) + str(my_phoneme_id))
                            
                            my_phoneme_features["identifier"] = my_phoneme_id
                    
                else:
                    my_phoneme_features["grade"] = "monophthong"
                    my_phoneme_id = 0

                    my_phoneme_id += 1 * tridentify(pb_phoneme_features, my_phoneme_features, "height", "high", "low", "mid")
                    my_phoneme_id += 3 * tridentify(pb_phoneme_features, my_phoneme_features, "backness", "front", "back", "central")
                    my_phoneme_id += 10 * bidentify(pb_phoneme_features, my_phoneme_features, "roundness", "round", "unround")
                    my_phoneme_id += 20 * bidentify(pb_phoneme_features, my_phoneme_features, "rhoticity", "coronal", "plain")
                    my_phoneme_id += 40 * (bidentify(pb_phoneme_features, my_phoneme_features, "nasality", "nasal", "oral"))
                    my_phoneme_id += 100 * duodentify(pb_phoneme_features, my_phoneme_features, "length", "long", "short", "half-long", "normal")
                    my_phoneme_id += 400 * bidentify(pb_phoneme_features, my_phoneme_features, "tenseness", "tense", "lax")
                    my_phoneme_id += 1000 * idictify(pb_phoneme_features, my_phoneme_features, "phonation", {"constrictedglottis": "creaky", "spreadglottis": "breathy", "retractedtongueroot": "pharyngealized", "epilaryngealsource": "epiglottalized", "delayedrelease": "frictionalized", "advancedtongueroot": "expanded", "periodicglottalsource": "modal"}, "voiceless")
                    
                    my_phoneme_features["identifier"] = my_phoneme_id
                
                    my_identified_monophthongs.append(this_phoneme)
                    if this_phoneme in my_unidentified_glides.keys():
                        for glide_occurrence in my_unidentified_glides[this_phoneme]:
                            my_all_phonemes[glide_occurrence]["components"][this_phoneme] = my_phoneme_features
                         
                            flag = True
                            for component in my_all_phonemes[glide_occurrence]["components"]:
                                if not "identifier" in my_all_phonemes[glide_occurrence]["components"][component]:
                                    flag = False
                            
                            if glide_occurrence == "uœ":
                                print("hey man you just got a uœ")
                            if flag:
                                my_all_phonemes[glide_occurrence]["identifier"] = concatenate_ints(my_all_phonemes[glide_occurrence]["components"], "identifier")
                my_all_phonemes[this_phoneme] = my_phoneme_features
        
        for multiphthong in my_all_phonemes.keys():

                id = str(my_all_phonemes[multiphthong]["identifier"])
                my_all_phonemes[multiphthong]["nucleus"] = "syllabic"
                if "-,+,-" in pb_all_phonemes[multiphthong]["syllabic"]:
                    my_all_phonemes[multiphthong]["nucleus"] = "circumglide"
                    id = "5" + id
                elif "+,-" in pb_all_phonemes[multiphthong]["syllabic"]:
                    my_all_phonemes[multiphthong]["nucleus"] = "offglide"
                    id = "4" + id
                elif "-,+" in pb_all_phonemes[multiphthong]["syllabic"]: 
                    my_all_phonemes[multiphthong]["nucleus"] = "onglide"
                    id = "3" + id
                elif "-" in pb_all_phonemes[multiphthong]["syllabic"]:
                    my_all_phonemes[multiphthong]["nucleus"] = "nonsyllabic"
                    id = "2" + id
                else:
                    id = "1" + id
                my_all_phonemes[multiphthong]["identifier"] = int(id)
                

        json.dump(my_all_phonemes, output_file, indent=4, ensure_ascii=False)

with open("vowels.json", newline='', encoding='UTF8') as d:
    my_all_phonemes = dict(json.load(d))
    analysis = dict()

    for vowel in my_all_phonemes.keys():
        
        if not my_all_phonemes[vowel]["identifier"] in analysis.keys():
            analysis[my_all_phonemes[vowel]["identifier"]] = [vowel]
        else:
            analysis[my_all_phonemes[vowel]["identifier"]].append(vowel)

    for k in analysis.keys():
        if len(analysis[k]) > 1:
            print(str(k) + ": " + str(analysis[k]))
            for duplicate in list(analysis[k])[1:]:
                for feature in pb_all_phonemes[duplicate].keys():
                    f1 = pb_all_phonemes[analysis[k][0]][feature]
                    f2 = pb_all_phonemes[duplicate][feature]
                    if f1 != f2 and "+" in [f1, f2] and feature != "description" and feature != "id":
                        print(feature + ": " + f1 + " vs. " + f2, analysis[k][0], duplicate)

# # with open("parameters.json", newline='', encoding='UTF8') as file:
# #     data = dict(json.load(file))

# #     comparison = str(input("Compare: "))
# #     while len(comparison) > 0:
# #         comparison = comparison.split(" ")

# #         for feature in data[comparison[0]].keys():
# #             f1 = data[comparison[0]][feature]
# #             f2 = data[comparison[1]][feature]
# #             if f1 != f2:
# #                 print(feature + ": " + f1 + " vs. " + f2)
# #         comparison = str(input("Compare: "))