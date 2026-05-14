import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import crypto from 'crypto';
import { simpleParser } from 'mailparser';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const IPV4_REGEX = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g;
const URL_REGEX = /\bhttps?:\/\/[^\s<>"')]+/gi;
const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const DOMAIN_REGEX = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}\b/gi;
const HASH_REGEX = /\b(?:[A-Fa-f0-9]{32}|[A-Fa-f0-9]{40}|[A-Fa-f0-9]{64})\b/g;

const SUSPICIOUS_TLDS = ['xyz', 'top', 'click', 'shop', 'site', 'online', 'ru', 'work', 'icu', 'buzz'];
const URL_SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'rb.gy', 'ow.ly', 'is.gd'];
const DOMAIN_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/i;
const MAX_IOC_IPS = 3;
const MAX_IOC_DOMAINS = 10;
const MAX_IOC_URLS = 6;
const MAX_IOC_EMAILS = 4;
const MAX_IOC_HASHES = 5;
const KNOWN_SAFE_DOMAINS = new Set([
  'gmail.com',
  'google.com',
  'outlook.com',
  'microsoft.com',
  'office.com',
  'yahoo.com',
  'apple.com',
  'amazon.com',
  'w3.org',
  'w3c.org',
  'schema.org',
  'youtube.com',
  'facebook.com',
  'twitter.com',
  'linkedin.com',
  'instagram.com',
  'github.com',
  'fonts.googleapis.com',
  'gstatic.com',
  'fonts.gstatic.com',
  'schemas.microsoft.com',
  'purl.org',
]);

const toneIconMap = {
  success: 'Pass',
  danger: 'Fail',
  warning: 'Warning',
  muted: 'Unknown',
};

const unique = (values) => [...new Set(values.filter(Boolean))];

const toTitleCase = (value = '') =>
  value
    .toLowerCase()
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const isPrivateOrReservedIpv4 = (ip) => {
  const rawParts = ip.split('.');
  const parts = rawParts.map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return true;

  // Reject date-like / zero-padded values such as 04.22.07.37
  if (rawParts.some((part) => part.length > 1 && part.startsWith('0'))) {
    return true;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
};

const safeExec = async (fn, fallback) => {
  try {
    return await fn();
  } catch (error) {
    return typeof fallback === 'function' ? fallback(error) : fallback;
  }
};

const normalizeEmail = (value = '') => {
  const match = value.match(EMAIL_REGEX);
  return match ? match[0].toLowerCase() : '';
};

const getDomainFromEmail = (email = '') => {
  const normalized = normalizeEmail(email);
  return normalized.includes('@') ? normalized.split('@')[1] : '';
};

const normalizeDomain = (domain = '') => domain.toLowerCase().replace(/^www\./, '').replace(/[),.;]+$/g, '');

const isValidDomain = (domain = '') => DOMAIN_PATTERN.test(normalizeDomain(domain));

const getDomainFromUrl = (url = '') => {
  try {
    return normalizeDomain(new URL(url).hostname);
  } catch {
    return '';
  }
};

const toVirusTotalUrlId = (url) =>
  Buffer.from(url).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const parseHeaders = (rawHeaders = '') => {
  const lines = rawHeaders.split(/\r?\n/);
  const unfolded = [];

  for (const line of lines) {
    if (!line) continue;
    if (/^\s/.test(line) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += ` ${line.trim()}`;
    } else {
      unfolded.push(line.trimEnd());
    }
  }

  const map = new Map();
  const ordered = [];

  for (const line of unfolded) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    const normalizedKey = key.toLowerCase();

    if (!map.has(normalizedKey)) {
      map.set(normalizedKey, []);
    }

    map.get(normalizedKey).push(value);
    ordered.push([key, value]);
  }

  return { map, ordered };
};

const getHeaderValues = (headersMap, name) => headersMap.get(name.toLowerCase()) || [];
const getFirstHeaderValue = (headersMap, name) => getHeaderValues(headersMap, name)[0] || '';

