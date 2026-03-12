// AI Agent Threat Modelling Scorecard - OpenClaw Style
class ThreatModelScorecard {
    constructor() {
        // Define categories with level-specific descriptions and weightings
        this.categories = [
            {
                id: 'internetAccess',
                name: 'Internet Access',
                maxScore: 3,
                weightedMaxContribution: 4,  // Max contribution to final score
                descriptions: [
                    'None: The agent has no internet access. It cannot make outbound network requests and can only interact with local resources or predefined internal APIs.',
                    'Restricted / Allow-Listed: The agent can access a limited set of predefined internet endpoints through an allow-list or controlled API gateway. All requests are constrained to specific domains or services.',
                    'Monitored External Access: The agent can access external internet endpoints but requests are routed through a monitored proxy, logging system, or security gateway. Requests may be rate-limited or inspected for policy violations.',
                    'Unrestricted: The agent can make outbound requests to any internet endpoint without restriction, logging, or proxy. Full open internet access.'
                ]
            },
            {
                id: 'sensitiveDataAccess',
                name: 'Sensitive Data Access',
                maxScore: 3,
                weightedMaxContribution: 5,  // Max contribution to final score (per scoring_justification.md)
                descriptions: [
                    'None: The agent does not access any data stores or user data. It operates only on ephemeral inputs provided in the request context.',
                    'Limited Non-Sensitive Data: The agent can access internal data sources that contain operational or non-sensitive information (e.g., documentation, product catalogs, public datasets) but no personal, financial, or regulated data.',
                    'Sensitive Data (Controlled): The agent can access sensitive internal or user data such as personal information, customer records, or internal business data, but access is limited by role-based permissions, scoped queries, or auditing controls.',
                    'Highly Sensitive / Broad Access: The agent has access to highly sensitive or regulated data such as financial records, credentials, health data, or confidential corporate information, potentially across multiple systems or tenants.'
                ]
            },
            {
                id: 'highRiskToolAccess',
                name: 'High-Risk Tool Access',
                maxScore: 4,
                weightedMaxContribution: 5,  // Max contribution to final score
                descriptions: [
                    'No Tool Access: The agent cannot execute tools or external system actions. It can only generate responses or recommendations.',
                    'Low-Risk Tools: The agent can use low-risk tools such as calculators, search APIs, or read-only utilities that do not modify systems or data.',
                    'Limited System Interaction: The agent can interact with internal services or APIs that modify data or trigger actions but only within tightly scoped permissions and non-critical environments.',
                    'Privileged Operational Tools: The agent can perform impactful system operations such as modifying production data, triggering deployments, managing workflows, or interacting with internal infrastructure.',
                    'Unrestricted Tool Access: The agent has access to administrative or root-level tools including shell access, database admin, IAM management, or the ability to grant permissions to other agents.'
                ]
            },
            {
                id: 'untrustedInputProcessing',
                name: 'Untrusted Input Processing',
                maxScore: 2,
                weightedMaxContribution: 4,  // Max contribution to final score (per scoring_justification.md)
                descriptions: [
                    'Trusted / Structured Input Only: The agent only processes structured or validated inputs from trusted systems (e.g., fixed schemas, internal APIs, sanitized data pipelines).',
                    'Semi-Trusted External Input: The agent processes external inputs that may contain free-form content but are subject to validation, sanitization, filtering, or schema constraints before processing.',
                    'Raw External: The agent processes raw, unvalidated external input such as free-text user prompts, email contents, uploaded files, or scraped web content.'
                ]
            },
            {
                id: 'automatedActions',
                name: 'Automated Actions / Autonomy',
                maxScore: 4,
                weightedMaxContribution: 2,  // Max contribution to final score (per scoring_justification.md)
                descriptions: [
                    'No Autonomy: The agent only provides recommendations or analysis. All actions must be explicitly initiated and executed by a human operator.',
                    'Assisted Automation: The agent can perform simple automated actions but only in response to direct human prompts and with limited scope.',
                    'Conditional Automation: The agent can execute predefined workflows automatically under specific conditions, but key actions require approval or checkpoints.',
                    'High Automation with Oversight: The agent can perform multi-step workflows and system interactions autonomously but operates within guardrails such as monitoring, rate limits, or human override mechanisms.',
                    'Full Autonomy: The agent operates with full autonomy including the ability to spawn sub-agents, chain actions across systems, and execute multi-step workflows without human intervention.'
                ]
            },
            {
                id: 'baseScore',
                name: 'Weighted Score',
                maxScore: 20,
                description: 'Calculated as the weighted sum of all component scores (out of 20).',
                isCalculated: true
            }
        ];

        this.riskTiers = [
            { min: 0, max: 5, label: 'Low', class: 'minimal' },
            { min: 6, max: 10, label: 'Medium', class: 'low' },
            { min: 11, max: 15, label: 'High', class: 'medium' },
            { min: 16, max: 20, label: 'Prohibited', class: 'critical' }
        ];

        this.riskMessages = {
            minimal: 'Low Risk (0-5): No approval required. Standard security practices are sufficient.',
            low: 'Medium Risk (6-10): Approval needed. Security controls and monitoring are required.',
            medium: 'High Risk (11-15): Approval needed. Comprehensive security review needed before deployment.',
            critical: 'Prohibited (16-20): Not allowed. Redesign required.'
        };

        // Prohibition rule descriptions (for transparency per ASI09)
        this.prohibitionRuleDescriptions = {
            'P1': 'Rule P1 (Lethal Trifecta): Agent has access to sensitive data, can communicate externally, and is exposed to untrusted content. This combination structurally enables data exfiltration.',
            'P2': 'Rule P2 (Broad Data Access + External Comms): Agent has access to highly sensitive data and broad external communication capability. Unacceptable residual data-loss risk.',
            'P3': 'Rule P3 (Admin Tools + Untrusted Input): Agent has administrative/root-level tool access and processes untrusted content. Direct path to destructive action exists & matches data exfiltration or integrity attack patterns',
            'P4': 'Rule P4 (Privileged Tools + External + Untrusted): Agent combines privileged tooling, external communication, and untrusted input exposure. Matches data exfiltration or integrity attack patterns.'
        };

        this.init();
    }

