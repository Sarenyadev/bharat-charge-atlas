# Bharat Charge Atlas

"Build an executive EV Infrastructure and Shortage Intelligence Platform called 'EV Infra Map India' tailored for Techfest IIT Bombay / Ministry of Heavy Industries. Use a modern dark theme with emerald green and cyan accents. Include a top navigation bar with national summary KPIs, a filter bar allowing selection by State and District, and a main workspace divided into 4 tabs: (1) Interactive 3D Geospatial Map, (2) EV & Charger Analytics Dashboard, (3) Future Requirement Simulator, and (4) ICAT Strategic Recommendations. Connect directly to my Supabase table v_district_shortage_analysis and charging_stations to populate the district lists and metrics dynamically." Create a top header with national summary KPIs and a District dropdown selector. In the main body, include 4 tabs: 1. Interactive Map: Display charging station markers and district clusters. 2. EV Dashboard: Read from the Supabase view `v_district_shortage_analysis` to display registered 2W, 3W, and 4W EVs, total charger counts, EV-to-charger ratio, and a Shortage Alert badge (CRITICAL, MODERATE, or ADEQUATE). 3. Future Requirements: An interactive calculator with sliders for EV adoption CAGR (10% to 60%) and target ratio (EVs/charger) showing projected charger deficits through 2030. 4. Recommendations: A prioritized queue ranking districts by shortage score with an institutional action brief for MHI/ICAT.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/21a58e48-2cd2-4b49-8cb6-94505e3b5906).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
