# Mail Defender Product Requirements Document

Version: 1.0  
Date: May 21, 2026  
Product: Mail Defender  
Owner: Project Maintainer  
Status: Draft for MVP and company-level roadmap

## 1. Executive Summary

Mail Defender is a web-based suspicious email analysis platform that helps users inspect raw email headers, email body content, links, domains, IP addresses, hashes, and attachments before trusting or acting on a message.

The current product already provides a strong MVP: users can paste raw email content or upload an `.eml` file, run phishing analysis, review sender authentication signals, inspect extracted indicators of compromise, check threat intelligence results, generate an AI-assisted analyst summary, and export a formal PDF report.

The long-term company-level vision is to evolve Mail Defender from a single-user analysis utility into an enterprise email threat investigation platform used by security teams, IT admins, SOC analysts, compliance teams, and managed security providers.

## 2. Product Vision

Mail Defender should become a reliable investigation workspace for email threats, combining automated parsing, reputation intelligence, local detection rules, AI-assisted reasoning, and organization-level case management.

The product should help teams answer four questions quickly:

- Is this email safe, suspicious, or high risk?
- What evidence supports the verdict?
- What actions should the user or security team take next?
- How can the organization track, share, and improve email threat response over time?

## 3. Current Product Snapshot

The current implementation includes:

- React, Vite, TailwindCSS frontend.
- Express and Node.js backend.
- Raw email header and body intake.
- `.eml` and `.txt` upload support through the browser.
- Drag-and-drop email upload experience.
- Header parsing for sender, reply-to, return-path, subject, message ID, mailer, and originating IP.
- SPF, DKIM, DMARC, reply-to mismatch, and spam status checks.
- IOC extraction for IPs, domains, URLs, emails, and hashes.
- Attachment extraction and SHA-256 hashing through `mailparser` and `crypto`.
- VirusTotal enrichment for IPs, domains, URLs, and hashes.
- AbuseIPDB enrichment for IP reputation.
- Local heuristic phishing risk scoring.
- Attack type classification such as credential harvesting, business email compromise, malware delivery, suspicious email, and no clear attack pattern.
- DeepSeek AI analysis for summary, key findings, and recommendations.
- Formal report section in the UI.
- Copy report to clipboard.
- Client-side PDF export.
- Light and dark theme support.
- Direct links from indicators and attachments to VirusTotal.

## 4. Problem Statement

Email remains one of the most common entry points for phishing, credential theft, business email compromise, malware delivery, invoice fraud, and social engineering. Many users and small security teams do not have a fast, structured way to inspect suspicious messages before acting on them.

Manual email investigation is slow because analysts must:

- Separate headers from body content.
- Interpret sender authentication results.
- Extract and normalize links, domains, IPs, and hashes.
- Check multiple reputation sources.
- Review attachment hashes.
- Identify social engineering language.
- Write a useful summary and recommendation.
- Share the result with users or leadership.

Mail Defender reduces this friction by turning a suspicious email into a structured, evidence-backed report.

## 5. Goals

### 5.1 MVP Goals

- Allow users to analyze suspicious emails from pasted content or uploaded files.
- Extract common email threat indicators.
- Enrich indicators with third-party threat intelligence.
- Calculate a risk score from authentication, content, reputation, and attachment signals.
- Generate readable analyst findings and recommendations.
- Produce a report that can be copied or exported.

### 5.2 Company-Level Goals

- Support multiple users and organizations.
- Add secure authentication, authorization, and audit logging.
- Store analysis history, cases, and evidence.
- Integrate with enterprise identity providers, SIEM, SOAR, ticketing, and email platforms.
- Scale analysis reliably for team and enterprise workloads.
- Provide admin controls, policy management, and compliance-ready reporting.
- Improve detection quality with configurable rule packs, threat feed management, and feedback loops.

## 6. Non-Goals

For the current product stage, Mail Defender is not intended to:

- Replace a full email security gateway.
- Automatically quarantine or delete emails from inboxes.
- Provide guaranteed malware verdicts without sandboxing.
- Act as a legal or compliance authority.
- Store sensitive customer email data without explicit data protection controls.

These capabilities can become part of later enterprise phases after security, privacy, and operational foundations are built.

## 7. Target Users

### 7.1 Primary Users

Security analysts:

- Need to investigate suspicious emails quickly.
- Need evidence, risk scoring, and recommendations.
- Need exportable reports for tickets and stakeholders.

