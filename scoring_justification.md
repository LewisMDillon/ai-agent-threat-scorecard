# AI Agent Threat Modelling Scorecard

## Purpose

This scorecard is designed to assess whether an AI agent is safe to deploy based on the capabilities that most directly affect **data exfiltration, privilege abuse, unsafe tool use, and uncontrolled propagation of harm**. The structure follows OWASP's framing that agentic systems are risky not only because of model behavior, but because they can **plan, decide, and act across multiple steps and systems**, often using tools, memory, connected data, and external communication channels.[^owasp-letter][^owasp-at-a-glance]

The scorecard uses two layers:

1. **Hard-stop prohibited rules** for capability combinations that are structurally unsafe.
2. **Weighted scoring out of 20** for configurations that are not automatically prohibited.

This split is intentional. OWASP's guidance does not treat every capability as merely additive; several attack patterns recur as dangerous combinations, especially where untrusted content can steer an agent that has access to sensitive data and a way to send it out.[^asi01-desc][^asi01-scenarios][^asi02-scenarios]

---

## Design Principles

### 1. Least Agency, not just Least Privilege

OWASP explicitly extends the usual least-privilege idea with **Least Agency**, warning that unnecessary autonomy expands the attack surface and can turn minor issues into system-wide failures.[^owasp-least-agency]

**Decision:** autonomy is included in the score, but it is not the highest-weighted category.

**Justification:** OWASP presents autonomy mainly as a **risk amplifier**. The more direct roots of severe incidents are prompt injection, unsafe tool use, privilege abuse, memory poisoning, and insecure communication.[^owasp-least-agency][^asi08-toc]

### 2. Treat all natural-language and external content as untrusted

OWASP ASI01 states that agents cannot reliably distinguish instructions from related content and says all natural-language inputs and connected content sources should be treated as untrusted before they can influence goals, planning, or tool calls.[^asi01-desc][^asi01-mitigations]

**Decision:** untrusted input is a first-class scoring category and part of the hard prohibition logic.

**Justification:** OWASP does not treat raw external content as a minor hygiene issue. It presents it as a principal route into goal hijack, unsafe tool use, and data exfiltration.[^asi01-desc][^asi01-scenarios]

### 3. External communication matters because it creates the exfiltration path

OWASP ASI02 explicitly recommends **egress controls**, outbound allowlists, and denying non-approved network destinations. It also recommends monitoring for suspicious tool chains such as **DB read followed by external transfer**.[^asi02-mitigations]

**Decision:** external communication / internet access remains a high-weight category and is part of the hard-stop rules.

**Justification:** access to sensitive data is serious, but access plus egress is what turns it into a practical exfiltration path.[^asi02-scenarios][^asi02-mitigations]

### 4. Privilege and tool access must be scored separately from data access

OWASP distinguishes between misuse of legitimate tools, identity and privilege abuse, and arbitrary or injected code execution. Those are related but not identical failure modes.[^asi02-desc][^asi03-desc]

**Decision:** keep both **Sensitive Data Access** and **High-Risk Tool Access** as separate heavily weighted categories.

**Justification:** one measures what can be stolen; the other measures what can be changed, executed, or escalated.[^asi02-desc][^asi03-desc]

---

## Automatic Prohibited Configurations

If any rule below is met, the agent is **Prohibited regardless of numeric score**.

### Rule P1 — Lethal Trifecta: Private Data + External Communication + Untrusted Content

**Prohibited if all three are true:**

- the agent has access to private or sensitive data,
- the agent can communicate externally or reach external endpoints,
- the agent is exposed to untrusted content.

**Justification:** this rule is strongly supported by OWASP's attack patterns. ASI01 includes hidden instructions in web pages, documents, emails, and other external content that steer agents into leaking private data or misusing tools.[^asi01-examples][^asi01-scenarios] ASI02 includes examples where agents chain internal tools with external tools to exfiltrate sensitive data.[^asi02-scenarios] Appendix D also references **"The Trifecta"** Gemini private data exfiltration incident family.[^appendix-trifecta]

This combination should be blocked outright because it combines:

- a source of attacker control,
- a target worth stealing,
- and a route to send the stolen material out.

### Rule P2 — Broad Sensitive Data + Moderate or Higher External Communication

**Prohibited if:**

- Sensitive Data Access is at the highest level,
- and External Communication is moderate or unrestricted.

