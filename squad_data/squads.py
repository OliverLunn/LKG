import requests
import pandas as pd
from bs4 import BeautifulSoup

url = "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads"

headers = {
    "User-Agent": "Mozilla/5.0"
}

html = requests.get(url, headers=headers).text
soup = BeautifulSoup(html, "html.parser")

records = []

# Find all squad tables
tables = soup.find_all("table", class_="wikitable")

for table in tables:

    # Find the nearest previous h2 or h3 heading (nation)
    nation = None
    heading = table.find_previous(["h2", "h3"])

    if heading:
        nation = heading.get_text(" ", strip=True)

    # Try to find manager text above the table
    manager = None

    prev_text = table.find_previous(string=lambda s: s and "Head coach" in s)

    if prev_text:
        manager = prev_text.strip().replace("Head coach:", "").strip()

    # Parse table rows
    rows = table.find_all("tr")

    # Extract headers
    headers_row = [
        th.get_text(" ", strip=True)
        for th in rows[0].find_all(["th", "td"])
    ]

    for row in rows[1:]:

        cols = row.find_all(["td", "th"])

        if len(cols) < 5:
            continue

        values = [c.get_text(" ", strip=True) for c in cols]

        row_data = dict(zip(headers_row, values))

        # Try to map columns flexibly
        player = (
            row_data.get("Player")
            or row_data.get("Name")
        )

        position = (
            row_data.get("Pos.")
            or row_data.get("Position")
        )

        club = (
            row_data.get("Club")
            or row_data.get("Professional club")
        )

        age = row_data.get("Age")

        records.append({
            "nation": nation,
            "manager": manager,
            "player": player,
            "position": position,
            "club": club,
            "age": age
        })

# Create DataFrame
df = pd.DataFrame(records)

print(df.head())

# Save
df.to_csv("world_cup_2026_squads.csv", index=False)