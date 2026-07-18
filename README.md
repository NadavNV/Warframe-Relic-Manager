# Warframe Relic Manager

A web-based tool designed to help Warframe players manage their relic farming. By entering the name of a Prime item you wish to acquire, the application identifies exactly which relics contain the necessary components and categorizes them by their drop probabilities.

## Features

- **Targeted Farming:** Search for any Prime item to see a complete breakdown of the relics needed to build it.
- **Mathematical Probability Categorization:** While the official drop tables label all relic drops as either "Uncommon" or "Rare", this application parses the actual numerical chances to accurately sort them into their true categories: 3 Common, 2 Uncommon, and 1 Rare item per relic.
- **Automated Drop Table Scraper:** Includes a Python-based scraping script that pulls up-to-date relic and component data directly from the official `warframe.com/droptables`.
- **Scrape-Once, Maintain-Easily Architecture:** Designed to fetch the master drop tables once and generate a static local dataset. The repository includes a Streamlit UI tool for easily adding newly released Prime items and relics to the dataset without needing a full rescrape.

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Data Maintenance:** Python, Streamlit
- **Testing:** `unittest` (Data maintenance tool) and `vitest` (Frontend components)

## Installation & Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (for the frontend)
- [Python 3.x](https://www.python.org/) (for the data scraper and Streamlit tool)

### Quick Start

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/NadavNV/Warframe-Relic-Manager.git](https://github.com/NadavNV/Warframe-Relic-Manager.git)
    cd Warframe-Relic-Manager
    ```

2.  **Initialize the Database:**
    Run the initialization script to fetch the latest drop tables from `warframe.com/droptables` and categorize the item probabilities.

    ```bash
    python packages/data_scripts/initializer.py
    ```

3.  **Perform Manual Data Corrections:**
    The initial scrape does not account for items requiring duplicate components (e.g., Akstiletto requiring 2 barrels and 2 receivers) or special prerequisites (e.g., Aklex requiring fully built Lex Primes). These edge cases must be corrected manually by editing the generated raw JSON files directly.

4.  **Add New Items (Maintenance):**
    When new Prime items are released, use the Streamlit maintenance tool to add them to your dataset.

    ```bash
    pip install streamlit
    streamlit run packages/data_scripts/relic_adder.py
    ```

    _(Note: You can verify the Python maintenance logic by running `python -m unittest discover` before making changes.)_

5.  **Install Frontend Dependencies:**
    Navigate to the frontend directory to install the necessary packages.

    ```bash
    cd packages/frontend
    npm install
    ```

    _(Note: You can run the frontend test suite using `npm run test` to execute Vitest.)_

6.  **Run the Application:**
    Make sure you are still in the `packages/frontend` directory.
    ```bash
    npm run dev
    ```

## Usage

1.  Open the application in your browser.
2.  Enter the name of the desired Prime item in the search bar.
3.  Use the resulting list to plan your void fissure runs efficiently.

## Development Notes

The `initializer.py` script handles the heavy lifting of raw data extraction and categorization. Because of unique crafting exceptions in Warframe, manual JSON edits are required for initial edge cases. The Streamlit `relic_adder.py` tool provides an accessible interface to manage the database over time by adding newly released items. The Vite/React frontend consumes this curated dataset to provide a fast, responsive UI for quick searches during gameplay.