**Justification:** OWASP repeatedly recommends least privilege, per-tool scoping, and strict outbound control. If the agent has broad access to highly sensitive data and can communicate externally beyond tightly controlled paths, the residual data-loss risk remains too high even before considering prompt injection.[^asi02-mitigations][^asi03-examples]

### Rule P3 — Admin / Root Tooling + Untrusted Content

**Prohibited if:**

- High-Risk Tool Access is at the highest level,
- and Untrusted Input Processing is above the safest level.

**Justification:** OWASP ASI02 warns against unvalidated input forwarding into shells and databases, and ASI02 example scenarios include a PDF that causes the agent to invoke a local shell tool.[^asi02-examples][^asi02-scenarios] Once raw or partially trusted attacker-controlled content can influence admin-grade tooling, the path to destructive action is too direct.

### Rule P4 — Privileged Tooling + External Communication + Untrusted Content

**Prohibited if all three are true:**

- high-risk privileged tools,
- external communication,
- untrusted content.

**Justification:** OWASP ASI02 includes examples of chaining legitimate administrative tools with network-capable tools to exfiltrate sensitive logs, and even apparently low-risk tools like `ping` being abused for DNS exfiltration.[^asi02-scenarios] This creates the same exploit shape as the data-exfiltration trifecta, except with potentially stronger integrity and availability impact.

---

## Weighted Risk Scoring (only if no prohibition rule is triggered)

For agents that are not automatically prohibited, calculate a weighted score out of **20**.

| Category | Max Contribution | Rationale |
|---|---:|---|
| Sensitive Data Access | **5** | Drives breach severity and regulatory impact |
| High-Risk Tool Access | **5** | Enables destructive actions, privilege abuse, and code execution |
| Internet / External Communication | **4** | Provides the exfiltration and command path |
| Untrusted Input Processing | **4** | Primary route for prompt injection, goal hijack, and unsafe tool steering |
| Automated Actions / Autonomy | **2** | Multiplies speed and blast radius but is rarely the root cause alone |

Total = **20**

### Weighting Justifications

#### Sensitive Data Access — 5/20

OWASP repeatedly uses scenarios where the core harm is exposure of confidential emails, files, chat logs, CRM records, or other private data. ASI01's example attacks explicitly describe exfiltration of confidential data through prompt injection, and ASI03 shows how inherited or cached privileges can lead to exfiltration of HR and legal data.[^asi01-scenarios][^asi03-scenarios]

**Decision:** highest weight.

**Justification:** if the agent cannot reach meaningful private data, the organization has removed the most severe confidentiality outcomes.

#### High-Risk Tool Access — 5/20

ASI02 covers over-privileged tools, unsafe shell/database forwarding, and tool chaining. ASI03 covers inherited credentials and privilege abuse. Together they show that privileged tools can cause destructive actions, policy bypass, and direct system compromise.[^asi02-examples][^asi02-scenarios][^asi03-desc]

**Decision:** equal highest weight with sensitive data.

**Justification:** even where confidential data exposure is limited, privileged tools can still create serious integrity and availability impact.

#### Internet / External Communication — 4/20

OWASP explicitly recommends outbound allowlists and denying non-approved destinations, which signals that egress is a central control surface in the agentic threat model.[^asi02-mitigations]

**Decision:** high but not highest weight.

**Justification:** external communication is the pathway, not usually the crown jewel itself.

#### Untrusted Input Processing — 4/20

ASI01 says agents cannot reliably distinguish instructions from related content and recommends treating user text, uploaded documents, retrieved content, emails, calendar invites, external APIs, browsing output, and peer-agent messages as untrusted.[^asi01-desc][^asi01-mitigations]

**Decision:** same weight as external communication.

**Justification:** untrusted content is the most common entry point for hijack. Without it, many of OWASP's documented attack paths become substantially harder.

#### Automated Actions / Autonomy — 2/20

OWASP's introductory guidance on Least Agency says unnecessary autonomy expands the attack surface and can turn minor issues into system-wide failures.[^owasp-least-agency]

**Decision:** lowest weighted category.

**Justification:** autonomy mainly changes **speed, scale, and blast radius**. OWASP's concrete exploit examples more often begin with untrusted input, excessive privilege, unsafe tools, or insecure communications.

---

## Score Formula

Use the normalized formula below only when no prohibited rule has fired.