IT administrators:

- Need to help employees verify suspicious emails.
- Need a practical tool for triage without deep SOC tooling.

Employees and non-technical users:

- Need a simple way to submit suspicious emails.
- Need a clear verdict and safe next steps.

### 7.2 Future Enterprise Users

SOC managers:

- Need team metrics, SLA tracking, analyst productivity, and escalation visibility.

Compliance teams:

- Need audit trails, retention controls, and evidence exports.

Managed security providers:

- Need multi-tenant workspaces and client-level reporting.

Security engineers:

- Need API access, SIEM integration, rule tuning, and automation hooks.

## 8. User Personas

### 8.1 SOC Analyst

Needs to process several suspicious emails per day, validate indicators, and create evidence-backed tickets.

Success means:

- Analysis takes less than 2 minutes for common emails.
- The system shows why a message is risky.
- Findings can be copied into a ticket with minimal editing.

### 8.2 IT Helpdesk Admin

Needs to respond when employees forward suspicious emails.

Success means:

- Can upload `.eml` files.
- Gets an easy verdict.
- Can export a report and advise the employee.

### 8.3 Employee Reporter

Needs a simple, safe submission path.

Success means:

- Can submit a suspicious message without learning email headers.
- Receives simple guidance such as do not click, verify sender, or report to IT.

### 8.4 Security Manager

Needs to understand trends and team performance.

Success means:

- Can see number of analyzed emails, high-risk detections, common lure types, and top indicators.
- Can review cases and evidence.

## 9. Key Use Cases

### 9.1 Analyze a Suspicious Email

User pastes headers and body or uploads an `.eml` file. Mail Defender parses the email, extracts indicators, enriches them, scores risk, and generates a report.

### 9.2 Review Authentication Signals

User checks SPF, DKIM, DMARC, reply-to mismatch, and spam status to understand sender trust.

### 9.3 Inspect IOCs

User reviews extracted IPs, URLs, domains, and hashes with reputation summaries and direct VirusTotal links.

### 9.4 Review Attachments

User sees attachment names, MIME types, sizes, SHA-256 hashes, and VirusTotal links.

### 9.5 Export a Report

User copies or exports a structured security report for documentation, escalation, or ticketing.

### 9.6 Enterprise Case Management

Future users save analyses as cases, assign owners, add comments, track status, and link related submissions.

### 9.7 Organization-Wide Monitoring

Future administrators review trends across users, departments, domains, lure types, and recurring indicators.

## 10. Current Functional Requirements

### 10.1 Email Intake

Requirement: The system shall allow users to paste raw email headers and body content.

Acceptance criteria:

- User can enter headers and body separately.
- User can submit analysis when at least one field has content.
- Empty submission should not trigger analysis.

Requirement: The system shall allow users to upload `.eml` and `.txt` files.

Acceptance criteria:

- Uploaded content is read as text.
- If a header/body boundary exists, content is split automatically.
- If no boundary exists, the system falls back to a best-effort split.

### 10.2 Header Parsing

Requirement: The system shall parse common email headers.

Acceptance criteria:

- Extracts From, Reply-To, Return-Path, Subject, Message-ID, X-Mailer, and originating IP when available.
- Handles folded headers.
- Displays missing values as not found or unknown.

### 10.3 Authentication Checks

Requirement: The system shall detect authentication results from email headers.

Acceptance criteria:

- Identifies SPF, DKIM, and DMARC values from Authentication-Results.
- Identifies reply-to domain mismatch when Reply-To and From domains differ.
- Displays each check with a clear status tone.

### 10.4 IOC Extraction

Requirement: The system shall extract indicators of compromise from headers and body.

Acceptance criteria:

- Extracts public IPv4 addresses.
- Excludes private, reserved, multicast, loopback, and date-like IP values.
- Extracts URLs, domains, email addresses, and MD5, SHA-1, SHA-256 hashes.
- Normalizes domains by lowercasing and removing `www.`.
- Limits extracted indicators to protect performance and API usage.

### 10.5 Threat Intelligence Enrichment

Requirement: The system shall enrich indicators through VirusTotal.

Acceptance criteria:

- Supports IP, domain, URL, and hash lookup.
- Returns malicious, suspicious, harmless, undetected, and disposition data when available.
- Handles missing API keys and unavailable indicators gracefully.

Requirement: The system shall enrich IPs through AbuseIPDB.

