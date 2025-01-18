import csv, json

with open("parameters.csv", newline='', encoding='UTF8') as file:
    
    all = list(csv.reader(file))
    indices = all[0]
    parameters = all[1:]
    out = dict()

    for param in parameters:
        features = dict()
        for index in indices:
            value = param[indices.index(index)]
            features[index.lower()] = value

        out[param[indices.index("Name")]] = features

    with open("parameters.json", encoding="UTF8", mode="w") as output:
        json.dump(out, output, indent=4, ensure_ascii=False)