const parseAuthenticationResults = (headersMap) => {
  const combined = getHeaderValues(headersMap, 'authentication-results').join(' ; ');
  const results = {};

  for (const field of ['spf', 'dkim', 'dmarc']) {
    const match = combined.match(new RegExp(`\\b${field}=([a-z_]+)`, 'i'));
    results[field] = match ? match[1].toLowerCase() : 'unknown';
  }

  return results;
};

const getAuthTone = (status) => {
  if (['pass', 'bestguesspass'].includes(status)) return 'success';
  if (['fail', 'permerror', 'temperror'].includes(status)) return 'danger';
  if (['softfail', 'neutral', 'none', 'quarantine', 'reject', 'unknown'].includes(status)) return 'warning';
  return 'muted';
};

const getIndicatorDisposition = (malicious = 0, suspicious = 0) => {
  if (malicious > 0) return 'Malicious';
  if (suspicious > 0) return 'Suspicious';
  return 'Clean';
};

const extractIocs = (emailHeaders = '', emailBody = '', headersMap) => {
  const combined = `${emailHeaders}\n${emailBody}`;

  const ips = unique((combined.match(IPV4_REGEX) || []).filter((ip) => !isPrivateOrReservedIpv4(ip)));
  const urls = unique((combined.match(URL_REGEX) || []).map((url) => url.replace(/[),.;]+$/g, '')));
  const emails = unique((combined.match(EMAIL_REGEX) || []).map((email) => email.toLowerCase()));
  const hashes = unique(combined.match(HASH_REGEX) || []);

  const domains = new Set();

  urls.forEach((url) => {
    const domain = getDomainFromUrl(url);
    if (isValidDomain(domain)) domains.add(domain);
  });

  emails.forEach((email) => {
    const domain = getDomainFromEmail(email);
    if (isValidDomain(domain)) domains.add(normalizeDomain(domain));
  });

  (combined.match(DOMAIN_REGEX) || []).forEach((domain) => {
    const normalized = normalizeDomain(domain);
    if (isValidDomain(normalized)) domains.add(normalized);
  });

  [
    getFirstHeaderValue(headersMap, 'from'),
    getFirstHeaderValue(headersMap, 'reply-to'),
    getFirstHeaderValue(headersMap, 'return-path'),
    getFirstHeaderValue(headersMap, 'message-id'),
  ].forEach((value) => {
    const matches = value.match(DOMAIN_REGEX) || [];
    matches.forEach((domain) => {
      const normalized = normalizeDomain(domain);
      if (isValidDomain(normalized)) domains.add(normalized);
    });
  });

  const filteredUrls = urls.filter((url) => {
    const domain = getDomainFromUrl(url);
    return isValidDomain(domain);
  });

  const filteredEmails = emails.filter((email) => {
    const domain = getDomainFromEmail(email);
    return isValidDomain(domain);
  });

  return {
    ips: ips.slice(0, MAX_IOC_IPS),
    urls: filteredUrls.slice(0, MAX_IOC_URLS),
    domains: [...domains]
      .filter(isValidDomain)
      .slice(0, MAX_IOC_DOMAINS),
    emails: filteredEmails.slice(0, MAX_IOC_EMAILS),
    hashes: hashes.slice(0, MAX_IOC_HASHES),
  };
};

const fetchAbuseIpDbReport = async (ipAddress) => {
  const apiKey = process.env.ABUSEIPDB_API_KEY;
  if (!apiKey) {
    return {
      ipAddress,
      disposition: 'Unknown',
      error: 'ABUSEIPDB_API_KEY is not configured.',
    };
  }

  return safeExec(
    async () => {
      const response = await axios.get('https://api.abuseipdb.com/api/v2/check', {
        params: {
          ipAddress,
          maxAgeInDays: 90,
          verbose: true,
        },
        headers: {
          Key: apiKey,
          Accept: 'application/json',
        },
      });

      const data = response.data?.data || {};
      const abuseConfidenceScore = Number(data.abuseConfidenceScore || 0);

      return {
        ipAddress,
        countryCode: data.countryCode || null,
        usageType: data.usageType || null,
        isp: data.isp || null,
        domain: data.domain || null,
        totalReports: data.totalReports || 0,
        lastReportedAt: data.lastReportedAt || null,
        abuseConfidenceScore,
        disposition: abuseConfidenceScore >= 75 ? 'Malicious' : abuseConfidenceScore >= 25 ? 'Suspicious' : 'Clean',
      };
    },
    (error) => {
      console.error(`AbuseIPDB error for ${ipAddress}:`, error.response?.data || error.message);
      return {
        ipAddress,
        disposition: 'Unknown',
        error: error.response?.data?.errors?.[0]?.detail || 'AbuseIPDB lookup failed.',
      };
    },
  );
};

