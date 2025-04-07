// File upload functionality
const uploadArea = document.getElementById('uploadArea');
const previewArea = document.getElementById('previewArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const cancelBtn = document.getElementById('cancelBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const imagePreview = document.getElementById('imagePreview');

if (uploadArea && fileInput && browseBtn) {
    // Debug: Verify elements exist
    console.log('Upload elements found:', {uploadArea, fileInput, browseBtn});

    // Handle browse button click
    browseBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Triggering file input click');
        fileInput.click();
    });

    // Handle file selection
    fileInput.addEventListener('change', function() {
        console.log('File selected:', fileInput.files);
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            if (file.type.match('image.*')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    uploadArea.classList.add('d-none');
                    previewArea.classList.remove('d-none');
                };
                reader.readAsDataURL(file);
            } else {
                alert('Please select an image file (JPG, PNG)');
            }
        }
    });

    // Rest of your upload code...

    // File upload functionality
    const uploadArea = document.getElementById('uploadArea');
    const previewArea = document.getElementById('previewArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const imagePreview = document.getElementById('imagePreview');

    if (uploadArea) {
        // Handle drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, unhighlight, false);
        });

        function highlight() {
            uploadArea.classList.add('highlight');
        }

        function unhighlight() {
            uploadArea.classList.remove('highlight');
        }

        // Handle file drop
        uploadArea.addEventListener('drop', handleDrop, false);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        }

        // Handle file selection via button
        browseBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => handleFiles(fileInput.files));

        // Handle file processing
        function handleFiles(files) {
            if (files.length) {
                const file = files[0];
                if (file.type.match('image.*')) {
                    const reader = new FileReader();
                    
                    reader.onload = function(e) {
                        imagePreview.src = e.target.result;
                        uploadArea.classList.add('d-none');
                        previewArea.classList.remove('d-none');
                    };
                    
                    reader.readAsDataURL(file);
                } else {
                    alert('Please select an image file (JPG, PNG)');
                }
            }
        }

        // Cancel button
        cancelBtn.addEventListener('click', () => {
            previewArea.classList.add('d-none');
            uploadArea.classList.remove('d-none');
            fileInput.value = '';
        });

        // Analyze button
        analyzeBtn.addEventListener('click', () => {
            if (!fileInput.files.length) {
                alert('Please select an image first');
                return;
            }

            // Show loading state
            analyzeBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Analyzing...';
            analyzeBtn.disabled = true;

            // Create FormData object
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);

            // Simulate API call (replace with actual fetch to your /predict endpoint)
            setTimeout(() => {
                // This would be your actual fetch call:
                // fetch('/predict', {
                //     method: 'POST',
                //     body: formData
                // })
                // .then(response => response.json())
                // .then(data => {
                //     window.location.href = `/result?disease=${encodeURIComponent(data.disease)}&confidence=${data.confidence}`;
                // })
                // .catch(error => {
                //     console.error('Error:', error);
                //     alert('Error processing image. Please try again.');
                //     analyzeBtn.innerHTML = 'Analyze Image';
                //     analyzeBtn.disabled = false;
                // });
                
                // For demo purposes, redirect to a sample result
                window.location.href = '/result?disease=Tomato%20Blight&confidence=92.5';
            }, 1500);
        });
    }

    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
};