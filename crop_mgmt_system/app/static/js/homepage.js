document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap tooltips
    initTooltips();
    
    // Initialize sidebar toggle functionality
    initSidebarToggle();
    
    // Initialize disease trends chart if element exists
    initDiseaseTrendsChart();
    
    // Initialize file upload functionality if elements exist
    initFileUpload();
});

function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

function initSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebarToggle && sidebar && mainContent) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            mainContent.classList.toggle('active');
        });
    }
}

function initDiseaseTrendsChart() {
    const ctx = document.getElementById('diseaseTrendsChart')?.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                {
                    label: 'Tomato Blight',
                    data: [12, 19, 15, 27, 34, 42],
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Maize Rust',
                    data: [8, 12, 18, 21, 25, 30],
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Potato Late Blight',
                    data: [5, 9, 14, 16, 22, 28],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cases Reported'
                    }
                }
            }
        }
    });
}

function initFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const previewArea = document.getElementById('previewArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const imagePreview = document.getElementById('imagePreview');

    // Exit if any required elements are missing
    if (!uploadArea || !previewArea || !fileInput || !browseBtn || !cancelBtn || !analyzeBtn || !imagePreview) {
        return;
    }

    // Setup drag and drop events
    setupDragAndDrop(uploadArea);
    
    // Browse button click handler
    browseBtn.addEventListener('click', () => fileInput.click());
    
    // File input change handler
    fileInput.addEventListener('change', () => handleFileSelection(fileInput.files));
    
    // Cancel button handler
    cancelBtn.addEventListener('click', resetFileUpload);
    
    // Analyze button handler
    analyzeBtn.addEventListener('click', analyzeImage);

    function setupDragAndDrop(element) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            element.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            element.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            element.addEventListener(eventName, unhighlight, false);
        });

        element.addEventListener('drop', handleDrop, false);
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
            showAlert('Please select a valid image file (JPG, PNG)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            showAlert('File size exceeds 5MB limit');
            return;
        }

        const reader = new FileReader();
        
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            uploadArea.classList.add('d-none');
            previewArea.classList.remove('d-none');
        };
        
        reader.onerror = function() {
            showAlert('Error reading file. Please try again.');
        };
        
        reader.readAsDataURL(file);
    }

    function resetFileUpload() {
        fileInput.value = '';
        imagePreview.src = '#';
        previewArea.classList.add('d-none');
        uploadArea.classList.remove('d-none');
    }

    function analyzeImage() {
        if (!fileInput.files.length) {
            showAlert('Please select an image first');
            return;
        }

        setLoadingState(true);
        
        // In a real application, you would send this to your backend API
        simulateAnalysis(fileInput.files[0]);
    }

    function setLoadingState(isLoading) {
        if (isLoading) {
            analyzeBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Analyzing...';
            analyzeBtn.disabled = true;
            cancelBtn.disabled = true;
        } else {
            analyzeBtn.innerHTML = 'Analyze Image';
            analyzeBtn.disabled = false;
            cancelBtn.disabled = false;
        }
    }

    function simulateAnalysis(file) {
        // Simulate API call delay
        setTimeout(() => {
            // This is where you would normally make a fetch request to your backend
            // For demo purposes, we'll redirect to a sample result
            window.location.href = '/result?disease=Tomato%20Blight&confidence=92.5';
            
            // In a real implementation, you would do something like:
            /*
            const formData = new FormData();
            formData.append('file', file);
            
            fetch('/predict', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                window.location.href = `/result?disease=${encodeURIComponent(data.disease)}&confidence=${data.confidence}`;
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('Error processing image. Please try again.');
                setLoadingState(false);
            });
            */
        }, 1500);
    }

    function showAlert(message) {
        // You could replace this with a more elegant notification system
        alert(message);
    }
}