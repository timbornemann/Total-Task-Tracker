# Total-Task-Tracker

The Total-Task tracker is a powerful, locally operated task and learning management based on React, Node.js and SQLite. The application combines classic to-do functions with calendar integration, markdown notes, a pomodoro timer and an integrated learning card system with spaced repetition algorithm.
Ideal for self -organization, project planning or structured exam preparation.

The data is stored completely locally on the server, either by docker or in the classic node.js company. So you keep full control over your content.

## Table of contents

- [Requirements](#requirements)
- [Quick start with the finished Docker image](#quick-start-with-the-finished-docker-image-recommended)
- [Automatic updates with Watchtower](#automatic-updates-with-watchtower)
- [Docker Compose: Building image yourself](#docker-compose-building-image-yourself)
- [Installation for local development](#installation-for-local-development)
- [Start development](#start-development)
- [Manual production without Docker](#manual-production-without-docker)
- [Build Android APK](#build-android-apk)
- [Functions](#functions)

## Requirements

- For local development: **Node.js** (recommended version 18) and **npm**
- For production use: **Docker** and **docker-compose**

## Quick start with the finished Docker image (recommended)

If you don't want to build locally, you can use the docker image already provided from the Github Container Registry:

```bash
docker pull ghcr.io/timbornemann/total-task-tracker:latest
docker run -d --name total-task-tracker -p 3002:3002 -v total-task-tracker-data:/app/server/data ghcr.io/timbornemann/total-task-tracker:latest
```

By default, the application stores its SQLite data in the volume `total-task-tracker-data`. This volume is created automatically on first start and is retained when the container is updated. If you prefer to bind a specific directory, you can specify a volume:

```bash
docker run -d --name total-task-tracker -p 3002:3002 -v ./server/data:/app/server/data ghcr.io/timbornemann/total-task-tracker:latest
```

If a certain IP should be shown in the settings (for example when using Docker), set the environment variable `SERVER_PUBLIC_IP`. This value also appears under "Server Info".

## Automatic updates with Watchtower

To keep the container up to date, you can use [Watchtower](https://containrrr.dev/watchtower/). It regularly checks whether new images are available.

### Monitor all containers

```bash
docker run -d --name watchtower --restart unless-stopped -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower --interval 3600
```

The parameter `--interval` specifies the check interval in seconds. In this example, Watchtower searches for updates every hour and restarts affected containers.

### Only update this container

```bash
docker run -d --name watchtower --restart unless-stopped -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower total-task-tracker-app --interval 3600
```

If Watchtower should only check once and then exit, add `--run-once`:

```bash
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower total-task-tracker-app --run-once
```

## Docker Compose: Building image yourself

The application can also be carried out completely via `docker compose`. A production building is automatically created.

1. Repository cloning and switching to the project directory
2. Build and start containers (optionally sets the version number)

```bash
VERSION=$(git describe --tags --abbrev=0) docker-compose up --build
```

The service then listens on port **3002**. In the browser at `http://localhost:3002` you reach the dashboard. The data is stored in a named Docker volume (`total-task-tracker-data`). The container can be stopped with `docker compose down` without losing data.

## Installation for local development

```bash
# Repository cloning
git clone <REPO_URL>
cd Total-Task-Tracker

# Install dependencies
npm install

The project uses **react-markdown** to display notes.
```

## Start development

In development mode, the React application with Vite runs on port **8081**. The Node server can also be started for data storage.

```bash
# Frontend with automatic reload
npm run dev


# In the second terminal: start backend
npm start
```

Then open `http://localhost:8081` in your browser.

## Execute tests

The application uses [vitest] (https://vitest.dev/) and the React Testing Library.
After installing the dependencies, you can start the tests with the following command:

```bash
npm test
```

## Manual production without Docker

If you want to deploy without a docker, you can build the application locally and use the node server directly.

```bash
npm run build
npm start # starts the built app on port 3002
```

## Build Android APK

Use [Capacitor](https://capacitorjs.com/) to wrap the tracker as an Android app.

1. Initialize the project once:
   ```bash
   npm install
   npx cap init total-task-tracker com.example.total_task_tracker --web-dir=dist
   npx cap add android
   ```
2. Create a production build and copy the files:
   ```bash
   npm run build:android
   ```
3. Open the Android project in Android Studio to generate a signed APK:
   ```bash
   npm run open:android
   ```

## Functions

- Create, edit and sort tasks
- Subscriptions and priorities
- Separate page for recurring tasks with your own intervals and dynamic titles
- Template page with daily, weekly and monthly view
- Tasks can be planned with the start and end time
- Tasks without a time are displayed as a list per day
- Own notes sorted with color and drag & drop
- Notes can be pinned; The first three pinned people appear on the homepage
- tasks can also be pinned up; The first three are shown on the homepage
- Text can be written in the Markdown format
- Built editor offers icons and tooltips for frequent formatting (e.g. lists, links, code blocks)
  -Learning cards with spaced repetition training and management of your own cards
- decks can be blinded or hidden when learning

- Optional random mode without evaluation
- Training mode directly on the card side with a freely adjustable round size
- Input mode for typing the answers; After checking, you assess yourself whether the card was easy, medium or heavy
- Timed mode with customizable countdown per card; The timer is started once and can be paused. In the event of expiry, "heavy" is automatically evaluated
- Statistics page for learning cards
- Deck statistics with an overview of due cards
- Inventory management with categories and tags
- Storage of the data on the local server
- can be installed as a progressive web app (desktop and smartphone)
- Pomodoro-timer continues when recharging the page
- Dedicated clock page displaying the current time
- Time tracking for any life area with categories, editing, map view and overview statistics including charts showing time distribution across areas
  -Can be displayed as a floating window (picture-in-picture)
  -Statistics page on the Pomodoro page with daily, weekly, monthly and annual overview
- Evaluation after times of day (tomorrow, noon, evening, night)
- Additional display for the current day
- Minutes for work and break are counted separately and as stacked beams
  shown. When pausing or resetting the timer, the values are
  updated immediately.
- Learning and breaking time freely configurable (also adaptable directly in the timer)
- Data can be exported and imported in the setting area
  (including settings)
- Import shows a preview of the elements to be inserted and confirms the success

- In addition, the pure data structure can be exported as JSON
- Central synchronization via http. A container can be a sync server
  are operated, everyone else sends their data there regularly.
  The server lists its IP addresses and leads a log over incoming
  Inquiries. If the server fails, clients continue to save and the same
  the data off as soon as the server can be reached again.
  -Live updates via server-Sent Events automatically keep open clients up to date.
- Deleted entries are compared via a deletion log and do not reappear.
- Standard priority for new tasks adjustable
- multilingual surface (German, English) selectable
  -Several theme presets (Light, Dark, Ocean, Dark-Red, Hacker,
  Motivation) are available. You can create and manage multiple custom
  themes with individually adjustable colors.
- Each theme preset now includes a suitable color palette for categories, tasks and notes
- New "Info" rider in the settings shows version number, release notes and readme
- German or English can be selected in the "Language" tab
- Submenu "Server Info" in the settings lists IP addresses, port and finished URLs
