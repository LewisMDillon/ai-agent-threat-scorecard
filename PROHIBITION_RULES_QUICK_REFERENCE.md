# Prohibition Rules Quick Reference

## Rule Evaluation Order & Triggers

```
calculateTotalScore()
  │
  ├─→ Rule P1: sensitiveData >= 2 AND internet >= 1 AND untrusted >= 1
  │   └─→ TRIGGER? → { score: 20, prohibitedRule: 'P1' } ✗
  │
  ├─→ Rule P2: sensitiveData == 3 AND internet >= 2
  │   └─→ TRIGGER? → { score: 20, prohibitedRule: 'P2' } ✗
  │
  ├─→ Rule P3: tools == 4 AND untrusted > 0
  │   └─→ TRIGGER? → { score: 20, prohibitedRule: 'P3' } ✗
  │
  ├─→ Rule P4: tools == 4 AND internet >= 1 AND untrusted >= 1
  │   └─→ TRIGGER? → { score: 20, prohibitedRule: 'P4' } ✗
  │
  └─→ No Rule Triggered?
      └─→ Compute weighted score
          └─→ { score: <0-20>, prohibitedRule: null } ✓
```

---

## Rule Detail Table

| Rule | Trigger Condition | Meaning | Display |
|------|-------------------|---------|---------|
| **P1** | `S ≥ 2` ∧ `I ≥ 1` ∧ `U ≥ 1` | Sensitive Data + External Comms + Untrusted Input | Lethal Trifecta |
| **P2** | `S = 3` ∧ `I ≥ 2` | Broad Sensitive Data + Moderate/Unrestricted External | Broad Data + External |
| **P3** | `T = 4` ∧ `U > 0` | Admin Tools + Any Untrusted Input | Admin + Untrusted |
| **P4** | `T = 4` ∧ `I ≥ 1` ∧ `U ≥ 1` | Admin Tools + External + Untrusted | Privileged Trifecta |

**Legend:**  
- `S` = Sensitive Data Access (0–3)
- `I` = Internet / External Communication (0–3)
- `U` = Untrusted Input Processing (0–2)
- `T` = High-Risk Tool Access (0–4)

---

## Category Levels Reference

### Sensitive Data Access (0–3)
```
0 = No access (ephemeral request context only)
1 = Limited non-sensitive (operational, public data)
2 = Sensitive, controlled (personal, business data with scoped access)
3 = Highly sensitive, broad (regulated, confidential, multi-system access)
  → Level 3 is "dangerous" for P1 and P2 rules
```

### Internet / External Communication (0–3)
```
0 = No external access
1 = Restricted / allow-listed (approved endpoints only)
2 = Monitored external (logging, gateway, rate-limiting)
3 = Unrestricted (any endpoint, no controls)
  → Level ≥ 1 triggers P1; Level ≥ 2 triggers P2
```

### Untrusted Input Processing (0–2)
```
0 = Trusted / structured only (validated schemas, internal APIs)
1 = Semi-trusted (external content, but sanitized/filtered)
2 = Raw external (unvalidated user input, emails, documents, web content)
  → Level ≥ 1 triggers P1, P3, P4
```

### High-Risk Tool Access (0–4)
```
0 = No tool access (advisory only)
1 = Low-risk tools (read-only, calculators, search APIs)
2 = Limited operational (internal APIs, constrained actions)
3 = Privileged operational (production data modifications, deployments)
4 = Administrative / root (shell, database admin, IAM, privilege-granting)
  → Level 4 triggers P3 and P4
```

### Automated Actions / Autonomy (0–4)
```
0 = No autonomy (human execution required)
1 = Assisted (simple actions, direct prompts only)
2 = Conditional (predefined workflows, with checkpoints)
3 = High autonomy with oversight (multi-step, with monitoring/limits)
4 = Full autonomy (chained actions, sub-agents, no human intervention)
  → Does NOT directly trigger any rule; mainly a risk multiplier
```

---

## Flowchart: User Configuration → UI Message

```
User adjusts sliders
  │
  ├─→ calculateTotalScore()
  │   │
  │   ├─→ Read slider values (S, I, U, T, A)
  │   │
  │   ├─→ Evaluate P1, P2, P3, P4 in order
  │   │   └─→ First match? Return { score: 20, prohibitedRule: 'P<#>' }
  │   │
  │   └─→ No match? Compute weighted score, return { score: X, prohibitedRule: null }
  │
  ├─→ updateScores()
  │   │
  │   ├─→ Extract result.score and result.prohibitedRule
  │   │
  │   ├─→ Get risk tier from score
  │   │
  │   ├─→ IS prohibitedRule != null?
  │   │   ├─→ YES → Display: "Deployment Prohibited: <Rule description>"
  │   │   └─→ NO  → Display: Standard risk tier message (Low/Medium/High)
  │   │
  │   └─→ Update UI (badge, progress bar, timestamp)
  │
  └─→ User sees outcome
```