const fetchVirusTotalReport = async (indicator, type) => {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  const knownSafe = type === 'domain' && KNOWN_SAFE_DOMAINS.has(normalizeDomain(indicator));
  if (!apiKey) {
    return {
      indicator,
      type,
      knownSafe,
      disposition: 'Unknown',
      error: 'VIRUSTOTAL_API_KEY is not configured.',
    };
  }

  const configByType = {
    ip: { path: `ip_addresses/${indicator}` },
    domain: { path: `domains/${indicator}` },
    url: { path: `urls/${toVirusTotalUrlId(indicator)}` },
    hash: { path: `files/${indicator}` },
  };

  const config = configByType[type];
  if (!config) {
    return {
      indicator,
      type,
      knownSafe,
      disposition: 'Unknown',
      error: `Unsupported VirusTotal type: ${type}`,
    };
  }

  return safeExec(
    async () => {
      const response = await axios.get(`https://www.virustotal.com/api/v3/${config.path}`, {
        headers: {
          'x-apikey': apiKey,
        },
      });

      const stats = response.data?.data?.attributes?.last_analysis_stats || {};
      const malicious = Number(stats.malicious || 0);
      const suspicious = Number(stats.suspicious || 0);
      const harmless = Number(stats.harmless || 0);
      const undetected = Number(stats.undetected || 0);

      return {
        indicator,
        type,
        knownSafe,
        malicious,
        suspicious,
        harmless,
        undetected,
        disposition: getIndicatorDisposition(malicious, suspicious),
      };
    },
    (error) => {
      const status = error.response?.status;
      const vtErrorCode = error.response?.data?.error?.code;
      const notFound = status === 404 || vtErrorCode === 'NotFoundError';

      if (!notFound) {
        console.error(`VirusTotal error for ${type}:${indicator}:`, error.response?.data || error.message);
      }

      return {
        indicator,
        type,
        knownSafe,
        disposition: 'Unknown',
        error: notFound
          ? 'Indicator not currently present in VirusTotal dataset.'
          : error.response?.data?.error?.message || 'VirusTotal lookup failed.',
      };
    },
  );
};

const buildHeaderDetails = (headersMap, iocs) => {
  const details = [
    ['From', getFirstHeaderValue(headersMap, 'from') || 'Not found'],
    ['Reply-To', getFirstHeaderValue(headersMap, 'reply-to') || 'Not found'],
    ['Return-Path', getFirstHeaderValue(headersMap, 'return-path') || 'Not found'],
    ['Subject', getFirstHeaderValue(headersMap, 'subject') || 'Not found'],
    ['Message-ID', getFirstHeaderValue(headersMap, 'message-id') || 'Not found'],
    ['X-Mailer', getFirstHeaderValue(headersMap, 'x-mailer') || 'Not found'],
    ['Originating IP', iocs.ips[0] || 'Not found'],
  ];

  return details;
};