Acceptance criteria:

- Returns country, usage type, ISP, domain, total reports, last report date, abuse confidence score, and disposition when available.
- Handles missing API keys gracefully.

### 10.6 Attachment Analysis

Requirement: The system shall parse email attachments and compute SHA-256 hashes.

Acceptance criteria:

- Extracts attachment filename, content type, size, and hash.
- Adds attachment hashes to the IOC hash list.
- Provides VirusTotal links for attachment hashes.

### 10.7 Risk Scoring

Requirement: The system shall calculate a 0 to 100 phishing risk score.

Acceptance criteria:

- Score includes authentication failures, reply-to mismatch, urgency language, credential language, financial lure language, suspicious TLDs, shortened URLs, malicious IPs, suspicious IPs, and VirusTotal hits.
- Score is clamped between 0 and 100.
- Verdict maps to Safe, Suspicious, or High Risk.

### 10.8 AI Analysis

Requirement: The system shall generate an AI-assisted analyst summary when an AI API key is configured.

Acceptance criteria:

- AI receives structured evidence from headers, auth checks, indicators, local analysis, original headers, and body.
- AI returns attack type, key findings, recommended actions, and analyst summary.
- If AI fails or is not configured, local analysis remains available.

### 10.9 Reporting

Requirement: The system shall display a formal report.

Acceptance criteria:

- Report includes verdict, attack type, risk score, executive assessment, analyzed fields, observed signals, attachment review, key findings, and recommendations.
- Report can be copied to clipboard.
- Report can be exported as a PDF.

## 11. Future Functional Requirements

### 11.1 User Accounts and Authentication

Requirement: The system shall support secure user accounts.

Future acceptance criteria:

- Email/password login for small teams.
- SSO support through SAML or OIDC for enterprises.
- Optional multi-factor authentication.
- Password reset and account recovery.
- Session management and logout.

### 11.2 Organization and Tenant Management

Requirement: The system shall support multiple organizations.

Future acceptance criteria:

- Each organization has isolated users, cases, reports, settings, and API keys.
- Organization admins can invite and remove users.
- Managed service providers can switch between client tenants.

### 11.3 Role-Based Access Control

Requirement: The system shall restrict capabilities by role.

Future roles:

- Owner
- Admin
- Analyst
- Read-only Reviewer
- Employee Reporter

Future acceptance criteria:

- Only admins manage integrations and policies.
- Analysts manage cases and investigations.
- Employee reporters can submit suspicious emails but cannot view all investigations.

### 11.4 Analysis History

Requirement: The system shall store past analyses.

Future acceptance criteria:

- Saved analyses include raw source metadata, parsed evidence, IOCs, score, verdict, report, timestamps, and analyst owner.
- Users can search and filter by verdict, attack type, sender, domain, IOC, date, and status.
- Sensitive raw email content can be redacted or deleted according to retention policy.

### 11.5 Case Management

Requirement: The system shall support investigation cases.

Future acceptance criteria:

- Cases can be created from analyses.
- Cases have status, severity, owner, comments, labels, evidence, and timeline.
- Multiple email submissions can be linked to one case.
- Cases can be exported or synced to ticketing tools.

### 11.6 Employee Submission Portal

Requirement: The system shall provide a simple reporting experience for employees.

Future acceptance criteria:

- Employees can forward suspicious emails or upload `.eml` files.
- Employees receive a simple response: safe, under review, or confirmed malicious.
- Security team sees submissions in a triage queue.

### 11.7 Email Platform Integrations

Requirement: The system shall integrate with enterprise email providers.

Future integrations:

- Microsoft 365
- Google Workspace
- IMAP mailbox ingestion
- Outlook add-in
- Gmail add-on

Future acceptance criteria:

- Users can submit emails from mailbox tools.
- Admins can pull message headers and metadata through provider APIs.
- Optional remediation actions can be added later, such as quarantine or purge.

### 11.8 SIEM, SOAR, and Ticketing Integrations

Requirement: The system shall export findings to security workflows.

Future integrations:

- Splunk
- Microsoft Sentinel
- Elastic
- Chronicle
- Jira
- ServiceNow
- TheHive
- Slack or Microsoft Teams alerts

Future acceptance criteria:

- High-risk findings can trigger webhook events.
- Analysts can send a report to a ticket.
- SIEM events include normalized fields and IOCs.

### 11.9 Threat Feed Management