```text
Total Score =
  (SensitiveData / 3) * 5 +
  (HighRiskTools / 4) * 5 +
  (InternetAccess / 3) * 4 +
  (UntrustedInput / 2) * 4 +
  (Autonomy / 4) * 2
```

**Justification:** the categories have different internal scales, so normalization is necessary to preserve comparability while still reflecting the relative priority implied by the OWASP guidance.[^owasp-letter]

---

## Risk Levels and Governance Thresholds

| Score | Risk Level | Governance Outcome |
|---|---|---|
| **0-5** | Low | No approval required |
| **6-10** | Medium | Approval required |
| **11-15** | High | Approval required |
| **16-20** | Critical | Prohibited |

**Override:** any hard-stop prohibited rule means **Prohibited regardless of score**.

**Justification:** OWASP repeatedly recommends human approval for high-impact, destructive, privileged, or goal-changing actions, which supports approval gates below the outright prohibited zone.[^asi01-mitigations][^asi02-mitigations][^asi03-mitigations]

---

## Category Definitions

### Sensitive Data Access (0-3, weighted to max 5)

| Level | Description |
|---|---|
| 0 | No access to internal or user data beyond ephemeral request context |
| 1 | Access limited to non-sensitive internal information or curated operational data |
| 2 | Access to sensitive business or user data, but limited by role, scope, or task |
| 3 | Access to highly sensitive, regulated, or broadly queryable private data |

**Justification:** OWASP highlights confidential emails, files, chat logs, CRM data, and inherited/cached private data as material risks, and recommends least-privilege scoping and segmented contexts.[^asi01-scenarios][^asi03-examples][^asi03-mitigations]

### High-Risk Tool Access (0-4, weighted to max 5)

| Level | Description |
|---|---|
| 0 | No tool execution capability |
| 1 | Read-only or otherwise low-risk utilities |
| 2 | Limited operational tools in constrained systems |
| 3 | Production-impacting tools or workflows |
| 4 | Administrative, shell, database-admin, IAM, permission-granting, or equivalent privileged control |

**Justification:** OWASP explicitly warns about over-privileged tools, shell forwarding, tool chaining, unsafe deletes/transfers, and destructive agent actions enabled by excessive permissions.[^asi02-examples][^asi02-mitigations]

### Internet / External Communication (0-3, weighted to max 4)

| Level | Description |
|---|---|
| 0 | No external communication capability |
| 1 | Communication restricted to approved endpoints or controlled gateways |
| 2 | External communication allowed but routed through logging, review, or egress controls |
| 3 | Communication with arbitrary external destinations |

**Justification:** this scale directly reflects OWASP's recommendation to enforce outbound allowlists and deny non-approved destinations.[^asi02-mitigations]

### Untrusted Input Processing (0-2, weighted to max 4)

| Level | Description |
|---|---|
| 0 | Only structured, validated, and trusted inputs are processed |
| 1 | External or free-form content is allowed, but sanitized, filtered, validated, or gated before use |
| 2 | Raw external content can directly influence goals, planning, memory, or tool use |

**Justification:** OWASP ASI01 says all natural-language inputs and connected content sources should be treated as untrusted and sanitized before influencing agent behavior.[^asi01-mitigations]

### Automated Actions / Autonomy (0-4, weighted to max 2)

| Level | Description |
|---|---|
| 0 | Advisory only; no action without human execution |
| 1 | Narrow single-step actions only on direct instruction |
| 2 | Bounded predefined workflows with checkpoints |
| 3 | Multi-step autonomy with policy and monitoring guardrails |
| 4 | Full autonomy across chained actions or delegated workflows without human intervention |

**Justification:** this scale reflects OWASP's least-agency stance while still acknowledging that autonomy is mainly a multiplier rather than the root cause of most severe incidents.[^owasp-least-agency]

---

## Why the Lethal Trifecta is a Hard Prohibition

The **Lethal Trifecta** is not just a heuristic; it matches the structure of OWASP's recurring exploit narratives:

- **Untrusted content** gives the attacker a way to steer the agent.[^asi01-desc]
- **Private-data access** gives the attacker something valuable to steal.[^asi01-scenarios][^asi03-scenarios]
- **External communication** gives the attacker a way to get the data out.[^asi02-scenarios][^asi02-mitigations]

When those three are present at the same time, the exploit chain is straightforward and directly represented in the OWASP examples. That is why it should be **non-approvable**.

---

## Operational Controls Required for Medium and High Risk Agents