const buildAuthChecks = (headersMap) => {
  const authResults = parseAuthenticationResults(headersMap);
  const fromAddress = getFirstHeaderValue(headersMap, 'from');
  const replyToAddress = getFirstHeaderValue(headersMap, 'reply-to');
  const fromDomain = getDomainFromEmail(fromAddress);
  const replyToDomain = getDomainFromEmail(replyToAddress);
  const spamStatus = getFirstHeaderValue(headersMap, 'x-spam-status') || getFirstHeaderValue(headersMap, 'x-ms-exchange-antispam-report');

  const replyMismatch = replyToDomain && fromDomain && replyToDomain !== fromDomain ? 'fail' : replyToDomain ? 'pass' : 'unknown';
  const spamTone = spamStatus ? (/yes|phish|high/i.test(spamStatus) ? 'danger' : 'warning') : 'muted';

  return [
    { label: 'SPF', value: toTitleCase(authResults.spf), tone: getAuthTone(authResults.spf) },
    { label: 'DKIM', value: toTitleCase(authResults.dkim), tone: getAuthTone(authResults.dkim) },
    { label: 'DMARC', value: toTitleCase(authResults.dmarc), tone: getAuthTone(authResults.dmarc) },
    { label: 'Reply-To Mismatch', value: toTitleCase(replyMismatch), tone: getAuthTone(replyMismatch) },
    { label: 'Spam Status', value: spamStatus ? 'Present' : 'Unknown', tone: spamTone },
  ];
};

const buildLocalSignals = ({ emailHeaders, emailBody, headersMap, authChecks, iocs, abuseIpDb, vtReports }) => {
  const findings = [];
  const recommendedActions = [];
  const riskFactors = [];
  let score = 0;

  const bodyLower = emailBody.toLowerCase();
  const subject = getFirstHeaderValue(headersMap, 'subject').toLowerCase();
  const fromHeader = getFirstHeaderValue(headersMap, 'from');
  const replyToHeader = getFirstHeaderValue(headersMap, 'reply-to');

  const addRisk = (points, factor, finding, action) => {
    score += points;
    if (factor) riskFactors.push(factor);
    if (finding) findings.push(finding);
    if (action) recommendedActions.push(action);
  };

  for (const check of authChecks) {
    if (check.label === 'SPF' && check.tone === 'danger') {
      addRisk(16, 'SPF fail', 'SPF authentication failed for the sender.', 'Validate the sender through a trusted alternate channel.');
    }
    if (check.label === 'DKIM' && check.tone === 'danger') {
      addRisk(18, 'DKIM fail', 'DKIM signature validation failed.', 'Treat message integrity as untrusted and do not interact with embedded links.');
    }
    if (check.label === 'DMARC' && check.tone !== 'success') {
      addRisk(18, 'DMARC issue', 'DMARC does not cleanly validate for this message.', 'Quarantine the message until sender authenticity is confirmed.');
    }
    if (check.label === 'Reply-To Mismatch' && check.tone === 'danger') {
      addRisk(14, 'Reply-To mismatch', 'Reply-To domain does not match the visible sender domain.', 'Do not reply directly; verify the sender via a known-good address.');
    }
  }

  if (/\b(urgent|immediately|asap|action needed|verify now|payment|payroll|invoice|account suspended|password reset)\b/i.test(`${subject} ${emailBody}`)) {
    addRisk(12, 'Urgent social engineering language', 'Message uses urgency or account/payment pressure language common in phishing.', 'Slow down and validate requests before acting.');
  }

  if (/\b(login|sign in|verify your account|password|credential|portal)\b/i.test(emailBody)) {
    addRisk(12, 'Credential harvesting indicators', 'Body content suggests a login or credential verification lure.', 'Open the legitimate service manually instead of using message links.');
  }

  if (/\b(payroll|wire transfer|bank|invoice|payment)\b/i.test(`${subject} ${emailBody}`)) {
    addRisk(14, 'Financial lure', 'Financial or payroll-themed wording increases the chance of BEC-style phishing.', 'Escalate unusual payment requests before taking action.');
  }

  if (fromHeader && /<(.*?)>/.test(fromHeader) && !normalizeEmail(fromHeader).includes(getDomainFromEmail(fromHeader))) {
    addRisk(4, 'Sender formatting anomaly', 'Sender formatting looks unusual or inconsistent.', null);
  }

  iocs.urls.forEach((url) => {
    const domain = getDomainFromUrl(url);
    const tld = domain.split('.').pop();
    if (URL_SHORTENERS.includes(domain)) {
      addRisk(10, 'Shortened link', `Shortened URL detected: ${domain}.`, 'Resolve shortened URLs before opening them.');
    }
    if (tld && SUSPICIOUS_TLDS.includes(tld)) {
      addRisk(8, 'Suspicious TLD', `URL uses a higher-risk top-level domain: .${tld}.`, null);
    }
  });

  abuseIpDb.forEach((report) => {
    if (report.disposition === 'Malicious') {
      addRisk(75, 'Malicious source IP', `Originating IP ${report.ipAddress} has a high AbuseIPDB confidence score.`, 'Block or isolate the source IP in your controls.');
    } else if (report.disposition === 'Suspicious') {
      addRisk(25, 'Suspicious source IP', `Originating IP ${report.ipAddress} has prior abuse reports.`, null);
    }
  });

  vtReports.forEach((report) => {
    if (report.disposition === 'Malicious') {
      addRisk(75, `${toTitleCase(report.type)} reputation hit`, `${toTitleCase(report.type)} ${report.indicator} is flagged as malicious by VirusTotal.`, 'Block the indicator and investigate matching telemetry.');
    } else if (report.disposition === 'Suspicious') {
      addRisk(25, `${toTitleCase(report.type)} suspicious`, `${toTitleCase(report.type)} ${report.indicator} has suspicious detections on VirusTotal.`, null);
    }
  });

  score = clamp(score, 0, 100);

  const verdict = score >= 70 ? 'High Risk' : score >= 40 ? 'Suspicious' : 'Safe';

  let attackType = 'No Clear Attack Pattern';
  if (/\b(login|password|verify your account|credential)\b/i.test(`${subject} ${emailBody}`)) {
    attackType = 'Credential Harvesting';
  } else if (/\b(payroll|invoice|wire transfer|payment)\b/i.test(`${subject} ${emailBody}`)) {
    attackType = 'Business Email Compromise';
  } else if (/\b(attachment|invoice attached|document attached|macro|download)\b/i.test(`${subject} ${emailBody}`)) {
    attackType = 'Malware Delivery';
  } else if (score >= 40) {
    attackType = 'Suspicious Email';
  }

  if (findings.length === 0) {
    findings.push('No major phishing indicators were triggered by the local rule engine.');
  }

  if (recommendedActions.length === 0) {
    recommendedActions.push('Continue reviewing IOC reputation and sender authenticity before trusting the message.');
  }

  return {
    score,
    verdict,
    attackType,
    keyFindings: unique(findings).slice(0, 6),
    recommendedActions: unique(recommendedActions).slice(0, 6),
    riskFactors: unique(riskFactors).slice(0, 5),
  };
};

