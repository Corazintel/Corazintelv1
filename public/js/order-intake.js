// Order Intake Wizard JavaScript
(function () {
    'use strict';

    // State
    let currentStep = 1;
    const totalSteps = 4;
    let formData = {};
    let uploadedFiles = [];
    let signaturePad = null;

    // DOM Elements
    const form = document.getElementById('intakeForm');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const progressFill = document.getElementById('progressFill');
    const serviceSelect = document.getElementById('service');
    const packageGroup = document.getElementById('packageGroup');
    const packageSelect = document.getElementById('package');
    const serviceQuestionsContainer = document.getElementById('serviceQuestions');

    // Initialize
    function init() {
        setupEventListeners();
        setupSignaturePad();
        loadDraft();
        updateProgress();
    }

    // Event Listeners
    function setupEventListeners() {
        prevBtn.addEventListener('click', prevStep);
        nextBtn.addEventListener('click', nextStep);
        form.addEventListener('submit', handleSubmit);
        serviceSelect.addEventListener('change', handleServiceChange);

        // Auto-save draft
        form.addEventListener('input', debounce(saveDraft, 1000));
    }

    // Initialize Signature Pad
    function setupSignaturePad() {
        const canvas = document.getElementById('signaturePad');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;

        function getCoordinates(e) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            if (e.touches) {
                return {
                    x: (e.touches[0].clientX - rect.left) * scaleX,
                    y: (e.touches[0].clientY - rect.top) * scaleY
                };
            }
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        }

        function startDrawing(e) {
            e.preventDefault();
            isDrawing = true;
            const coords = getCoordinates(e);
            lastX = coords.x;
            lastY = coords.y;
        }

        function draw(e) {
            if (!isDrawing) return;
            e.preventDefault();

            const coords = getCoordinates(e);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();

            lastX = coords.x;
            lastY = coords.y;
        }

        function stopDrawing() {
            isDrawing = false;
        }

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        canvas.addEventListener('touchstart', startDrawing);
        canvas.addEventListener('touchmove', draw);
        canvas.addEventListener('touchend', stopDrawing);

        document.getElementById('clearSignature').addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        signaturePad = { canvas, ctx };
    }

    // Service Change Handler
    function handleServiceChange(e) {
        const service = e.target.value;

        if (service) {
            packageGroup.style.display = 'block';
            loadPackagesForService(service);
            loadServiceQuestions(service);
        } else {
            packageGroup.style.display = 'none';
            serviceQuestionsContainer.innerHTML = '';
        }
    }

    // Load Packages (Stripe integration placeholder)
    function loadPackagesForService(service) {
        // TODO: Fetch from Stripe API
        const packages = getPackagesForService(service);

        packageSelect.innerHTML = '<option value="">Select a package...</option>';
        packages.forEach(pkg => {
            const option = document.createElement('option');
            option.value = pkg.id;
            option.textContent = pkg.name;
            option.dataset.price = pkg.price;
            packageSelect.appendChild(option);
        });

        packageSelect.addEventListener('change', (e) => {
            const selected = e.target.selectedOptions[0];
            const priceEl = document.querySelector('.package-price');
            if (selected && selected.dataset.price) {
                priceEl.textContent = `$${selected.dataset.price}`;
            } else {
                priceEl.textContent = '';
            }
        });
    }

    // Get Packages (placeholder data)
    function getPackagesForService(service) {
        const packagesMap = {
            tech: [
                { id: 'tech-basic', name: 'Basic Website', price: '500' },
                { id: 'tech-standard', name: 'Standard Website', price: '1500' },
                { id: 'tech-advanced', name: 'Advanced Web App', price: '3000' }
            ],
            documents: [
                { id: 'doc-resume', name: 'Resume Writing', price: '150' },
                { id: 'doc-cover', name: 'Cover Letter', price: '75' },
                { id: 'doc-bundle', name: 'Resume + Cover Letter', price: '200' }
            ],
            credit: [
                { id: 'credit-basic', name: 'Basic Credit Repair', price: '499' },
                { id: 'credit-advanced', name: 'Advanced Credit Repair', price: '899' }
            ],
            computer: [
                { id: 'comp-diagnostic', name: 'Diagnostic Only', price: '50' },
                { id: 'comp-repair', name: 'Repair Service', price: '150' },
                { id: 'comp-premium', name: 'Premium Service', price: '250' }
            ],
            wig: [
                { id: 'wig-install', name: 'Wig Installation', price: '100' },
                { id: 'wig-custom', name: 'Custom Wig', price: '500' }
            ],
            contouring: [
                { id: 'contour-single', name: 'Single Session', price: '200' },
                { id: 'contour-package', name: '5-Session Package', price: '850' }
            ],
            facials: [
                { id: 'facial-basic', name: 'Basic Facial', price: '75' },
                { id: 'facial-deluxe', name: 'Deluxe Facial', price: '150' }
            ]
        };

        return packagesMap[service] || [];
    }

    // Load Service-Specific Questions
    function loadServiceQuestions(service) {
        const questions = getQuestionsForService(service);
        serviceQuestionsContainer.innerHTML = questions;

        // Setup file uploads if any
        setupFileUploads();
    }

    // Get Questions HTML for Each Service
    function getQuestionsForService(service) {
        const questionsMap = {
            tech: getTechQuestions(),
            documents: getDocumentsQuestions(),
            credit: getCreditQuestions(),
            computer: getComputerQuestions(),
            wig: getWigQuestions(),
            contouring: getContouringQuestions(),
            facials: getFacialsQuestions()
        };

        return questionsMap[service] || '';
    }

    // Service Questions Templates
    function getTechQuestions() {
        return `
      <div class="form-group">
        <label for="techProjectType">Project Type *</label>
        <select id="techProjectType" name="techProjectType" required>
          <option value="">Select...</option>
          <option value="new-website">New Website</option>
          <option value="redesign">Website Redesign</option>
          <option value="web-app">Web Application</option>
          <option value="ecommerce">E-commerce Store</option>
          <option value="maintenance">Maintenance/Updates</option>
        </select>
        <span class="error-message">Please select project type</span>
      </div>

      <div class="form-group">
        <label for="techUrl">Existing Website URL (if applicable)</label>
        <input type="url" id="techUrl" name="techUrl" placeholder="https://example.com">
      </div>

      <div class="form-group">
        <label for="techAccess">Access Requirements</label>
        <textarea id="techAccess" name="techAccess" placeholder="List any accounts, credentials, or access you'll provide (hosting, domain, CMS, etc.)"></textarea>
      </div>

      <div class="form-group">
        <label for="techFeatures">Key Features Needed *</label>
        <textarea id="techFeatures" name="techFeatures" required placeholder="List the main features and functionality you need"></textarea>
        <span class="error-message">Please describe features needed</span>
      </div>

      <div class="form-group">
        <label for="techIntegrations">Third-Party Integrations</label>
        <textarea id="techIntegrations" name="techIntegrations" placeholder="Payment gateways, email services, APIs, etc."></textarea>
      </div>

      <div class="form-group">
        <label for="techSuccess">Success Criteria *</label>
        <textarea id="techSuccess" name="techSuccess" required placeholder="How will you measure if this project is successful?"></textarea>
        <span class="error-message">Please define success criteria</span>
      </div>

      <div class="form-group">
        <label for="techReviewRounds">Estimated Review Rounds *</label>
        <select id="techReviewRounds" name="techReviewRounds" required>
          <option value="1">1 round (quickest)</option>
          <option value="2" selected>2 rounds (standard)</option>
          <option value="3">3 rounds (detailed)</option>
        </select>
      </div>

      <div class="form-group">
        <label>Supporting Files</label>
        <div class="file-upload" data-name="techFiles">
          <div class="file-upload-icon">📁</div>
          <p>Drop files here or click to upload</p>
          <p style="font-size: 12px;">Design mockups, wireframes, brand assets, etc.</p>
          <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.sketch,.fig">
        </div>
        <div class="file-list" id="techFilesList"></div>
      </div>
    `;
    }

    function getDocumentsQuestions() {
        return `
      <div class="form-group">
        <label for="docType">Document Type *</label>
        <select id="docType" name="docType" required>
          <option value="">Select...</option>
          <option value="resume">Resume/CV</option>
          <option value="cover-letter">Cover Letter</option>
          <option value="business-plan">Business Plan</option>
          <option value="proposal">Proposal</option>
          <option value="report">Report</option>
          <option value="other">Other</option>
        </select>
        <span class="error-message">Please select document type</span>
      </div>

      <div class="form-group">
        <label for="docPurpose">Purpose/Goal *</label>
        <textarea id="docPurpose" name="docPurpose" required placeholder="What is this document for? What do you want to achieve?"></textarea>
        <span class="error-message">Please describe the purpose</span>
      </div>

      <div class="form-group">
        <label for="docAudience">Target Audience *</label>
        <input type="text" id="docAudience" name="docAudience" required placeholder="Who will read this document?">
        <span class="error-message">Please specify audience</span>
      </div>

      <div class="form-group">
        <label for="docFormat">Preferred Format *</label>
        <select id="docFormat" name="docFormat" required>
          <option value="word">Microsoft Word (.docx)</option>
          <option value="pdf">PDF</option>
          <option value="google">Google Docs</option>
          <option value="pages">Apple Pages</option>
        </select>
      </div>

      <div class="form-group">
        <label for="docMustInclude">Must-Include Points *</label>
        <textarea id="docMustInclude" name="docMustInclude" required placeholder="List key information that must be included"></textarea>
        <span class="error-message">Please specify required information</span>
      </div>

      <div class="form-group">
        <label>Upload Draft or Reference Materials</label>
        <div class="file-upload" data-name="docFiles">
          <div class="file-upload-icon">📄</div>
          <p>Drop files here or click to upload</p>
          <p style="font-size: 12px;">Current draft, examples, or reference materials</p>
          <input type="file" multiple accept=".pdf,.doc,.docx,.txt">
        </div>
        <div class="file-list" id="docFilesList"></div>
      </div>
    `;
    }

    function getCreditQuestions() {
        return `
      <div class="form-group">
        <label for="creditGoals">Primary Goals *</label>
        <textarea id="creditGoals" name="creditGoals" required placeholder="What are you trying to achieve? (e.g., buy a home, get a loan, improve score)"></textarea>
        <span class="error-message">Please describe your goals</span>
      </div>

      <div class="form-group">
        <label for="creditIssues">Known Issues *</label>
        <textarea id="creditIssues" name="creditIssues" required placeholder="List known negative items (late payments, collections, charge-offs, etc.)"></textarea>
        <span class="error-message">Please list issues</span>
      </div>

      <div class="form-group">
        <label>Affected Credit Bureaus *</label>
        <div class="checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" name="creditBureaus" value="equifax" required>
            <span>Equifax</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="creditBureaus" value="experian">
            <span>Experian</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="creditBureaus" value="transunion">
            <span>TransUnion</span>
          </label>
        </div>
        <span class="error-message">Select at least one bureau</span>
      </div>

      <div class="form-group">
        <label for="creditDisputes">Current Disputes</label>
        <textarea id="creditDisputes" name="creditDisputes" placeholder="List any ongoing disputes or previous repair attempts"></textarea>
      </div>

      <div class="form-group">
        <label>Upload Credit Reports</label>
        <div class="file-upload" data-name="creditFiles">
          <div class="file-upload-icon">📊</div>
          <p>Drop credit reports here or click to upload</p>
          <p style="font-size: 12px;">PDF format preferred</p>
          <input type="file" multiple accept=".pdf">
        </div>
        <div class="file-list" id="creditFilesList"></div>
      </div>

      <div class="form-group checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" name="creditAcknowledge" required>
          <span><strong>I understand</strong> that credit repair results are not guaranteed and vary by individual circumstances *</span>
        </label>
        <span class="error-message">Acknowledgement required</span>
      </div>
    `;
    }

    function getComputerQuestions() {
        return `
      <div class="form-group">
        <label for="compDeviceType">Device Type *</label>
        <select id="compDeviceType" name="compDeviceType" required>
          <option value="">Select...</option>
          <option value="desktop">Desktop PC</option>
          <option value="laptop">Laptop</option>
          <option value="mac">Mac</option>
          <option value="tablet">Tablet</option>
          <option value="phone">Smartphone</option>
        </select>
        <span class="error-message">Please select device type</span>
      </div>

      <div class="form-group">
        <label for="compBrandModel">Brand & Model *</label>
        <input type="text" id="compBrandModel" name="compBrandModel" required placeholder="e.g., Dell XPS 15, MacBook Pro 2020">
        <span class="error-message">Please specify brand and model</span>
      </div>

      <div class="form-group">
        <label for="compIssue">Issue Description *</label>
        <textarea id="compIssue" name="compIssue" required placeholder="Describe the problem in detail. When did it start? What were you doing?"></textarea>
        <span class="error-message">Please describe the issue</span>
      </div>

      <div class="form-group">
        <label for="compErrors">Error Messages</label>
        <textarea id="compErrors" name="compErrors" placeholder="Copy any error messages or codes you see"></textarea>
      </div>

      <div class="form-group">
        <label for="compDataImportance">Data Importance *</label>
        <select id="compDataImportance" name="compDataImportance" required>
          <option value="">Select...</option>
          <option value="critical">🔴 Critical - Must preserve all data</option>
          <option value="important">🟡 Important - Prefer to keep data</option>
          <option value="not-critical">🟢 Not Critical - Data can be lost if needed</option>
        </select>
        <span class="error-message">Please specify data importance</span>
      </div>

      <div class="form-group">
        <label>Upload Photos of Issue</label>
        <div class="file-upload" data-name="compFiles">
          <div class="file-upload-icon">📷</div>
          <p>Drop photos here or click to upload</p>
          <p style="font-size: 12px;">Photos of error screens, physical damage, etc.</p>
          <input type="file" multiple accept=".jpg,.jpeg,.png,.heic">
        </div>
        <div class="file-list" id="compFilesList"></div>
      </div>

      <div class="form-group checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" name="compDiagnostic" required>
          <span><strong>I understand</strong> a diagnostic fee may apply before determining if repair is possible *</span>
        </label>
        <span class="error-message">Acknowledgement required</span>
      </div>
    `;
    }

    function getWigQuestions() {
        return `
      <div class="form-group">
        <label for="wigServiceType">Service Needed *</label>
        <select id="wigServiceType" name="wigServiceType" required>
          <option value="">Select...</option>
          <option value="installation">Wig Installation</option>
          <option value="styling">Wig Styling</option>
          <option value="custom">Custom Wig Order</option>
          <option value="maintenance">Wig Maintenance</option>
        </select>
        <span class="error-message">Please select service</span>
      </div>

      <div class="form-group">
        <label for="wigType">Wig Type *</label>
        <select id="wigType" name="wigType" required>
          <option value="">Select...</option>
          <option value="lace-front">Lace Front</option>
          <option value="full-lace">Full Lace</option>
          <option value="360-lace">360 Lace</option>
          <option value="closure">Closure</option>
          <option value="frontal">Frontal</option>
        </select>
        <span class="error-message">Please select wig type</span>
      </div>

      <div class="form-group">
        <label for="wigTexture">Texture & Length *</label>
        <input type="text" id="wigTexture" name="wigTexture" required placeholder="e.g., Straight 18 inches, Curly 14 inches">
        <span class="error-message">Please specify texture and length</span>
      </div>

      <div class="form-group">
        <label for="wigColor">Color Preference *</label>
        <input type="text" id="wigColor" name="wigColor" required placeholder="e.g., Natural Black, #1B, Highlighted">
        <span class="error-message">Please specify color</span>
      </div>

      <div class="form-group">
        <label for="wigSensitivities">Scalp Sensitivities or Allergies</label>
        <textarea id="wigSensitivities" name="wigSensitivities" placeholder="Any sensitivities to adhesives, products, or materials?"></textarea>
      </div>

      <div class="form-group">
        <label>Upload Reference Photos</label>
        <div class="file-upload" data-name="wigFiles">
          <div class="file-upload-icon">📸</div>
          <p>Drop photos here or click to upload</p>
          <p style="font-size: 12px;">Photos of desired style or your current wig</p>
          <input type="file" multiple accept=".jpg,.jpeg,.png,.heic">
        </div>
        <div class="file-list" id="wigFilesList"></div>
      </div>

      <div class="form-group">
        <label for="wigAppointment">Preferred Appointment Time</label>
        <input type="datetime-local" id="wigAppointment" name="wigAppointment">
      </div>
    `;
    }

    function getContouringQuestions() {
        return `
      <div class="form-group">
        <label for="contourAreas">Target Areas *</label>
        <textarea id="contourAreas" name="contourAreas" required placeholder="List areas you want to target (e.g., abdomen, thighs, arms)"></textarea>
        <span class="error-message">Please specify areas</span>
      </div>

      <div class="form-group">
        <label for="contourSessions">Interested in Sessions *</label>
        <select id="contourSessions" name="contourSessions" required>
          <option value="">Select...</option>
          <option value="single">Single Session (trial)</option>
          <option value="package-5">5-Session Package (recommended)</option>
          <option value="package-10">10-Session Package (best results)</option>
        </select>
        <span class="error-message">Please select package</span>
      </div>

      <div class="form-group">
        <label>Contraindications Check *</label>
        <p style="font-size: 13px; color: var(--text-light); margin-bottom: 12px;">
          Please confirm you do NOT have any of the following:
        </p>
        <div class="checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" name="contourNoPregnant" required>
            <span>Not pregnant or nursing</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="contourNoPacemaker" required>
            <span>No pacemaker or metal implants in treatment area</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="contourNoSkinConditions" required>
            <span>No active skin infections or conditions in treatment area</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="contourNoRecent Surgery" required>
            <span>No recent surgery in treatment area (within 6 months)</span>
          </label>
        </div>
        <span class="error-message">All confirmations required</span>
      </div>

      <div class="form-group checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" name="contourAftercare" required>
          <span><strong>I understand</strong> I must follow aftercare instructions for best results *</span>
        </label>
        <span class="error-message">Acknowledgement required</span>
      </div>
    `;
    }

    function getFacialsQuestions() {
        return `
      <div class="form-group">
        <label for="facialSkinType">Skin Type *</label>
        <select id="facialSkinType" name="facialSkinType" required>
          <option value="">Select...</option>
          <option value="normal">Normal</option>
          <option value="dry">Dry</option>
          <option value="oily">Oily</option>
          <option value="combination">Combination</option>
          <option value="sensitive">Sensitive</option>
        </select>
        <span class="error-message">Please select skin type</span>
      </div>

      <div class="form-group">
        <label for="facialConcerns">Primary Skin Concerns *</label>
        <textarea id="facialConcerns" name="facialConcerns" required placeholder="e.g., acne, aging, hyperpigmentation, dryness"></textarea>
        <span class="error-message">Please describe concerns</span>
      </div>

      <div class="form-group">
        <label for="facialAllergies">Known Allergies</label>
        <textarea id="facialAllergies" name="facialAllergies" placeholder="Any allergies to skincare products or ingredients?"></textarea>
      </div>

      <div class="form-group">
        <label for="facialIngredients">Active Ingredients in Current Routine</label>
        <textarea id="facialIngredients" name="facialIngredients" placeholder="e.g., retinol, vitamin C, acids"></textarea>
      </div>

      <div class="form-group">
        <label for="facialRecentTreatments">Recent Treatments</label>
        <textarea id="facialRecentTreatments" name="facialRecentTreatments" placeholder="Any recent facials, peels, laser treatments, etc. (within 3 months)"></textarea>
      </div>

      <div class="form-group checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" name="facialAftercare" required>
          <span><strong>I understand</strong> I must avoid sun exposure and follow aftercare for 48 hours post-treatment *</span>
        </label>
        <span class="error-message">Acknowledgement required</span>
      </div>
    `;
    }

    // Continue in next part...

    window.OrderIntakeWizard = {
        init,
        currentStep,
        formData,
        uploadedFiles
    };

})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => OrderIntakeWizard.init());
} else {
    OrderIntakeWizard.init();
}