Requirement: The system shall support additional threat intelligence sources.

Future sources:

- URLScan.io
- PhishTank
- OpenPhish
- GreyNoise
- MISP
- Hybrid Analysis
- Any.Run
- internal blocklists and allowlists

Future acceptance criteria:

- Admins can enable or disable feeds.
- Results are normalized into a common disposition model.
- API failures do not block the whole analysis.

### 11.10 Rule Engine Management

Requirement: The system shall support configurable detection rules.

Future acceptance criteria:

- Rules can be added, edited, disabled, and versioned.
- Rules support conditions on headers, body text, URLs, domains, auth results, and reputation results.
- Rules produce score changes, tags, findings, and recommended actions.
- Rule changes are audited.

### 11.11 AI Governance

Requirement: The system shall use AI safely and transparently.

Future acceptance criteria:

- AI output is grounded in extracted evidence.
- AI prompts and responses are logged according to organization settings.
- Admins can disable AI or choose provider/model.
- Sensitive content redaction can be applied before AI processing.
- UI clearly separates evidence from AI interpretation.

### 11.12 Sandboxing and Attachment Detonation

Requirement: The system shall support deeper file analysis.

Future acceptance criteria:

- Suspicious attachments can be submitted to sandbox providers.
- Results include behavior summary, contacted domains, dropped files, screenshots, and verdict.
- File submission respects organization privacy settings.

### 11.13 Domain and URL Analysis

Requirement: The system shall provide deeper URL and domain intelligence.

Future acceptance criteria:

- URL expansion for shorteners.
- Redirect chain capture.
- Screenshot preview of landing pages.
- WHOIS and domain age checks.
- TLS certificate inspection.
- Homoglyph and lookalike domain detection.

### 11.14 Admin Dashboard

Requirement: The system shall provide organization-level visibility.

Future acceptance criteria:

- Shows analysis volume, verdict distribution, top attack types, top targeted departments, top malicious domains, top senders, and recent high-risk cases.
- Supports filtering by time range and business unit.
- Exports executive reports.

### 11.15 Public and Internal APIs

Requirement: The system shall expose documented APIs.

Future acceptance criteria:

- API supports email analysis, IOC lookup, report retrieval, case creation, and webhook configuration.
- API keys can be scoped and rotated.
- API usage is rate limited and audited.

## 12. Non-Functional Requirements

### 12.1 Security

- All secrets must be stored in environment variables or a secret manager.
- API keys must never be exposed to the frontend.
- Raw email data should be treated as sensitive.
- The backend should validate request payloads.
- The system should support authentication before enterprise release.
- All organization data should be tenant-isolated.
- Logs should avoid storing full sensitive email bodies unless explicitly enabled.

### 12.2 Privacy

- Users should know when email content is sent to third-party APIs.
- Enterprise admins should control whether raw body content is sent to AI providers.
- Retention settings should define how long raw emails, parsed data, and reports are stored.
- Deletion should remove sensitive content from active storage.

### 12.3 Performance

- MVP single-email analysis should complete within 10 to 30 seconds depending on external API latency.
- UI should remain responsive while analysis is running.
- Enterprise analysis should move long-running enrichment to background jobs.
- Caching should reduce repeated lookups for the same IOCs.

### 12.4 Reliability

- Third-party API failures should degrade gracefully.
- The system should return partial results when some integrations fail.
- Enterprise deployments should include retries, queues, health checks, and monitoring.

### 12.5 Scalability

- Backend should support horizontal scaling.
- IOC enrichment should be async and queue-based for high volume.
- Results should be stored in a database rather than browser state.
- Repeated IOC lookups should use cache and rate limit controls.

### 12.6 Usability

- Verdict and recommended actions should be understandable by non-experts.
- Analysts should be able to inspect raw evidence.
- Reports should be clean enough for leadership, users, and tickets.
- UI should support both quick triage and deeper investigation.

### 12.7 Compliance and Auditability

- Enterprise version should support audit logs for login, analysis, case changes, rule changes, and integration changes.
- Exports should include generated time, analyst, evidence, and verdict.
- Retention and deletion policies should be configurable.

## 13. System Architecture

### 13.1 Current Architecture

Frontend:

- React single-page app.
- Vite build tooling.
- TailwindCSS styling.
- Client-side state for input, analysis result, report, theme, and file upload.
- Calls backend at `http://localhost:5000/api/analyze-email`.