const buildIndicators = ({ iocs, abuseIpDb, vtReports }) => {
  const vtMap = new Map(vtReports.map((report) => [`${report.type}:${report.indicator}`, report]));

  const formatVtStats = (report) =>
    report && typeof report.malicious === 'number'
      ? `VT M:${report.malicious} S:${report.suspicious} H:${report.harmless}`
      : 'VT unavailable';

  const buildGroupedIndicator = (label, values, type, formatter = (value) => value) => {
    if (!values.length) return null;

    const reports = values
      .map((value) => vtMap.get(`${type}:${value}`))
      .filter(Boolean);

    const malicious = reports.filter((report) => report.disposition === 'Malicious').length;
    const suspicious = reports.filter((report) => report.disposition === 'Suspicious').length;
    const unknown = reports.filter((report) => report.disposition === 'Unknown').length;
    const query = values[0];
    const disposition = malicious > 0 ? 'Malicious' : suspicious > 0 ? 'Suspicious' : unknown > 0 || reports.length < values.length ? 'Unknown' : 'Clean';

    return {
      label,
      value: values
        .map((value) => {
          const report = vtMap.get(`${type}:${value}`);
          const knownSafeNote = report?.knownSafe ? ' [known-safe list]' : '';
          return `${formatter(value)}${knownSafeNote}`;
        })
        .join(' , '),
      query,
      tags: [disposition],
    };
  };

  const ipValues = abuseIpDb.map((report) => {
    const vtReport = vtMap.get(`ip:${report.ipAddress}`);
    return `${report.ipAddress}${report.countryCode ? ` (${report.countryCode})` : ''}${report.abuseConfidenceScore !== undefined ? ` [Abuse ${report.abuseConfidenceScore}]` : ''}${vtReport ? ` [${formatVtStats(vtReport)}]` : ''}`;
  });

  const grouped = [
    abuseIpDb.length
      ? {
          label: 'Extracted IPs',
          value: ipValues.join(' , '),
          query: abuseIpDb[0].ipAddress,
          tags: [abuseIpDb.some((report) => report.disposition === 'Malicious') ? 'Malicious' : abuseIpDb.some((report) => report.disposition === 'Suspicious') ? 'Suspicious' : 'Clean'],
        }
      : null,
    buildGroupedIndicator('Domains', iocs.domains, 'domain'),
    buildGroupedIndicator('URLs', iocs.urls, 'url'),
    buildGroupedIndicator('Hashes', iocs.hashes, 'hash', (hash) => `${hash.slice(0, 18)}...`),
  ].filter(Boolean);

  return grouped;
};