    init() {
        this.cacheElements();
        this.renderCategories();
        this.attachEventListeners();
        this.updateScores();
    }

    cacheElements() {
        this.form = document.getElementById('assessmentForm');
        this.categoriesContainer = document.getElementById('categoriesContainer');
        this.totalScoreElement = document.getElementById('totalScore');
        this.tierBadge = document.getElementById('tierBadge');
        this.progressBarFill = document.getElementById('progressBarFill');
        this.maxScoreLabel = document.getElementById('maxScoreLabel');
        this.riskMessage = document.getElementById('riskMessage');
        this.resetBtn = document.getElementById('resetBtn');
        this.saveBtn = document.getElementById('saveBtn');
    }

    renderCategories() {
        let html = '';
        
        this.categories.forEach(category => {
            if (!category.isCalculated) {
                // Editable categories with sliders
                const initialDescription = category.descriptions[0];
                html += `
                    <div class="card category-item" data-category-id="${category.id}">
                        <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h3 class="category-name mb-0">${category.name}</h3>
                                <div class="category-score"><span id="score-${category.id}">0</span>/<span class="max-score">${category.maxScore}</span></div>
                            </div>
                            <p class="category-description mb-2">${initialDescription}</p>
                            <div class="category-input-group">
                                <input type="range" 
                                       id="slider-${category.id}" 
                                       class="form-range category-slider" 
                                       min="0" 
                                       max="${category.maxScore}" 
                                       value="0"
                                       aria-label="${category.name} level"
                                       data-category-id="${category.id}">
                                <!-- Slider fill is painted directly on the range input; no extra progress bar -->
                            </div>
                        </div>
                    </div>
                `;
            }
        });
        
        this.categoriesContainer.innerHTML = html;
    }

