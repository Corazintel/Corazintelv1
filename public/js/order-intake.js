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
    if (prevBtn) prevBtn.addEventListener('click', prevStep);
    if (nextBtn) nextBtn.addEventListener('click', nextStep);
    if (form) form.addEventListener('submit', handleSubmit);
    if (serviceSelect) serviceSelect.addEventListener('change', handleServiceChange);

    // Auto-save draft
    if (form) form.addEventListener('input', debounce(saveDraft, 1000));
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

    const clearBtn = document.getElementById('clearSignature');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
    }

    signaturePad = { canvas, ctx };
  }

  // Service Change Handler
  function handleServiceChange(e) {
    const service = e.target.value;

    if (service) {
      packageGroup.style.display = 'block';
      packageSelect.setAttribute('required', 'required'); // Make required when visible
      loadPackagesForService(service);
      loadServiceQuestions(service);
    } else {
      packageGroup.style.display = 'none';
      packageSelect.removeAttribute('required'); // Remove required when hidden
      serviceQuestionsContainer.innerHTML = '';
    }
  }

  // Load Packages
  function loadPackagesForService(service) {
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

  // Get Packages
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

  // Load Service Questions
  function loadServiceQuestions(service) {
    const questions = getQuestionsForService(service);
    serviceQuestionsContainer.innerHTML = questions;

    // Setup file uploads
    setTimeout(setupFileUploads, 100);
  }

  // Get Questions
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

  // Service Question Templates
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
        <label for="techFeatures">Key Features Needed *</label>
        <textarea id="techFeatures" name="techFeatures" required placeholder="List the main features"></textarea>
        <span class="error-message">Please describe features</span>
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
        </select>
        <span class="error-message">Please select document type</span>
      </div>
      <div class="form-group">
        <label for="docPurpose">Purpose/Goal *</label>
        <textarea id="docPurpose" name="docPurpose" required></textarea>
        <span class="error-message">Please describe purpose</span>
      </div>
    `;
  }

  function getCreditQuestions() {
    return `
      <div class="form-group">
        <label for="creditGoals">Primary Goals *</label>
        <textarea id="creditGoals" name="creditGoals" required></textarea>
        <span class="error-message">Please describe goals</span>
      </div>
      <div class="form-group checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" name="creditAcknowledge" required>
          <span>I understand results are not guaranteed *</span>
        </label>
        <span class="error-message">Required</span>
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
        </select>
        <span class="error-message">Required</span>
      </div>
      <div class="form-group">
        <label for="compIssue">Issue Description *</label>
        <textarea id="compIssue" name="compIssue" required></textarea>
        <span class="error-message">Please describe issue</span>
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
          <option value="custom">Custom Wig</option>
        </select>
        <span class="error-message">Required</span>
      </div>
    `;
  }

  function getContouringQuestions() {
    return `
      <div class="form-group">
        <label for="contourAreas">Target Areas *</label>
        <textarea id="contourAreas" name="contourAreas" required></textarea>
        <span class="error-message">Required</span>
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
        </select>
        <span class="error-message">Required</span>
      </div>
    `;
  }

  // File Upload
  function setupFileUploads() {
    const fileUploads = document.querySelectorAll('.file-upload');

    fileUploads.forEach(upload => {
      const input = upload.querySelector('input[type="file"]');
      if (!input) return;

      upload.addEventListener('click', (e) => {
        if (e.target !== input) input.click();
      });

      input.addEventListener('change', (e) => {
        handleFiles(e.target.files);
      });
    });
  }

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Max 10MB.`);
        return;
      }
      uploadedFiles.push(file);
    });
  }

  // Navigation
  function nextStep() {
    if (!validateCurrentStep()) {
      alert('Please complete all required fields');
      return;
    }

    collectStepData();

    if (currentStep < totalSteps) {
      currentStep++;
      showStep(currentStep);

      if (currentStep === 4) {
        generateReviewSummary();
      }
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
      showStep(currentStep);
    }
  }

  function showStep(step) {
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));

    const stepEl = document.querySelector(`.form-step[data-step="${step}"]`);
    if (stepEl) stepEl.classList.add('active');

    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
      indicator.classList.remove('active', 'completed');
      if (index + 1 === step) {
        indicator.classList.add('active');
      } else if (index + 1 < step) {
        indicator.classList.add('completed');
      }
    });

    prevBtn.style.display = step === 1 ? 'none' : 'block';
    nextBtn.style.display = step === totalSteps ? 'none' : 'block';
    submitBtn.style.display = step === totalSteps ? 'block' : 'none';

    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateProgress() {
    const percent = (currentStep / totalSteps) * 100;
    progressFill.style.width = percent + '%';
  }

  // Validation
  function validateCurrentStep() {
    const stepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const inputs = stepEl.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
      const formGroup = input.closest('.form-group');

      // Skip checkbox validation in checkbox groups - handle separately
      if (input.type === 'checkbox' && input.closest('.checkbox-group')) {
        return;
      }

      if (!validateField(input)) {
        isValid = false;
        if (formGroup) formGroup.classList.add('error');
      } else {
        if (formGroup) formGroup.classList.remove('error');
      }
    });

    // Special handling for checkbox groups - at least one should be checked
    const checkboxGroups = stepEl.querySelectorAll('.checkbox-group');
    checkboxGroups.forEach(group => {
      const checkboxes = group.querySelectorAll('input[type="checkbox"]');
      if (checkboxes.length > 0) {
        // For step 4 policies, all should be checked
        if (currentStep === 4) {
          const allChecked = Array.from(checkboxes).every(cb => cb.checked);
          if (!allChecked) {
            isValid = false;
            group.classList.add('error');
          } else {
            group.classList.remove('error');
          }
        }
      }
    });

    // Signature is OPTIONAL for testing
    // Uncomment below to make it required:
    // if (currentStep === 4 && !validateSignature()) {
    //   isValid = false;
    // }

    return isValid;
  }

  function validateField(input) {
    if (input.type === 'checkbox') return input.checked;
    if (input.type === 'email') return input.value.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
    if (input.type === 'tel') return input.value.trim().length >= 10;
    return input.value.trim() !== '';
  }

  function validateSignature() {
    const canvas = document.getElementById('signaturePad');
    if (!canvas) return true;

    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) return true;
    }

    const signatureError = document.getElementById('signatureError');
    if (signatureError) {
      signatureError.textContent = 'Please provide signature';
      signatureError.style.display = 'block';
    }
    return false;
  }

  // Collect Data
  function collectStepData() {
    const stepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const inputs = stepEl.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
      if (input.type === 'checkbox') {
        formData[input.name] = input.checked;
      } else if (input.type !== 'file') {
        formData[input.name] = input.value;
      }
    });
  }

  // Review Summary
  function generateReviewSummary() {
    const summary = document.getElementById('reviewSummary');
    if (!summary) return;

    const serviceNames = {
      tech: 'Tech (Web/Software)',
      documents: 'Documents',
      credit: 'Credit Repair',
      computer: 'Computer Repair',
      wig: 'Beauty – Wig',
      contouring: 'Beauty – Body Contouring',
      facials: 'Beauty – Facials'
    };

    let html = `
      <div class="review-section">
        <h4>Service</h4>
        <div class="review-item">
          <span class="review-item-label">Service:</span>
          <span class="review-item-value">${serviceNames[formData.service] || formData.service}</span>
        </div>
        <div class="review-item">
          <span class="review-item-label">Subject:</span>
          <span class="review-item-value">${escapeHtml(formData.subject)}</span>
        </div>
      </div>
      <div class="review-section">
        <h4>Contact</h4>
        <div class="review-item">
          <span class="review-item-label">Name:</span>
          <span class="review-item-value">${escapeHtml(formData.customerName)}</span>
        </div>
        <div class="review-item">
          <span class="review-item-label">Email:</span>
          <span class="review-item-value">${escapeHtml(formData.customerEmail)}</span>
        </div>
      </div>
    `;

    summary.innerHTML = html;
  }

  // Form Submission
  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateCurrentStep()) {
      alert('Please complete all required fields');
      return;
    }

    const submitButton = submitBtn;
    const btnText = submitButton.querySelector('.btn-text');
    const btnLoading = submitButton.querySelector('.btn-loading');

    submitButton.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';

    try {
      const canvas = document.getElementById('signaturePad');
      const signatureData = canvas ? canvas.toDataURL() : '';

      const submissionData = {
        ...formData,
        attachments: [],
        signature: {
          name: formData.signatureName,
          data: signatureData,
          timestamp: new Date().toISOString(),
          ipAddress: 'unknown',
          userAgent: navigator.userAgent
        }
      };

      const response = await fetch('/api/intake/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      const result = await response.json();

      if (result.success) {
        localStorage.removeItem('orderIntakeDraft');
        window.location.href = `/order-confirmation/${result.orderId}`;
      } else {
        throw new Error(result.message || 'Submission failed');
      }

    } catch (error) {
      console.error('Submission error:', error);
      alert('Error submitting order. Please try again.');

      submitButton.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }

  // Draft Management
  function saveDraft() {
    collectStepData();
    const draft = {
      step: currentStep,
      data: formData,
      timestamp: Date.now()
    };
    localStorage.setItem('orderIntakeDraft', JSON.stringify(draft));
  }

  function loadDraft() {
    const draftStr = localStorage.getItem('orderIntakeDraft');
    if (!draftStr) return;

    try {
      const draft = JSON.parse(draftStr);

      if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
        formData = draft.data;

        if (confirm('Continue from saved draft?')) {
          currentStep = draft.step;
          showStep(currentStep);
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  }

  // Utilities
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Public API
  window.OrderIntakeWizard = {
    init,
    currentStep,
    formData,
    uploadedFiles
  };

})();

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => OrderIntakeWizard.init());
} else {
  OrderIntakeWizard.init();
}