For any agent scoring above Low, or any agent close to a prohibited boundary, require the following controls:

- per-tool least-privilege profiles,
- human confirmation for high-impact or destructive actions,
- outbound allowlists and egress controls,
- policy enforcement / intent validation before execution,
- short-lived scoped credentials,
- immutable logging and anomaly detection,
- segmented memory and per-session isolation,
- content sanitization for all external and natural-language inputs.

**Justification:** these controls are directly aligned with OWASP mitigations in ASI01, ASI02, and ASI03.[^asi01-mitigations][^asi02-mitigations][^asi03-mitigations]

---

## Final Recommendation

The recommended governance flow is:

1. **Evaluate hard-stop prohibited rules first.**
2. **If none fire, compute the weighted score out of 20.**
3. **Require approval for Medium and High risk agents.**
4. **Treat any prohibited combination as non-deployable.**

This is more faithful to the OWASP agentic security model than a pure weighted scheme, because the document repeatedly describes some combinations as structurally unsafe rather than merely incrementally riskier.[^asi01-desc][^asi02-desc][^asi03-desc]

---

## References

[^owasp-letter]: OWASP Top 10 for Agentic Applications 2026, Letter from the leaders and framing of agentic systems, pp. 6-7. See uploaded PDF: `OWASP-Top-10-for-Agentic-Applications-2026-12.6-1.pdf`. Source excerpt available at fileciteturn11file0.
[^owasp-at-a-glance]: OWASP Top 10 for Agentic Applications 2026, “Agentic Top 10 At A Glance,” p. 8. Source excerpt available at fileciteturn11file0.
[^owasp-least-agency]: OWASP Top 10 for Agentic Applications 2026, statement that agents amplify existing vulnerabilities and recommendation for “Least-Agency,” p. 7. Source excerpt available at fileciteturn11file0.
[^asi01-desc]: OWASP Top 10 for Agentic Applications 2026, ASI01 description, p. 9. Source excerpt available at fileciteturn11file0.
[^asi01-examples]: OWASP Top 10 for Agentic Applications 2026, ASI01 common examples, p. 9. Source excerpt available at fileciteturn11file0.
[^asi01-scenarios]: OWASP Top 10 for Agentic Applications 2026, ASI01 example attack scenarios, p. 10. Source excerpt available at fileciteturn11file0.
[^asi01-mitigations]: OWASP Top 10 for Agentic Applications 2026, ASI01 prevention and mitigation guidelines, pp. 10-11. Source excerpt available at fileciteturn11file0.
[^asi02-desc]: OWASP Top 10 for Agentic Applications 2026, ASI02 description, p. 12. Source excerpt available at fileciteturn11file1.
[^asi02-examples]: OWASP Top 10 for Agentic Applications 2026, ASI02 common examples, p. 12. Source excerpt available at fileciteturn11file1.
[^asi02-scenarios]: OWASP Top 10 for Agentic Applications 2026, ASI02 example attack scenarios, p. 13. Source excerpt available at fileciteturn11file1.
[^asi02-mitigations]: OWASP Top 10 for Agentic Applications 2026, ASI02 prevention and mitigation guidelines, pp. 13-14. Source excerpt available at fileciteturn11file1.
[^asi03-desc]: OWASP Top 10 for Agentic Applications 2026, ASI03 description, p. 15. Source excerpt available at fileciteturn11file1.
[^asi03-examples]: OWASP Top 10 for Agentic Applications 2026, ASI03 common examples, pp. 15-16. Source excerpt available at fileciteturn11file1.
[^asi03-scenarios]: OWASP Top 10 for Agentic Applications 2026, ASI03 example attack scenarios, p. 16. Source excerpt available at fileciteturn11file1.
[^asi03-mitigations]: OWASP Top 10 for Agentic Applications 2026, ASI03 prevention and mitigation guidelines, p. 17. Source excerpt available at fileciteturn11file1.
[^asi08-toc]: OWASP Top 10 for Agentic Applications 2026, ASI08 listing in the table of contents and top-10 map, pp. 4-5 and 8. Source excerpt available at fileciteturn11file0.
[^appendix-trifecta]: OWASP Top 10 for Agentic Applications 2026, Appendix D incident tracker reference to “The Trifecta: How Three New Gemini Vulnerabilities ... Allowed Private Data Exfiltration,” p. 27 in the source excerpt / Appendix D reference listing. Source excerpt available at fileciteturn10file9.
