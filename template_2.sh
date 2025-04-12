#!/bin/bash

# Create main project directory
mkdir -p crop_mgmt_system/{app/static/css,app/static/js,app/static/images,app/templates,models,uploads,logs,migrations,instance,tests}

# Create Python files
touch crop_mgmt_system/app/{routes.py,model.py,database.py,forms.py,utils.py,__init__.py}
touch crop_mgmt_system/{requirements.txt,config.py,main.py,README.md}

# Create instance config file
touch crop_mgmt_system/instance/config.py

# Create test file
touch crop_mgmt_system/tests/test_main.py

# Create CNN model storage
touch crop_mgmt_system/models/crop_disease.h5

# Create frontend HTML templates
touch crop_mgmt_system/app/templates/{index.html,result.html,dashboard.html,forum.html,vets.html}

# Create static assets
touch crop_mgmt_system/app/static/css/style.css
touch crop_mgmt_system/app/static/js/script.js

# Initialize a virtual environment
python3 -m venv crop_mgmt_system/venv

# Print completion message
echo "Crop Disease Diagnosis and Management System structure created successfully."