const buildAiPrompt = ({ emailHeaders, emailBody, headerDetails, authChecks, indicators, localAnalysis }) => `You are an expert cybersecurity analyst.

Use the structured evidence below to refine the phishing assessment. Do not ignore the concrete evidence. You may improve phrasing, summarize impact, and tighten recommendations, but keep the result aligned with the factual indicators.

Parsed Header Details:
${headerDetails.map(([label, value]) => `- ${label}: ${value}`).join('\n')}

Authentication Checks:
${authChecks.map((check) => `- ${check.label}: ${check.value} (${check.tone})`).join('\n')}

Extracted Indicators:
${indicators.map((indicator) => `- ${indicator.label}: ${indicator.value} [${indicator.tags.join(', ')}]`).join('\n')}

Local Rule Engine Assessment:
- Verdict: ${localAnalysis.verdict}
- Attack Type: ${localAnalysis.attackType}
- Score: ${localAnalysis.score}
- Key Findings: ${localAnalysis.keyFindings.join(' | ')}
- Recommended Actions: ${localAnalysis.recommendedActions.join(' | ')}

Original Email Headers:
${emailHeaders}

Original Email Body:
${emailBody}

Return strict JSON with:
"attackType" (string),
"keyFindings" (array of short strings),
"recommendedActions" (array of short strings),
"analystSummary" (short string).`;

const parseDeepseekJson = (rawMessage) => {
  const cleaned = rawMessage.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
};

const fetchDeepseekAnalysis = async (payload) => {
  if (!process.env.DEEPSEEK_API_KEY) {
    return null;
  }

  return safeExec(
    async () => {
      const response = await axios.post(
        'https://api.deepseek.com/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a helpful cybersecurity AI assistant.' },
            { role: 'user', content: buildAiPrompt(payload) },
          ],
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return parseDeepseekJson(response.data.choices[0].message.content);
    },
    (error) => {
      console.error('DeepSeek API Error:', error.response?.data || error.message);
      return null;
    },
  );
};

app.post('/api/check-virustotal', async (req, res) => {
  const { indicator, type } = req.body;
  if (!indicator || !type) {
    return res.status(400).json({ error: 'indicator and type are required.' });
  }

  const normalizedType =
    type === 'ip_addresses' ? 'ip' : type === 'domains' ? 'domain' : type === 'files' ? 'hash' : type === 'urls' ? 'url' : type;

  const report = await fetchVirusTotalReport(indicator, normalizedType);
  if (report.error) {
    return res.status(500).json(report);
  }

  return res.json(report);
});

app.post('/api/check-abuseipdb', async (req, res) => {
  const { ipAddress } = req.body;

  if (!ipAddress) {
    return res.status(400).json({ error: 'ipAddress is required.' });
  }

  const report = await fetchAbuseIpDbReport(ipAddress);
  if (report.error && !process.env.ABUSEIPDB_API_KEY) {
    return res.status(500).json(report);
  }

  return res.json(report);
});

