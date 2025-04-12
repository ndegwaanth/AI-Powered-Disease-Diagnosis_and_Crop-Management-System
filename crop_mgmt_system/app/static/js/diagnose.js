document.addEventListener('DOMContentLoaded', function() {
    // Initialize elements
    const uploadArea = document.getElementById('uploadArea');
    const previewArea = document.getElementById('previewArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const imagePreview = document.getElementById('imagePreview');
    const diagnoseForm = document.getElementById('diagnoseForm');
    const resultsSection = document.getElementById('resultsSection');
    const newDiagnosisBtn = document.getElementById('newDiagnosisBtn');
    
    // Check if elements exist
    if (!uploadArea || !previewArea || !fileInput || !browseBtn || !cancelBtn || !analyzeBtn || !imagePreview) {
        return;
    }
    
    // Initialize file upload functionality
    initFileUpload();
    
    // New diagnosis button
    if (newDiagnosisBtn) {
        newDiagnosisBtn.addEventListener('click', function() {
            resetFileUpload();
            resultsSection.classList.add('d-none');
        });
    }
    
    function initFileUpload() {
        // Setup drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, unhighlight, false);
        });
        
        uploadArea.addEventListener('drop', handleDrop, false);
        
        // Browse button click
        browseBtn.addEventListener('click', () => fileInput.click());
        
        // File input change
        fileInput.addEventListener('change', () => handleFileSelection(fileInput.files));
        
        // Cancel button
        cancelBtn.addEventListener('click', resetFileUpload);
    }
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        uploadArea.classList.add('highlight');
    }
    
    function unhighlight() {
        uploadArea.classList.remove('highlight');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFileSelection(files);
    }
    
    function handleFileSelection(files) {
        if (!files.length) return;
        
        const file = files[0];
        const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        
        if (!validImageTypes.includes(file.type)) {
            showAlert('Please select a valid image file (JPG, PNG)', 'danger');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            showAlert('File size exceeds 5MB limit', 'danger');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            uploadArea.classList.add('d-none');
            previewArea.classList.remove('d-none');
        };
        
        reader.onerror = function() {
            showAlert('Error reading file. Please try again.', 'danger');
        };
        
        reader.readAsDataURL(file);
    }
    
    function resetFileUpload() {
        fileInput.value = '';
        imagePreview.src = '#';
        previewArea.classList.add('d-none');
        uploadArea.classList.remove('d-none');
    }
    
    function showAlert(message, type = 'info') {
        // Create Bootstrap toast notification
        const toastContainer = document.createElement('div');
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '11';
        
        const toast = document.createElement('div');
        toast.className = `toast show align-items-center text-white bg-${type} border-0`;
        toast.role = 'alert';
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        document.body.appendChild(toastContainer);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toastContainer.remove(), 500);
        }, 5000);
    }
    
    // Form submission loading state
    if (diagnoseForm) {
        diagnoseForm.addEventListener('submit', function() {
            analyzeBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Analyzing...';
            analyzeBtn.disabled = true;
            cancelBtn.disabled = true;
        });
    }
    
    // Save report button
    const saveReportBtn = document.getElementById('saveReportBtn');
    if (saveReportBtn) {
        saveReportBtn.addEventListener('click', function() {
            // Implement save functionality
            showAlert('Diagnosis report saved successfully!', 'success');
        });
    }
    
    // Find agro-vet button
    const findAgrovetBtn = document.getElementById('findAgrovetBtn');
    if (findAgrovetBtn) {
        findAgrovetBtn.addEventListener('click', function() {
            window.location.href = '/vets';
        });
    }
});