Backend:

- Express server.
- CORS enabled.
- JSON and URL-encoded body parsing with 50 MB limit.
- Email parsing through `mailparser`.
- Attachment hashing through Node `crypto`.
- External HTTP calls through `axios`.
- Environment variables for API keys.

External services:

- VirusTotal.
- AbuseIPDB.
- DeepSeek.

### 13.2 Future Enterprise Architecture

Recommended components:

- Frontend web app.
- Backend API service.
- PostgreSQL database for users, organizations, cases, reports, settings, and audit logs.
- Redis for cache, rate limits, and job coordination.
- Queue worker for IOC enrichment, AI analysis, and report generation.
- Object storage for uploaded `.eml` files and generated reports, if retention is enabled.
- Secret manager for API keys and integration credentials.
- Observability stack for logs, metrics, traces, and alerts.

## 14. Data Model - Future

Recommended core entities:

- Organization
- User
- Role
- EmailSubmission
- AnalysisResult
- Indicator
- IndicatorEnrichment
- Attachment
- Report
- Case
- CaseComment
- Rule
- Integration
- AuditLog
- WebhookEvent

Important relationships:

- Organization has many users, analyses, cases, rules, and integrations.
- EmailSubmission has one or more AnalysisResult records.
- AnalysisResult has many indicators, enrichments, attachments, and reports.
- Case can link multiple analyses.
- AuditLog records important user and system actions.

## 15. API Requirements

### 15.1 Current APIs

`POST /api/analyze-email`

Purpose:

- Analyze email headers and body.

Input:

- `emailHeaders`
- `emailBody`

Output:

- Verdict
- Attack type
- Key findings
- Recommended actions
- Analyst summary
- Score
- Risk factors
- Auth checks
- Header details
- Indicators
- IOC enrichment
- Attachments
- Analysis source

`POST /api/check-virustotal`

Purpose:

- Manually check one indicator through VirusTotal.

Input:

- `indicator`
- `type`

`POST /api/check-abuseipdb`

Purpose:

- Manually check one IP through AbuseIPDB.

Input:

- `ipAddress`

### 15.2 Future APIs

