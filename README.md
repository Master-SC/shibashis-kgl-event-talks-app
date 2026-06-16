# BigQuery Release Notes Tracker

A premium, interactive web dashboard to track, search, filter, and share Google Cloud BigQuery release notes. The application is built using a lightweight **Python Flask** server and a plain vanilla **HTML5**, **CSS3 (Glassmorphism)**, and **JavaScript (ES6)** client.

## 🚀 Features

- **Live Atom Feed Parser**: Fetches and parses the official BigQuery Release Notes Atom Feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`) in real time.
- **Granular Update Segmenter**: Parses entry HTML files and splits aggregated daily release summaries into individual update cards based on categories (e.g. `Feature`, `Change`, `Issue`, `Deprecated`).
- **Rich Dark Theme & UI**: A modern dark-mode aesthetic featuring glowing ambient background orbs, glassmorphic cards (`backdrop-filter`), responsive grid layouts, and custom status badges.
- **Instant Search & Sorting**: Real-time client-side search indexing across all release notes and toggle sorting orders (Newest vs. Oldest).
- **Interactive Multi-Selection**: Select updates by clicking them (selected cards toggle a glowing violet border) to compile multiple notes into a single post.
- **Tweet Composer Modal**:
  - Prefills drafted tweet texts according to the selected release notes.
  - Displays a live character counter (with danger highlights for exceeding Twitter's 280-char limit).
  - Quick-inject hashtag shortcuts (e.g. `#BigQuery`, `#GoogleCloud`, `#GCP`).
  - One-click "Copy Text" to clipboard (triggers a local system toast notice).
  - Direct "Post to X" button integrating the Twitter Web Intents API to open a secure draft pop-up window.
- **Shimmering Loaders & Toasts**: High-quality skeleton loading animations and toast notification popups for system statuses.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.14+, Flask
- **Frontend**: Plain Vanilla HTML5, CSS3 (Custom properties, CSS Grid/Flexbox), JavaScript (ES6, Native DOMParser)
- **Icons**: FontAwesome 6.4.0
- **Fonts**: Google Fonts (Inter, Outfit, Fira Code)

---

## 📁 Project Structure

```
bq-releases-notes/
├── app.py                       # Python Flask server & XML parsing engine
├── templates/
│   └── index.html               # Main dashboard UI structure
├── static/
│   ├── css/
│   │   └── styles.css           # Custom CSS styling (glassmorphic theme & badges)
│   └── js/
│       └── app.js               # Parser logic, filter/sorting, selection, and composer modal
├── .gitignore                   # Version control exclusions
└── README.md                    # Project documentation
```

---

## ⚙️ Installation & Local Setup

Make sure you have **Python 3** installed on your system.

### 1. Clone or Open the Directory
Open your terminal and navigate to the project root directory:
```bash
cd C:\Work\GoogleXKaggle\agy-cli-projects\bq-releases-notes
```

### 2. Create a Virtual Environment
Initialize a Python virtual environment to keep dependencies isolated:
```bash
# Windows
python -m venv venv

# Mac/Linux
python3 -m venv venv
```

### 3. Activate the Virtual Environment
Activate the environment in your shell:
```bash
# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Windows (Command Prompt)
.\venv\Scripts\activate.bat

# Mac/Linux (Bash/Zsh)
source venv/bin/activate
```

### 4. Install Dependencies
Install Flask (the only external dependency) inside the virtual environment:
```bash
pip install flask
```

### 5. Launch the Server
Start the development server:
```bash
python app.py
```

Open your browser and navigate to **[http://127.0.0.1:5000](http://127.0.0.1:5000)** to view the application.

---

## 🖥️ How It Works

### Feed Fetching & Parsing
1. When the client loads or the **Refresh** button is clicked, a `GET` request is sent to the `/api/releases` endpoint.
2. The Flask server retrieves the Atom feed XML data from Google and parses it using Python's standard `xml.etree.ElementTree`.
3. The server responds with a clean JSON payload mapping the entry dates and HTML content blocks.
4. The frontend JavaScript leverages the browser's native `DOMParser` to parse the HTML string of each entry, splitting them into discrete updates by `<h3>` header tags, and rendering them as interactive cards.

### Sharing to Twitter/X
- Click the **Tweet** button on any card to draft a tweet for that specific update, or click multiple cards to select them and select **Tweet Selected** on the floating action bar.
- Edit your draft, inject helper tags, copy it to your clipboard, or click **Post to X** to open a new tab containing the Twitter Intent compose window.
