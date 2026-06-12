import pandas as pd
import json

df = pd.read_csv("World-Cup-Sweepstake/world_cup_2026_squads.csv")

# Convert to structure:
# {
#   "England": [
#       {
#           "player": "...",
#           "position": "...",
#           "club": "...",
#           "age": 27
#       }
#   ]
# }

squads = {}

for nation, group in df.groupby("nation"):
    squads[nation] = group[
        ["player", "position", "club", "age"]
    ].to_dict(orient="records")

with open("squads.json", "w", encoding="utf-8") as f:
    json.dump(squads, f, indent=2)

print("Saved squads.json")