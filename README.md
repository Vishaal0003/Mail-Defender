# Mail Defender 🛡️✉️
Live  
https://mail-defender.vercel.app/

**Mail Defender** is a comprehensive, production-ready web application for analyzing suspicious emails and detecting phishing attempts. Built with a React frontend and an Express/Node.js backend, it parses raw email headers and bodies, extracts Indicators of Compromise (IOCs), and provides actionable threat intelligence through integrations with VirusTotal, AbuseIPDB, and DeepSeek AI.

## 🚀 Features

- **Automated Email Parsing:** Extracts and structures email headers, body content, and calculates SHA-256 hashes for attachments.
- **IOC Extraction & Analysis:** Automatically identifies and extracts IPs, URLs, Domains, and Hashes.
- **Threat Intelligence Integrations:**
  - **VirusTotal:** Lookups for URLs, IPs, Domains, and Hashes to identify malicious presence across multiple engines.
  - **AbuseIPDB:** Reputation checks for originating and extracted IP addresses.
- **Authentication Checks:** Validates SPF, DKIM, and DMARC results to detect sender spoofing or Reply-To mismatches.
- **Local Rule Engine:** Heuristic-based risk scoring that evaluates urgency, credential harvesting lures, suspicious TLDs, and URL shorteners.
- **AI-Powered Summary:** Leverages DeepSeek AI to analyze findings and provide human-readable summaries, key findings, and recommended mitigation actions.

## 💻 Tech Stack

- **Frontend:** React, Vite, TailwindCSS (assumed)
- **Backend:** Node.js, Express, Axios, Mailparser, Crypto
- **APIs:** VirusTotal, AbuseIPDB, DeepSeek API

## 📋 Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v16 or higher)
- npm or yarn

You will also need API keys for the following services to enable full functionality:
- [VirusTotal API Key](https://www.virustotal.com/)
- [AbuseIPDB API Key](https://www.abuseipdb.com/)
- [DeepSeek API Key](https://platform.deepseek.com/)

## 🛠️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/mail-defender.git
cd mail-defender
```

### 2. Install dependencies

You can install dependencies for the root, frontend, and backend all at once:

```bash
npm run install:all
```

*Alternatively, install them manually in each directory.*

### 3. Setup Environment Variables

Navigate to the `backend/` directory and create a `.env` file:

```bash
cd backend
touch .env
```

Add the following keys to your `.env` file:

```env
PORT=5000
VIRUSTOTAL_API_KEY=your_virustotal_api_key
ABUSEIPDB_API_KEY=your_abuseipdb_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
```

### 4. Run the application

You can start both the frontend and backend concurrently using the root dev script:

```bash
npm run dev
```

If you prefer to run them separately:

**Frontend:**
```bash
cd frontend
npm run dev
```

**Backend:**
```bash
cd backend
npm run dev # or npm start
```

## 🧠 How it Works

1. **Submit Email:** The user pastes raw email content (headers + body) into the dashboard.
2. **Parsing & IOC Extraction:** The backend splits the email, parses the headers, identifies attachments, and uses Regex to extract IPs, domains, and URLs.
3. **Enrichment:** Extracted indicators are sent to VirusTotal and AbuseIPDB to retrieve reputation scores.
4. **Scoring:** The local engine applies a risk score (0-100) based on authentication failures and suspicious content patterns.
5. **AI Synthesis:** DeepSeek AI reads the structured findings and writes a concise threat assessment.
6. **Report Generation:** The React frontend displays an intuitive dashboard detailing the threat verdict, risk factors, and extracted IOCs.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