---

## Decision Tree: Which Rule Fires?

```
Does S >= 2 AND I >= 1 AND U >= 1?
├─ YES → P1 triggers (Lethal Trifecta)
└─ NO  → Does S == 3 AND I >= 2?
         ├─ YES → P2 triggers (Broad Data + External)
         └─ NO  → Does T == 4 AND U > 0?
                  ├─ YES → P3 triggers (Admin + Untrusted)
                  └─ NO  → Does T == 4 AND I >= 1 AND U >= 1?
                           ├─ YES → P4 triggers (Privileged Trifecta)
                           └─ NO  → NO PROHIBITION (compute score normally)
```

---

## UI Message Examples

### P1 Triggered
```
Deployment Prohibited: Rule P1 (Lethal Trifecta): Agent has access to sensitive 
data, can communicate externally, and is exposed to untrusted content. This 
combination structurally enables data exfiltration.
```

### P2 Triggered
```
Deployment Prohibited: Rule P2 (Broad Data Access + External Comms): Agent has 
access to highly sensitive data and broad external communication capability. 
Residual data-loss risk is unacceptable.
```

### P3 Triggered
```
Deployment Prohibited: Rule P3 (Admin Tools + Untrusted Input): Agent has 
administrative/root-level tool access and processes untrusted content. Direct 
path to destructive action exists.
```

### P4 Triggered
```
Deployment Prohibited: Rule P4 (Privileged Tools + External + Untrusted): Agent 
combines privileged tooling, external communication, and untrusted input exposure. 
Matches data exfiltration or integrity attack patterns.
```

### No Prohibition (Low)
```
Low Risk (0-5): No approval required. Standard security practices sufficient.
```

### No Prohibition (Medium)
```
Medium Risk (6-10): Approval required. Implement security controls and monitoring.
```

### No Prohibition (High)
```
High Risk (11-15): Approval required. Comprehensive security review needed before 
deployment.
```

---

## Scoring Formula (When No Rule Triggers)

$$\text{Total Score} = \frac{S}{3} \times 5 + \frac{T}{4} \times 5 + \frac{I}{3} \times 4 + \frac{U}{2} \times 4 + \frac{A}{4} \times 2$$

**Where:**
- $S$ = Sensitive Data Access (0–3)
- $T$ = High-Risk Tool Access (0–4)
- $I$ = Internet / External Communication (0–3)
- $U$ = Untrusted Input Processing (0–2)
- $A$ = Automated Actions / Autonomy (0–4)

**Result:** Score from 0 to 20

---

## Risk Tier Mapping

| Score Range | Tier | Approval Required | Message |
|-------------|------|-------------------|---------|
| 0–5 | Low | ✗ No | Standard practices sufficient |
| 6–10 | Medium | ✓ Yes | Implement controls and monitoring |
| 11–15 | High | ✓ Yes | Comprehensive security review |
| 16–20 | Prohibited | ✗ Hard Stop | Non-negotiable (rule-based) |

---

## Quick Test Scenarios

### Scenario 1: Trigger P1
```
S = 2, I = 1, U = 1, T = 0, A = 0
→ P1 fires → Score: 20 → Message: "Lethal Trifecta"
```

### Scenario 2: Trigger P2
```
S = 3, I = 2, U = 0, T = 0, A = 0
→ P2 fires → Score: 20 → Message: "Broad Data + External"
```

### Scenario 3: Trigger P3
```
S = 0, I = 0, U = 1, T = 4, A = 0
→ P3 fires → Score: 20 → Message: "Admin + Untrusted"
```

### Scenario 4: Trigger P4
```
S = 0, I = 1, U = 1, T = 4, A = 0
→ P4 fires → Score: 20 → Message: "Privileged Trifecta"
```

### Scenario 5: Safe Configuration
```
S = 1, I = 0, U = 0, T = 2, A = 1
→ No rule fires
→ Score = (1/3)×5 + (2/4)×5 + (0/3)×4 + (0/2)×4 + (1/4)×2 = 1.67 + 2.5 + 0 + 0 + 0.5 = 4.67
→ Tier: Low → Message: "No approval required"
```

---

## Key Takeaways

1. **First Match Wins** — Rules are evaluated in order (P1 → P2 → P3 → P4). The first rule that matches is the one displayed.
2. **Non-Approvable** — Prohibition rules are hard stops. There is no "approval path" to override them.
3. **Actionable Feedback** — Each rule tells the user *why* they are blocked and *what combinations* to avoid.
4. **Transparent Design** — Users understand the logic, building confidence in the scorecard's fairness.