Recommended additions:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me`
- `GET /api/analyses`
- `GET /api/analyses/:id`
- `POST /api/analyses`
- `POST /api/submissions`
- `GET /api/cases`
- `POST /api/cases`
- `PATCH /api/cases/:id`
- `POST /api/cases/:id/comments`
- `GET /api/indicators/:type/:value`
- `GET /api/reports/:id/export`
- `GET /api/admin/audit-logs`
- `GET /api/admin/integrations`
- `PATCH /api/admin/integrations/:id`
- `GET /api/admin/rules`
- `POST /api/admin/rules`
- `PATCH /api/admin/rules/:id`

## 16. UX Requirements

### 16.1 Current UX

- Main screen should act as the analysis workspace.
- User should see email intake, risk summary, authentication checks, header breakdown, IOC board, attachments, and formal report.
- Analysis progress should be visible.
- Reset should clear current analysis.
- Theme toggle should persist user preference.
- Report buttons should be disabled until analysis exists.

### 16.2 Future UX

- Add dashboard landing view after login.
- Add analysis history with filters.
- Add case detail view.
- Add admin settings views.
- Add integration setup views.
- Add employee submission flow with minimal technical language.
- Add analyst evidence view for raw headers and normalized JSON.
- Add severity and SLA indicators.

## 17. Metrics and Success Criteria

### 17.1 Product Metrics

- Number of emails analyzed per day.
- Percentage of analyses marked high risk.
- Average analysis completion time.
- Number of reports exported.
- Number of copied reports.
- Number of employee submissions.
- Analyst time saved per investigation.
- False positive and false negative feedback rate.

### 17.2 Technical Metrics

- Backend error rate.
- Third-party API failure rate.
- Average latency by integration.
- Queue processing time.
- Cache hit rate for IOC lookups.
- PDF export success rate.
- Frontend analysis failure rate.

### 17.3 Company-Level Success Targets

- Reduce manual suspicious email triage time by at least 60 percent.
- Produce readable reports in under 2 minutes for common cases.
- Support team-level analysis history and case tracking.
- Maintain clear evidence traceability for every verdict.
- Provide integration-ready outputs for security operations.

## 18. Roadmap

### Phase 1: MVP Stabilization

Objective:

- Make the current single-user product reliable, polished, and demo-ready.

Key work:

- Add request validation.
- Add backend tests for parsing, IOC extraction, scoring, and API fallbacks.
- Improve error states in the frontend.
- Add loading and partial-result states.
- Improve README setup instructions and API key guidance.
- Add sample `.eml` files for testing.
- Fix text typos in UI and README.
- Add environment example file.

### Phase 2: Persistent Analysis History

Objective:

- Move from temporary browser state to stored investigations.

Key work:

- Add database.
- Store analysis records.
- Add analysis list and detail page.
- Add search and filtering.
- Add report download from saved analysis.
- Add deletion and retention controls.

### Phase 3: Team and Organization Features

Objective:

- Make the product usable by a small company security team.

Key work:

- Add user accounts.
- Add organization workspaces.
- Add role-based permissions.
- Add audit logs.
- Add shared case management.
- Add comments and assignment.

### Phase 4: Enterprise Integrations

Objective:

- Connect Mail Defender to existing security workflows.

Key work:

- Add Microsoft 365 and Google Workspace submission flows.
- Add Slack or Teams notifications.
- Add Jira or ServiceNow ticket creation.
- Add SIEM webhooks.
- Add admin integration settings.

### Phase 5: Advanced Detection and Automation

Objective:

- Improve detection depth and automate response support.

Key work:

- Add URL redirect analysis.
- Add domain age and lookalike detection.
- Add sandbox integration for attachments.
- Add configurable rule engine.
- Add allowlist and blocklist management.
- Add analyst feedback loop.

### Phase 6: Enterprise Readiness

Objective:

- Prepare for larger customers, compliance, and managed service use.

Key work:

- Add SSO.
- Add multi-tenant MSP mode.
- Add data residency and retention settings.
- Add admin dashboard.
- Add compliance exports.
- Add usage analytics.
- Add security hardening and penetration testing.

## 19. Risks and Mitigations

Risk: Third-party API rate limits may slow or block analysis.  
Mitigation: Add caching, queue-based lookup, partial results, and provider-level rate limit handling.

Risk: AI may produce incorrect or overconfident summaries.  
Mitigation: Ground AI prompts in structured evidence, show evidence separately, and label AI output clearly.

Risk: Raw email content may contain sensitive personal or company data.  
Mitigation: Add privacy controls, redaction, retention settings, and clear admin configuration.

Risk: Single backend process may not scale for enterprise workloads.  
Mitigation: Move enrichment to background workers and add persistent storage.

Risk: False positives may reduce trust.  
Mitigation: Add analyst feedback, rule tuning, known-safe lists, and transparent scoring reasons.

Risk: False negatives may create security exposure.  
Mitigation: Add more threat feeds, sandboxing, URL analysis, and continuous rule updates.

## 20. Open Questions

- Should Mail Defender store raw email bodies by default, or only derived analysis results?
- Should AI processing be optional per organization?
- Which enterprise email provider should be integrated first: Microsoft 365 or Google Workspace?
- Should employee submissions be anonymous or tied to user identity?
- What is the desired retention period for analyses and reports?
- Should the product prioritize SOC analyst workflows or employee self-service first?
- Which deployment model is preferred: hosted SaaS, self-hosted, or both?

## 21. Acceptance Criteria for Company-Level Version

Mail Defender can be considered company-ready when:

- Users can authenticate securely.
- Organizations can isolate their data.
- Analysts can save, search, assign, and close investigations.
- Admins can manage integrations, rules, retention, and users.
- Reports are stored and exportable.
- All major actions are audited.
- External API failures are handled gracefully.
- Sensitive data handling is configurable.
- The system supports common email investigation workflows without requiring manual copy-paste between many tools.

## 22. Recommended Next Implementation Priorities

Priority 1:

- Add `.env.example`.
- Add backend validation.
- Add unit tests for parser, IOC extraction, and scoring.
- Fix README encoding and UI typo issues.

Priority 2:

- Add database persistence for analysis history.
- Add saved analysis detail page.
- Add search and filters.

Priority 3:

- Add authentication and organization workspace.
- Add case management.
- Add audit logs.

Priority 4:

- Add Microsoft 365 or Google Workspace submission integration.
- Add SIEM or ticketing webhook export.
- Add configurable rules.

Priority 5:

- Add enterprise dashboard, SSO, advanced threat feeds, sandboxing, and compliance controls.

