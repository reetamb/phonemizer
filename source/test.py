import re 

test = "ãwːɪ̯̊ːo"
canon = ['a', 'ɪ','o']

phthongs = []
i = 0
j = 1
while len(test) != i+j:
    if test[i+j] in canon:
        phthongs.append(test[i:i+j])
        i = i+j
        j = 0
    j += 1
phthongs.append(test[i:i+j])
print(phthongs)

