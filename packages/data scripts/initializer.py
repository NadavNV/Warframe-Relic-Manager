import requests
from bs4 import BeautifulSoup
import json
import re


class SetEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, set):
            return list(obj)
        return json.JSONEncoder.default(self, obj)


def scrape_relics_to_json():
    url = "https://www.warframe.com/droptables"
    print("Fetching drop tables...")

    # Fetch the webpage
    response = requests.get(url)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')

    # What items drop from each relic
    relic_data: dict[str, dict[str, list]] = {}
    # What are the components of each Prime item
    components: dict[str, dict[str, dict[str, str | int | list[str]]]] = {}
    blueprints = {"Chassis", "Systems", "Neuroptics"}

    # Locate the "Relics" header
    relics_header = soup.find('h3', string='Relics:')
    if not relics_header:
        print("Could not find the Relics section.")
        return

    # Iterate through everything after the "Relics" header until the next section
    for sibling in relics_header.find_next_siblings():
        # Stop if we hit the next major section (e.g., "Keys")
        if sibling.name == 'h3':
            break

        # Parse the tables containing the drop data
        if sibling.name == 'table':
            current_relic = None

            for row in sibling.find_all('tr'):
                th = row.find('th')

                # If the row is a header, check if it's the "Intact" version of a relic
                if th:
                    header_text = th.get_text(strip=True)
                    if "Requiem" in header_text:
                        # Skip Requiem relics since they don't contain Prime parts
                        current_relic = None
                    else:
                        if "Intact" in header_text:
                            # Extract just the relic name (e.g., "Lith A1")
                            current_relic = header_text.replace(" (Intact)", "").strip()
                            relic_data[current_relic] = {
                                "Common": [],
                                "Uncommon": [],
                                "Rare": [],
                            }
                            print(current_relic)
                        else:
                            # Skip "Exceptional", "Flawless", and "Radiant" levels
                            # since they contain the exact same items.
                            current_relic = None

                # If we are currently under an "Intact" relic header, parse the items
                elif current_relic:
                    cols = row.find_all('td')
                    if len(cols) == 2:
                        component = cols[0].get_text(strip=True)
                        if "Forma" in component:
                            continue
                        print("  " + component)
                        # Convert items like "Mesa Chassis Blueprint" into just "Mesa Chassis"
                        for keyword in blueprints:
                            if keyword in component:
                                component = component.replace(" Blueprint", "")
                                break

                        drop_chance_text = cols[1].get_text(strip=True)

                        # Use Regex to find the number inside the parentheses
                        # Looks for a pattern like "(25.33%)" and extracts "25.33"
                        match = re.search(r'\(([\d.]+)%\)', drop_chance_text)

                        if match:
                            # Convert the extracted string to a float
                            probability = float(match.group(1))

                            # Categorize strictly by mathematical odds
                            if probability > 20.0:
                                # Covers the ~25.33% chance items
                                rarity = "Common"
                            elif probability > 10.0:
                                # Covers the ~11.00% chance items
                                rarity = "Uncommon"
                            else:
                                # Covers the ~2.00% chance items
                                rarity = "Rare"
                            relic_data[current_relic][rarity].append(component)
                        else:
                            print(f"Error parsing rarity of {component}, {drop_chance_text}")
                            break

                        if "Blueprint" in component:
                            item_name = component.replace(" Blueprint", "").replace(" Prime", "")
                            if item_name not in components:
                                components[item_name] = {
                                    "Blueprint": {
                                        "rarity": rarity,
                                        "relics": [current_relic],
                                        "count": 1,
                                    }
                                }
                            else:
                                if "Blueprint" not in components[item_name]:
                                    components[item_name]["Blueprint"] = {
                                        "rarity": rarity,
                                        "relics": [current_relic],
                                        "count": 1
                                    }
                                else:
                                    components[item_name]["Blueprint"]["relics"].append(current_relic)
                        else:
                            # Split "Paris Prime Lower Limb" into "Paris" and "Lower Limb",
                            # or "Dual Kamas Prime Handle" into "Dual Kamas" and "Handle"
                            item_name, component_name = component.split(" Prime ")
                            if item_name not in components:
                                components[item_name] = {
                                    component_name: {
                                        "rarity": rarity,
                                        "relics": [current_relic],
                                        "count": 1,
                                    }
                                }
                            else:
                                if component_name not in components[item_name]:
                                    components[item_name][component_name] = {
                                        "rarity": rarity,
                                        "relics": [current_relic],
                                        "count": 1,
                                    }
                                else:
                                    components[item_name][component_name]["relics"].append(current_relic)

    # 7. Translate the Python dictionary into formatted JSON
    relic_data_json = json.dumps(relic_data, indent=4)
    components_json = json.dumps(components, indent=4, cls=SetEncoder)

    # Save to a file
    with open("../../data/relic_drops.json", "w") as outfile:
        outfile.write(relic_data_json)
    with open("master_items_initial.json", "w") as outfile:
        outfile.write(components_json)

    print("Successfully scraped and saved to JSON!")


if __name__ == "__main__":
    scrape_relics_to_json()
