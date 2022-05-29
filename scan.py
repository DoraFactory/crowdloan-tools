

# transfer excel data to json format
import csv
import json

csvfile = open('../contributors/all_contributors.csv', 'r')
jsonfile = open('test.json', 'w')

filedname = ("tex_id", "account", "contribution", "time")

reader = csv.DictReader(csvfile, filedname)
for row in reader:
    json.dump(row, jsonfile)
    jsonfile.write(',')