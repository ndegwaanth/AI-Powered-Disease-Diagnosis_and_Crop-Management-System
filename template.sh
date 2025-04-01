#!/bin/bash

# Create main project directory
mkdir -p crop_mgmt_system/{app/static,app/templates,migrations,instance,tests}

# Create Python files
touch crop_mgmt_system/app/{routes.py,models.py,forms.py,utils.py,__init__.py}
touch crop_mgmt_system/{requirements.txt,config.py,mana.py,README.md}

touch crop_mgmt_system/instance/config.py

touch crop_mgmt_system/tests/test_main.py

# Initialize a virtual environment
python3 -m venv crop_mgmt_system/venv

# Print completion message
echo "Flask Health Management System structure created successfully."