app.post('/api/analyze-email', async (req, res) => {
  const { emailHeaders = '', emailBody = '' } = req.body;
  const { map: headersMap } = parseHeaders(emailHeaders);

  try {
    // Parse raw email to extract accurate attachments
    const rawEmail = `${emailHeaders}\r\n\r\n${emailBody}`;
    const parsedEmail = await simpleParser(rawEmail);
    
    const attachments = parsedEmail.attachments || [];
    const attachmentHashes = [];
    const attachmentDetails = attachments.map(att => {
      const hash = crypto.createHash('sha256').update(att.content).digest('hex');
      attachmentHashes.push(hash);
      return {
        filename: att.filename || 'Unknown',
        contentType: att.contentType,
        size: att.size,
        hash
      };
    });

    const iocs = extractIocs(emailHeaders, emailBody, headersMap);
    
    // Add computed attachment hashes to the IOC list
    iocs.hashes = unique([...iocs.hashes, ...attachmentHashes]).slice(0, MAX_IOC_HASHES);

    // Also extract links from HTML version if available, since they might be hidden in HTML tags
    if (parsedEmail.html) {
      const htmlUrls = parsedEmail.html.match(/\bhttps?:\/\/[^\s<>"')]+/gi) || [];
      const cleanHtmlUrls = htmlUrls
        .map(url => url.replace(/[),.;]+$/g, ''))
        .filter(url => {
          const domain = getDomainFromUrl(url);
          return isValidDomain(domain);
        });
        
      iocs.urls = unique([...iocs.urls, ...cleanHtmlUrls]).slice(0, MAX_IOC_URLS);
      
      cleanHtmlUrls.forEach(url => {
        const domain = getDomainFromUrl(url);
        if (isValidDomain(domain)) {
          iocs.domains.push(domain);
        }
      });
      iocs.domains = unique(iocs.domains).slice(0, MAX_IOC_DOMAINS);
    }

    const headerDetails = buildHeaderDetails(headersMap, iocs);
    const authChecks = buildAuthChecks(headersMap);

    const vtRequests = [
      ...iocs.ips.map((ip) => ({ indicator: ip, type: 'ip' })),
      ...iocs.domains.map((domain) => ({ indicator: domain, type: 'domain' })),
      ...iocs.urls.map((url) => ({ indicator: url, type: 'url' })),
      ...iocs.hashes.map((hash) => ({ indicator: hash, type: 'hash' })),
    ];

    const [abuseIpDb, vtReports] = await Promise.all([
      Promise.all(iocs.ips.map((ip) => fetchAbuseIpDbReport(ip))),
      Promise.all(vtRequests.map(({ indicator, type }) => fetchVirusTotalReport(indicator, type))),
    ]);

    const indicators = buildIndicators({ iocs, abuseIpDb, vtReports });
    const localAnalysis = buildLocalSignals({
      emailHeaders,
      emailBody,
      headersMap,
      authChecks,
      iocs,
      abuseIpDb,
      vtReports,
    });

    const aiAnalysis = await fetchDeepseekAnalysis({
      emailHeaders,
      emailBody,
      headerDetails,
      authChecks,
      indicators,
      localAnalysis,
    });

    const finalData = {
      verdict: localAnalysis.verdict,
      attackType: aiAnalysis?.attackType || localAnalysis.attackType,
      keyFindings: unique([...(aiAnalysis?.keyFindings || []), ...localAnalysis.keyFindings]).slice(0, 6),
      recommendedActions: unique([...(aiAnalysis?.recommendedActions || []), ...localAnalysis.recommendedActions]).slice(0, 6),
      analystSummary:
        aiAnalysis?.analystSummary ||
        `${localAnalysis.verdict} email with a phishing risk score of ${localAnalysis.score}/100 based on authentication, content, and IOC reputation signals.`,
      score: localAnalysis.score,
      riskFactors: localAnalysis.riskFactors,
      authChecks,
      headerDetails,
      indicators,
      iocEnrichment: {
        extractedIps: iocs.ips,
        abuseIpDb,
        virusTotal: vtReports,
      },
      attachments: attachmentDetails,
      analysisSource: {
        localRules: true,
        deepseek: Boolean(aiAnalysis),
      },
    };

    res.json({
      message: 'Analysis complete',
      data: finalData,
    });
  } catch (error) {
    console.error('Analyze email error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Analysis failed. Check backend logs and API configuration.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend is running on port ${PORT}`));
