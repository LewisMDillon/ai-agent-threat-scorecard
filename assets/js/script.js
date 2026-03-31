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
            low: 'Medium Risk (6-10): Approval needed by engineering team. Security controls and monitoring are required.',
            medium: 'High Risk (11-15): Approval needed by engineering team. Comprehensive security review needed before deployment.',
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

    showMessage(title, message, level = 'info') {
        // Prefer Bootstrap modal when available; fall back to alert()
        const modalEl = document.getElementById('messageModal');
        if (!modalEl || typeof bootstrap === 'undefined') {
            alert(`${title}\n\n${message}`);
            return;
        }

        const titleEl = modalEl.querySelector('.modal-title');
        const bodyEl = modalEl.querySelector('.modal-body');
        const headerEl = modalEl.querySelector('.modal-header');

        if (titleEl) titleEl.textContent = title;
        if (bodyEl) bodyEl.textContent = message;

        // Normalize header classes
        headerEl.classList.remove('bg-success', 'bg-danger', 'bg-info', 'text-light');
        if (level === 'success') {
            headerEl.classList.add('bg-success', 'text-light');
        } else if (level === 'danger') {
            headerEl.classList.add('bg-danger', 'text-light');
        } else {
            headerEl.classList.add('bg-info', 'text-light');
        }

        const modal = new bootstrap.Modal(modalEl);
        modal.show();
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
        // New elements for snapshot feature
    this.projectNameInput = document.getElementById('projectName');
    this.userNameInput = document.getElementById('userName');
    this.saveSnapshotBtn = document.getElementById('saveSnapshotBtn');
    this.snapshotTimestampEl = document.getElementById('snapshotTimestamp');
    this.loadSnapshotBtn = document.getElementById('loadSnapshotBtn');
    this.loadSnapshotFileInput = document.getElementById('loadSnapshotFile');
    // Format choice modal elements
    this.snapshotFormatModalEl = document.getElementById('snapshotFormatModal');
    this.snapshotChoiceMd = document.getElementById('snapshotChoiceMd');
    this.snapshotChoicePdf = document.getElementById('snapshotChoicePdf');
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

        // Form reset - ensure sliders, fills and UI are fully reset
        this.form.addEventListener('reset', () => {
            // run after the browser's native reset so values are consistent
            setTimeout(() => {
                document.querySelectorAll('.category-slider').forEach(slider => {
                    // ensure explicit reset to 0
                    slider.value = 0;
                    // dispatch input so onSliderChange runs and updates description/score
                    const evt = new Event('input', { bubbles: true });
                    slider.dispatchEvent(evt);
                    // also paint the fill explicitly as a fallback
                    this.paintSliderFill(slider, 0);
                });
                // remove any saved assessment
                localStorage.removeItem('threatAssessment');
                // refresh aggregated UI
                this.updateScores();
            }, 0);
        });

        // Action buttons
        // Save Snapshot: show format choice modal
        if (this.saveSnapshotBtn && this.snapshotFormatModalEl) {
            this.saveSnapshotBtn.addEventListener('click', () => {
                const modal = bootstrap.Modal.getOrCreateInstance(this.snapshotFormatModalEl);
                modal.show();
            });
        }

        // Format choice: Markdown
        if (this.snapshotChoiceMd) {
            this.snapshotChoiceMd.addEventListener('click', () => {
                // hide the format modal first
                const modal = bootstrap.Modal.getInstance(this.snapshotFormatModalEl);
                if (modal) modal.hide();
                this.saveSnapshot();
            });
        }

        // Format choice: PDF
        if (this.snapshotChoicePdf) {
            this.snapshotChoicePdf.addEventListener('click', () => {
                const modal = bootstrap.Modal.getInstance(this.snapshotFormatModalEl);
                if (modal) modal.hide();
                try { this.updateScores(); } catch (err) { console.warn('Failed to refresh scores before print', err); }
                this.populatePrintElements();
                // Small delay to let the modal fully close before triggering print
                setTimeout(() => window.print(), 300);
            });
        }

        if (this.loadSnapshotBtn && this.loadSnapshotFileInput) {
            this.loadSnapshotBtn.addEventListener('click', () => this.loadSnapshotFileInput.click());
            this.loadSnapshotFileInput.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        this.loadSnapshotFromMd(String(ev.target.result || ''));
                    } catch (err) {
                        console.error('Failed to load snapshot file', err);
                        this.showMessage('Load failed', 'Failed to parse snapshot file. See console for details.', 'danger');
                    } finally {
                        // clear input so same file can be reselected later if needed
                        this.loadSnapshotFileInput.value = '';
                    }
                };
                reader.readAsText(file);
            });
        }
        // top header reset button removed; bottom form reset handles full reset behavior
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
        if (sensitiveData >= 2 && internet >= 1 && untrusted >= 1) {
            return { score: 20, prohibitedRule: 'P1' };
        }

        // Rule P2 — Broad Sensitive Data + Moderate or Higher External Communication
        if (sensitiveData === 3 && internet >= 2) {
            return { score: 20, prohibitedRule: 'P2' };
        }

        // Rule P3 — Admin / Root Tooling + Untrusted Content
        if (tools === 4 && untrusted > 0) {
            return { score: 20, prohibitedRule: 'P3' };
        }

        // Rule P4 — Privileged Tooling + External Communication + Untrusted Content
        if (tools === 4 && internet >= 1 && untrusted >= 1) {
            return { score: 20, prohibitedRule: 'P4' };
        }

        // If no hard-stop rule fired, compute weighted normalized score out of 20
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

        // Update snapshot timestamp to now (the time the assessment was last updated)
        try {
            const now = new Date();
            const formatted = now.toLocaleString();
            if (this.snapshotTimestampEl) {
                this.snapshotTimestampEl.textContent = formatted;
            }
            // keep as a property for saving snapshots
            this._lastSnapshotTime = now.toISOString();
        } catch (err) {
            // ignore formatting errors
        }

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

    saveSnapshot() {
        // Build snapshot metadata and content
        try {
            // Read raw inputs (may be empty)
            const projectInputVal = (this.projectNameInput && this.projectNameInput.value.trim()) || '';
            const userInputVal = (this.userNameInput && this.userNameInput.value.trim()) || '';
            // Use human-friendly display defaults in the generated markdown, but don't persist those placeholders
            const projectDisplay = projectInputVal || 'Unnamed Project';
            const userDisplay = userInputVal || 'Unknown';
            const timestampISO = this._lastSnapshotTime || new Date().toISOString();
            const timestampDisplay = new Date(timestampISO).toLocaleString();

            const result = this.calculateTotalScore();
            const totalScore = Number(result.score);
            const prohibitedRule = result.prohibitedRule;
            const tier = this.getRiskTier(totalScore);

            // Collect category scores and descriptions
            const categoryLines = [];
            const scoresObj = {};
            for (let i = 0; i < 5; i++) {
                const category = this.categories[i];
                const slider = document.getElementById(`slider-${category.id}`);
                const value = slider ? parseInt(slider.value) : 0;
                scoresObj[category.id] = value;
                const desc = (category.descriptions && category.descriptions[value]) ? category.descriptions[value] : '';
                // Include only the human-friendly category name (no internal id) in the snapshot
                categoryLines.push(`- ${category.name}: ${value}/${category.maxScore}\n  - ${desc}`);
            }

            // Build Markdown snapshot
            const mdParts = [];
            mdParts.push(`# Threat Assessment Snapshot`);
            mdParts.push(``);
            mdParts.push(`- Project: ${projectDisplay}`);
            mdParts.push(`- Completed by: ${userDisplay}`);
            // Use only the human-readable timestamp in the markdown snapshot
            mdParts.push(`- Timestamp: ${timestampDisplay}`);
            mdParts.push(`- Total score: ${isFinite(totalScore) ? totalScore : 0}/20`);
            mdParts.push(`- Risk tier: ${tier ? tier.label : 'Unknown'}`);
            if (prohibitedRule) {
                mdParts.push(`- Prohibition: ${prohibitedRule} - ${this.prohibitionRuleDescriptions[prohibitedRule]}`);
            }
            mdParts.push(``);
            mdParts.push(`## Risk message`);
            mdParts.push(``);
            mdParts.push(this.riskMessage ? this.riskMessage.textContent : '');
            mdParts.push(``);
            mdParts.push(`## Category scores`);
            mdParts.push(...categoryLines);
            mdParts.push(``);
            mdParts.push(`---`);
            mdParts.push(`Generated by AI Agent Threat Modelling Scorecard`);

            const content = mdParts.join('\n');

            // Trigger download
            const blob = new Blob([content], { type: 'text/markdown' });
            const safeProject = (projectInputVal || 'project').replace(/[^a-z0-9-_]/gi, '_').slice(0, 40) || 'project';
            const now = new Date(timestampISO);
            const stamp = now.toISOString().replace(/[:.]/g, '-');
            const filename = `threat-snapshot-${safeProject}-${stamp}.md`;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);

            // Save a copy in localStorage for quick reload
            const snapshotObj = {
                // Persist null when inputs were left empty so load doesn't prefill placeholders
                project: projectInputVal || null,
                user: userInputVal || null,
                timestamp: timestampISO,
                totalScore: isFinite(totalScore) ? totalScore : 0,
                tier: tier ? tier.label : null,
                riskMessage: this.riskMessage ? this.riskMessage.textContent : '',
                scores: scoresObj
            };
            localStorage.setItem('threatAssessmentSnapshot', JSON.stringify(snapshotObj));
            this.showMessage('Snapshot downloaded', "Snapshot downloaded. Please add the file to your project's documentation folder.", 'success');
        } catch (err) {
            console.error('Failed to save snapshot', err);
            this.showMessage('Snapshot save failed', 'Failed to save snapshot. See console for details.', 'danger');
        }
    }

    loadSnapshotFromMd(md) {
        if (!md || typeof md !== 'string') throw new Error('Invalid content');

        // Helper to extract single-line fields
        const extract = (re) => {
            const m = md.match(re);
            return m ? m[1].trim() : null;
        };

        const project = extract(/^- Project:\s*(.*)$/m) || '';
        const user = extract(/^- Completed by:\s*(.*)$/m) || '';
        const timestampDisplay = extract(/^- Timestamp:\s*(.*)$/m) || '';
        const totalLine = extract(/^- Total score:\s*(.*)$/m) || '';
        const tierLine = extract(/^- Risk tier:\s*(.*)$/m) || '';

        // Risk message block
        let riskMessage = '';
        const rm = md.match(/## Risk message\s*([\s\S]*?)\n## Category scores/);
        if (rm && rm[1]) riskMessage = rm[1].trim();

        // Parse category scores (lines like: - Internet Access: 1/3)
        const catIndex = md.indexOf('## Category scores');
        const categoryLines = catIndex >= 0 ? md.slice(catIndex).split(/\r?\n/) : [];

        const scores = {};
        for (let i = 0; i < categoryLines.length; i++) {
            const line = categoryLines[i].trim();
            const m = line.match(/^-\s*(.+?):\s*(\d+)\/(\d+)/);
            if (m) {
                const name = m[1].trim();
                const val = parseInt(m[2], 10);
                // map category name back to id
                const cat = this.categories.find(c => c.name === name);
                if (cat) {
                    scores[cat.id] = val;
                } else {
                    // not found - try a case-insensitive match
                    const cat2 = this.categories.find(c => c.name.toLowerCase() === name.toLowerCase());
                    if (cat2) scores[cat2.id] = val;
                    else console.warn('Unknown category name in snapshot:', name);
                }
            }
        }

        // Apply parsed values to the UI
        // Set inputs
        if (this.projectNameInput) this.projectNameInput.value = project || '';
        if (this.userNameInput) this.userNameInput.value = user || '';

        // Set sliders
        Object.entries(scores).forEach(([categoryId, value]) => {
            const slider = document.getElementById(`slider-${categoryId}`);
            if (slider) {
                slider.value = value;
                const evt = new Event('input', { bubbles: true });
                slider.dispatchEvent(evt);
                // ensure number label updated
                const scoreEl = document.getElementById(`score-${categoryId}`);
                if (scoreEl) scoreEl.textContent = value;
                const category = this.categories.find(c => c.id === categoryId);
                if (category) {
                    const categoryItem = document.querySelector(`[data-category-id="${categoryId}"]`);
                    if (categoryItem) {
                        const descEl = categoryItem.querySelector('.category-description');
                        if (descEl && category.descriptions && category.descriptions[value]) {
                            descEl.textContent = category.descriptions[value];
                        }
                    }
                }
                const percentage = (value / (slider.max || 1)) * 100;
                this.paintSliderFill(slider, percentage);
            }
        });

        // Update timestamp display and internal last snapshot time
        try {
            if (this.snapshotTimestampEl) this.snapshotTimestampEl.textContent = timestampDisplay || new Date().toLocaleString();
            // Attempt to parse the human-friendly timestamp into ISO; fallback to now
            const parsed = Date.parse(timestampDisplay);
            this._lastSnapshotTime = isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
        } catch (err) {
            this._lastSnapshotTime = new Date().toISOString();
        }

        // Persist parsed snapshot to localStorage for quick reload
        const snapshotObj = {
            project: project || null,
            user: user || null,
            timestamp: this._lastSnapshotTime,
            totalScore: totalLine ? Number(totalLine.replace(/[^0-9.-]+/g, '')) : null,
            tier: tierLine || null,
            riskMessage: riskMessage || '',
            scores: scores
        };
        localStorage.setItem('threatAssessmentSnapshot', JSON.stringify(snapshotObj));
        // Also save raw per-category assessment
        localStorage.setItem('threatAssessment', JSON.stringify(scores));

        // Refresh aggregate UI
        this.updateScores();

        // After updateScores overwrites timestamp, reapply the loaded timestamp display
        if (this.snapshotTimestampEl) this.snapshotTimestampEl.textContent = timestampDisplay || new Date().toLocaleString();

        this.showMessage('Snapshot loaded', 'Snapshot file loaded and applied.', 'success');
    }

    /**
     * Populate the hidden print-only DOM elements with current assessment data.
     * Called immediately before window.print() so the PDF contains fresh values.
     */
    populatePrintElements() {
        // Metadata
        const projectVal = (this.projectNameInput && this.projectNameInput.value.trim()) || 'Unnamed Project';
        const userVal = (this.userNameInput && this.userNameInput.value.trim()) || 'Unknown';
        const timestampVal = this.snapshotTimestampEl ? this.snapshotTimestampEl.textContent : new Date().toLocaleString();

        const printProject = document.getElementById('printProject');
        const printUser = document.getElementById('printUser');
        const printTimestamp = document.getElementById('printTimestamp');
        if (printProject) printProject.textContent = projectVal;
        if (printUser) printUser.textContent = userVal;
        if (printTimestamp) printTimestamp.textContent = timestampVal;

        // Score summary
        const result = this.calculateTotalScore();
        const totalScore = Number(result.score) || 0;
        const tier = this.getRiskTier(totalScore);

        const printTotalScore = document.getElementById('printTotalScore');
        const printRiskTier = document.getElementById('printRiskTier');
        const printRiskMessage = document.getElementById('printRiskMessage');
        if (printTotalScore) printTotalScore.textContent = totalScore;
        if (printRiskTier) printRiskTier.textContent = tier ? tier.label.toUpperCase() : 'UNKNOWN';
        if (printRiskMessage) {
            printRiskMessage.textContent = this.riskMessage ? this.riskMessage.textContent : '';
        }
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

        // If a snapshot object exists, prefill project/user and timestamp display
        const snap = localStorage.getItem('threatAssessmentSnapshot');
        if (snap) {
            try {
                const obj = JSON.parse(snap);
                // Do not prefill project/user inputs from localStorage on load.
                // Keep these inputs empty so placeholders are shown after a hard refresh.
                if (this.snapshotTimestampEl && obj.timestamp) {
                    this.snapshotTimestampEl.textContent = new Date(obj.timestamp).toLocaleString();
                    this._lastSnapshotTime = obj.timestamp;
                }
            } catch (err) {
                // ignore parse errors
            }
        }
    }
}

// Initialize the scorecard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const scorecard = new ThreatModelScorecard();
    scorecard.loadAssessment();
});