    attachEventListeners() {
        // Slider change listeners
        document.querySelectorAll('.category-slider').forEach(slider => {
            // Initialize visual fill for each slider
            this.paintSliderFill(slider, (parseInt(slider.value) / parseInt(slider.max)) * 100);
            slider.addEventListener('input', (e) => this.onSliderChange(e));
        });

        // Form reset
        this.form.addEventListener('reset', () => {
            setTimeout(() => this.updateScores(), 0);
        });

        // Action buttons
        this.saveBtn.addEventListener('click', () => this.saveAssessment());
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => {
                // Explicitly reset each slider to 0 and trigger an input event so all listeners run
                document.querySelectorAll('.category-slider').forEach(slider => {
                    slider.value = 0;
                    // dispatch input event so onSliderChange updates UI and score consistently
                    const evt = new Event('input', { bubbles: true });
                    slider.dispatchEvent(evt);
                    // also ensure the painted fill is reset (in case listeners didn't run yet)
                    this.paintSliderFill(slider, 0);
                });
                // Also reset any stored assessment
                localStorage.removeItem('threatAssessment');
                this.updateScores();
            });
        }
    }

    onSliderChange(event) {
        const categoryId = event.target.dataset.categoryId;
        const value = parseInt(event.target.value);
        
        // Update score display
        document.getElementById(`score-${categoryId}`).textContent = value;
        
        // Update progress bar
        const category = this.categories.find(c => c.id === categoryId);
        const percentage = (value / category.maxScore) * 100;
        // Paint the left-side fill directly on the range input
        const slider = document.getElementById(`slider-${categoryId}`);
        this.paintSliderFill(slider, percentage);
        
        // Update description based on selected level
        const categoryItem = document.querySelector(`[data-category-id="${categoryId}"]`);
        const descriptionElement = categoryItem.querySelector('.category-description');
        if (category.descriptions && category.descriptions[value]) {
            descriptionElement.textContent = category.descriptions[value];
        }
        
        this.updateScores();
    }

    paintSliderFill(slider, percentage) {
        if (!slider) return;
        // Read CSS variables for colors
        const rootStyle = getComputedStyle(document.documentElement);
        const fill = rootStyle.getPropertyValue('--range-fill').trim() || '#6d28d9';
        const empty = rootStyle.getPropertyValue('--range-empty').trim() || 'rgba(255,255,255,0.04)';
        // Compose gradient that fills left side with fill color and remainder with empty track
        slider.style.background = `linear-gradient(to right, ${fill} 0%, ${fill} ${percentage}%, ${empty} ${percentage}%, ${empty} 100%)`;
    }

    calculateTotalScore() {
        // Evaluate hard-stop prohibited rules first (per scoring_justification.md P1-P4)
        const sSlider = document.getElementById('slider-sensitiveDataAccess');
        const tSlider = document.getElementById('slider-highRiskToolAccess');
        const iSlider = document.getElementById('slider-internetAccess');
        const uSlider = document.getElementById('slider-untrustedInputProcessing');
        const aSlider = document.getElementById('slider-automatedActions');

        const sensitiveData = sSlider ? parseInt(sSlider.value) : 0;
        const tools = tSlider ? parseInt(tSlider.value) : 0;
        const internet = iSlider ? parseInt(iSlider.value) : 0;
        const untrusted = uSlider ? parseInt(uSlider.value) : 0;
        const autonomy = aSlider ? parseInt(aSlider.value) : 0;

        // Rule P1 — Lethal Trifecta: Private Data + External Communication + Untrusted Content
        // Prohibited if: sensitiveData >= 2 (sensitive/private) AND internet >= 1 (has external comms) AND untrusted >= 1
        if (sensitiveData >= 2 && internet >= 1 && untrusted >= 1) {
            return { score: 20, prohibitedRule: 'P1' };
        }

        // Rule P2 — Broad Sensitive Data + Moderate or Higher External Communication
        // Prohibited if: sensitiveData == 3 (highest) AND internet >= 2 (moderate or unrestricted)
        if (sensitiveData === 3 && internet >= 2) {
            return { score: 20, prohibitedRule: 'P2' };
        }

        // Rule P3 — Admin / Root Tooling + Untrusted Content
        // Prohibited if: tools == 4 (highest privileged) AND untrusted > 0
        if (tools === 4 && untrusted > 0) {
            return { score: 20, prohibitedRule: 'P3' };
        }

        // Rule P4 — Privileged Tooling + External Communication + Untrusted Content
        // Prohibited if: tools == 4 AND internet >= 1 AND untrusted >= 1
        // This one is redundant as it's covered by P3
        if (tools === 4 && internet >= 1 && untrusted >= 1) {
            return { score: 20, prohibitedRule: 'P4' };
        }

        // If no hard-stop rule fired, compute weighted normalized score out of 20
        // Using normalized contributions (per scoring_justification.md):
        // (SensitiveData / 3) * 5 + (HighRiskTools / 4) * 5 + (InternetAccess / 3) * 4 + (UntrustedInput / 2) * 4 + (Autonomy / 4) * 2
        let weightedScore = 0;
        for (let i = 0; i < 5; i++) {
            const category = this.categories[i];
            const slider = document.getElementById(`slider-${category.id}`);
            if (slider) {
                const rawScore = parseInt(slider.value);
                const contribution = (rawScore / category.maxScore) * category.weightedMaxContribution;
                weightedScore += contribution;
            }
        }

    // Return object with score rounded to the nearest whole number and no prohibition rule
    return { score: Math.round(weightedScore), prohibitedRule: null };
    }

    getRiskTier(score) {
        return this.riskTiers.find(tier => score >= tier.min && score <= tier.max);
    }

    updateScores() {
        const result = this.calculateTotalScore();
        // Coerce score to a safe number (fallback to 0) to avoid NaN causing full-width fills
        let totalScore = Number(result.score);
        if (!isFinite(totalScore)) totalScore = 0;
        const prohibitedRule = result.prohibitedRule;
        const riskTier = this.getRiskTier(totalScore);

        // Update total score display
        this.totalScoreElement.textContent = totalScore;

    // Update weighted score display (base score) if elements exist
    const baseScoreEl = document.getElementById('score-baseScore');
    const baseProgressEl = document.getElementById('progress-baseScore');
    const baseCategory = this.categories.find(c => c.id === 'baseScore');
    const basePercentage = baseCategory ? (totalScore / baseCategory.maxScore) * 100 : 0;
    if (baseScoreEl) baseScoreEl.textContent = totalScore;
    if (baseProgressEl) baseProgressEl.style.width = basePercentage + '%';

        // Update risk tier badge
        this.tierBadge.textContent = riskTier.label.toUpperCase();
        this.tierBadge.className = `tier-badge ${riskTier.class}`;

        // Update progress bar (now 0-20)
        // ensure progress bar fill receives a valid numeric width
        const pbWidth = isFinite(basePercentage) ? Math.min(basePercentage, 100) : 0;
        this.progressBarFill.style.width = pbWidth + '%';

        // Update risk message with prohibition rule details if applicable
        if (prohibitedRule) {
            const ruleDescription = this.prohibitionRuleDescriptions[prohibitedRule];
            this.riskMessage.textContent = `Deployment Prohibited: ${ruleDescription}`;
        } else {
            this.riskMessage.textContent = this.riskMessages[riskTier.class];
        }

        // Update max score label
        this.maxScoreLabel.textContent = '20';
    }

    saveAssessment() {
        const scores = {};
        for (let i = 0; i < 5; i++) {
            const categoryId = this.categories[i].id;
            const slider = document.getElementById(`slider-${categoryId}`);
            scores[categoryId] = parseInt(slider.value);
        }

        // Save to localStorage
        localStorage.setItem('threatAssessment', JSON.stringify(scores));
        alert('Assessment saved successfully!');
    }

    editAssessment() {
        // This would enable editing mode
        // For now, it's already in edit mode when user adjusts sliders
        alert('Edit mode - adjust the sliders and click Save Assessment');
    }

    deleteAssessment() {
        if (confirm('Are you sure you want to delete this assessment?')) {
            // Reset all sliders
            this.form.reset();
            localStorage.removeItem('threatAssessment');
            this.updateScores();
            alert('Assessment deleted');
        }
    }

    loadAssessment() {
        const saved = localStorage.getItem('threatAssessment');
        if (saved) {
            const scores = JSON.parse(saved);
            for (const [categoryId, value] of Object.entries(scores)) {
                const slider = document.getElementById(`slider-${categoryId}`);
                if (slider) {
                    slider.value = value;
                    document.getElementById(`score-${categoryId}`).textContent = value;
                    
                    // Update description to match the loaded value
                    const category = this.categories.find(c => c.id === categoryId);
                    const categoryItem = document.querySelector(`[data-category-id="${categoryId}"]`);
                    const descriptionElement = categoryItem.querySelector('.category-description');
                    if (category.descriptions && category.descriptions[value]) {
                        descriptionElement.textContent = category.descriptions[value];
                    }
                    
                    const percentage = (value / category.maxScore) * 100;
                    // Paint the slider fill to reflect loaded value
                    this.paintSliderFill(slider, percentage);
                }
            }
            this.updateScores();
        }
    }
}

// Initialize the scorecard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const scorecard = new ThreatModelScorecard();
    scorecard.loadAssessment();
});
