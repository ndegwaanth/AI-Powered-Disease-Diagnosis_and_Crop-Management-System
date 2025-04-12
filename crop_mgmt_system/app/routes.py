from flask import Blueprint, render_template, redirect, url_for, request, session, flash
from flask_bcrypt import Bcrypt
from .models import User
from .forms import Registration, LoginForm
from flask_login import LoginManager, login_user, logout_user, login_required, login_remembered, current_user
from flask_session import Session
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
import io
from .labels import class_labels
from sklearn.metrics import classification_report, confusion_matrix
import pandas as pd
import os
from bson.objectid import ObjectId
import os
from datetime import datetime
import uuid
from werkzeug.utils import secure_filename
import base64
from flask import abort, jsonify, json, current_app
from flask_wtf.csrf import validate_csrf
import logging


main_bp = Blueprint('main', __name__)

# Setup Logging
logger = logging.getLogger('main_logger')
logger.setLevel(logging.INFO)

# File Handler
handler = logging.FileHandler('app.log')
handler.setLevel(logging.INFO)

# Formatter (Optional but Recommended)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)

# Add Handler to Logger
logger.addHandler(handler)

bcrypt = Bcrypt()


@main_bp.route('/')
def landing_page():
    return render_template('index.html')


@main_bp.route('/logout')
@login_required
def logout():
    session.clear()
    logout_user()
    flash("You have been logged out successfully.")
    return redirect(url_for('main.login'))

@main_bp.route('/AI-Powered-Disease-Diagnosis_and_Crop-Management-System/crop/mgmts')
def homepage():
    return render_template('homepage.html')


@main_bp.route("/signup", methods=["POST", "GET"])
def register():
    from . import collection
    form = Registration()
    if form.validate_on_submit() and request.method == 'POST':
        # Collect form data
        firstname = form.firstname.data
        lastname = form.lastname.data
        username_reg = form.username.data
        email_reg = form.email.data
        password_reg = form.password.data
        confirm_password = form.confirm_password.data

        # Check if passwords match
        if password_reg != confirm_password:
            return render_template("register.html", form=form, error="Passwords do not match")

        # Hash the password
        password_hash = bcrypt.generate_password_hash(password_reg).decode('utf-8')

        try:
            # Check if the email or username already exists
            if collection.find_one({"Email": email_reg}) or collection.find_one({"Username": username_reg}):
                return render_template("register.html", form=form, error="Email or username already taken")

            # Insert the new user into MongoDB
            user_data = {
                "FirstName": firstname,
                "LastName": lastname,
                "Username": username_reg,
                "Email": email_reg,
                "Password": password_hash
            }
            collection.insert_one(user_data)

            print("Connection Successful")

            # Automatically log in the user after registration
            user_dict = collection.find_one({"Email": email_reg})
            user = User(user_dict)
            login_user(user)

            flash(f"Welcome, {current_user.username}!", "success")
            return redirect(url_for("main.homepage"))
        except Exception as e:
            return render_template("register.html", form=form, error="Database error: " + str(e))
    print("Connection failled")
    return render_template("register.html", form=form)



@main_bp.route('/login', methods=['POST', 'GET'])
def login():
    from . import collection

    if current_user.is_authenticated:
        return redirect(url_for('main.homepage'))

    form = LoginForm()
    if form.validate_on_submit():
        user_dict = collection.find_one({"Email": form.email.data})
        if user_dict and bcrypt.check_password_hash(user_dict["Password"], form.password.data):
            user = User(user_dict)
            login_user(user, remember=True)  # Add remember=True
            
            # Set session variables
            session['user_id'] = str(user_dict['_id'])
            session['logged_in'] = True
            session.permanent = True  # Make session persistent
            session.modified = True   # Mark session as modified
            
            flash('Login successful!', 'success')
            return redirect(url_for('main.homepage'))
    
    return render_template('login.html', form=form)


# Assuming you already have your model and class labels loaded
model = load_model("machine_models/cnn_model.h5")

def get_treatments(disease):
    """Return treatment recommendations for the detected disease"""
    treatments_db = {
        "Tomato Blight": [
            "Remove and destroy infected plants immediately",
            "Apply copper-based fungicides every 7-10 days",
            "Improve air circulation by proper plant spacing",
            "Water at the base of plants to avoid wetting leaves",
            "Use resistant varieties for future plantings"
        ],
        "Maize Rust": [
            "Apply fungicides containing chlorothalonil or mancozeb",
            "Remove and destroy crop debris after harvest",
            "Rotate crops with non-host plants for 2-3 years",
            "Plant resistant varieties in next season",
            "Avoid excessive nitrogen fertilization"
        ],
        "Potato Late Blight": [
            "Destroy infected plants and tubers immediately",
            "Apply fungicides before infection occurs",
            "Allow tubers to mature fully before harvesting",
            "Store potatoes in cool, dry conditions",
            "Use certified disease-free seed potatoes"
        ]
    }
    return treatments_db.get(disease, [
        "Consult with local agricultural extension service",
        "Isolate affected plants to prevent spread",
        "Take clear photos from multiple angles for expert diagnosis",
        "Maintain proper field hygiene and sanitation"
    ])


def get_prevention(disease):
    """Return prevention tips for the detected disease"""
    prevention_db = {
        "Tomato Blight": [
            "Rotate crops with non-solanaceous plants for 3-4 years",
            "Stake plants to improve air circulation",
            "Avoid overhead irrigation",
            "Apply mulch to prevent soil splashing onto leaves",
            "Monitor plants regularly for early symptoms"
        ],
        "Maize Rust": [
            "Plant early to avoid peak rust periods",
            "Maintain proper plant spacing",
            "Control volunteer maize plants",
            "Use balanced fertilization (avoid excess nitrogen)",
            "Select hybrids with partial resistance"
        ],
        "Potato Late Blight": [
            "Plant only certified disease-free seed potatoes",
            "Destroy cull piles and volunteer plants",
            "Time planting to avoid cool, wet periods",
            "Apply protectant fungicides before rainy periods",
            "Harvest during dry weather conditions"
        ]
    }
    return prevention_db.get(disease, [
        "Practice crop rotation with unrelated species",
        "Use disease-free seeds and planting materials",
        "Monitor fields regularly for early detection",
        "Maintain proper plant nutrition and irrigation",
        "Clean equipment between fields to prevent spread"
    ])


@main_bp.route("/diagnose", methods=['GET'])
@login_required
def diagnose():
    # Check if there's diagnosis data in the session
    diagnosis_data = session.pop('diagnosis_data', None)
    
    if diagnosis_data:
        return render_template("diagnose.html",
            disease=diagnosis_data['disease'],
            confidence=diagnosis_data['confidence'],
            treatments=diagnosis_data['treatments'],
            preventions=diagnosis_data['preventions'],
            image_data=diagnosis_data['image_data']
        )
    
    # Default values for GET request
    return render_template("diagnose.html",
        disease=None,
        confidence=0,
        treatments=[],
        preventions=[],
        image_data=None
    )

@main_bp.route("/diagnose/crop/disease/", methods=['POST'])
@login_required
def diagnose_disease():
    # Default values for failed POST
    default_values = {
        'disease': None,
        'confidence': 0,
        'treatments': [],
        'preventions': [],
        'image_data': None
    }

    if request.method == 'POST':
        try:
            # 1. CSRF Token Validation
            csrf_token = request.form.get('csrf_token') or request.headers.get('X-CSRFToken')
            if not csrf_token:
                current_app.logger.error("CSRF token missing in request")
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return jsonify({'status': 'error', 'message': 'Security token missing'}), 400
                flash('Security token missing. Please try again.', 'danger')
                return render_template("diagnose.html", **default_values)
                
            try:
                validate_csrf(csrf_token)
            except Exception as e:
                current_app.logger.error(f"CSRF validation failed: {str(e)}")
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return jsonify({'status': 'error', 'message': 'Invalid security token'}), 400
                flash('Invalid security token. Please refresh the page and try again.', 'danger')
                return render_template("diagnose.html", **default_values)

            # 2. File Upload Validation
            if 'file' not in request.files:
                current_app.logger.error("No file part in request")
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return jsonify({'status': 'error', 'message': 'No file uploaded'}), 400
                flash('No file uploaded. Please select an image.', 'danger')
                return render_template("diagnose.html", **default_values)
                
            file = request.files['file']
            
            if file.filename == '':
                current_app.logger.error("Empty file submitted")
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return jsonify({'status': 'error', 'message': 'No file selected'}), 400
                flash('No file selected. Please choose an image.', 'danger')
                return render_template("diagnose.html", **default_values)

            # 3. File Type Validation
            allowed_extensions = {'jpg', 'jpeg', 'png'}
            if not ('.' in file.filename and 
                   file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
                current_app.logger.error(f"Invalid file type: {file.filename}")
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return jsonify({'status': 'error', 'message': 'Only JPG/JPEG/PNG files allowed'}), 400
                flash('Only JPG, JPEG or PNG images are allowed.', 'danger')
                return render_template("diagnose.html", **default_values)

            # 4. File Size Validation
            file_content = file.read()
            if len(file_content) > 5 * 1024 * 1024:  # 5MB limit
                current_app.logger.error("File size exceeds 5MB limit")
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return jsonify({'status': 'error', 'message': 'File size exceeds 5MB limit'}), 400
                flash('File size exceeds 5MB limit. Please use a smaller image.', 'danger')
                return render_template("diagnose.html", **default_values)
            file.seek(0)  # Reset file pointer after reading

            # 5. Image Processing
            try:
                img = image.load_img(io.BytesIO(file_content), target_size=(224, 224))
                img_array = image.img_to_array(img) / 255.0
                img_array = np.expand_dims(img_array, axis=0)
            except Exception as e:
                current_app.logger.error(f"Image processing failed: {str(e)}")
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return jsonify({'status': 'error', 'message': 'Failed to process image'}), 400
                flash('Failed to process image. Please try with a different image.', 'danger')
                return render_template("diagnose.html", **default_values)

            # 6. Model Prediction
            try:
                prediction = model.predict(img_array)
                predicted_class = class_labels[np.argmax(prediction)]
                confidence = float(np.max(prediction)) * 100
                
                if confidence < 60:  # Threshold for low confidence
                    current_app.logger.warning(f"Low confidence prediction: {confidence}% for {predicted_class}")
                    warning_msg = f'Diagnosis confidence is low ({confidence:.2f}%). Please consult an expert.'
            except Exception as e:
                current_app.logger.error(f"Model prediction failed: {str(e)}")
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return jsonify({'status': 'error', 'message': 'Diagnosis failed'}), 500
                flash('Diagnosis failed due to server error. Please try again.', 'danger')
                return render_template("diagnose.html", **default_values)

            # 7. Prepare Results
            file.seek(0)
            image_data = base64.b64encode(file.read()).decode('utf-8')
            treatments = get_treatments(predicted_class)
            preventions = get_prevention(predicted_class)
            
            # 8. Save to Database (optional)
            try:
                diagnosis_data = {
                    "user_id": current_user.id,
                    "date": datetime.now(),
                    "image_filename": secure_filename(file.filename),
                    "predicted_class": predicted_class,
                    "confidence": confidence,
                    "treatments": treatments,
                    "preventions": preventions,
                    "status": "completed"
                }
                # Uncomment when your database is ready:
                # db.diagnoses.insert_one(diagnosis_data)
            except Exception as e:
                current_app.logger.error(f"Failed to save diagnosis: {str(e)}")
                # Continue even if save fails

            # 9. Store results in session and return appropriate response
            session['diagnosis_data'] = {
                'disease': predicted_class,
                'confidence': confidence,
                'treatments': treatments,
                'preventions': preventions,
                'image_data': image_data
            }

            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({
                    'status': 'success',
                    'redirect': url_for('main.diagnose')
                })
            
            # Regular form submission
            return redirect(url_for('main.diagnose'))

        except Exception as e:
            current_app.logger.exception("Unexpected error in diagnose route")
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({
                    'status': 'error',
                    'message': 'An unexpected error occurred'
                }), 500
            flash('An unexpected error occurred. Please try again.', 'danger')
            return render_template("diagnose.html", **default_values)

    # GET request - show empty form
    return render_template("diagnose.html", **default_values)

@main_bp.route("/diagnose/results", methods=['POST'])
@login_required
def diagnosis_results():
    try:
        validate_csrf(request.form.get('csrf_token'))
        
        return render_template("diagnose.html",
            disease=request.form.get('disease'),
            confidence=float(request.form.get('confidence', 0)),
            treatments=json.loads(request.form.get('treatments', '[]')),
            preventions=json.loads(request.form.get('preventions', '[]')),
            image_data=request.form.get('image_data')
        )
    except Exception as e:
        current_app.logger.error(f"Error displaying results: {str(e)}")
        flash('Error displaying diagnosis results', 'danger')
        return redirect(url_for('main.diagnose'))


@main_bp.route("/agro/vets")
def vets():
    from . import agro_vets
    # Get filter parameters from request
    service_filter = request.args.get('service', 'all')
    rating_filter = request.args.get('rating', 'all')
    location = request.args.get('location', '')
    
    # Query database with filters (MongoDB example)
    query = {}
    
    if service_filter != 'all':
        query['services'] = service_filter
        
    if rating_filter != 'all':
        query['rating'] = {'$gte': float(rating_filter)}
    
    
    vets = list(agro_vets.find(query))
    
    # Convert ObjectId to string for JSON serialization
    for vet in vets:
        vet['_id'] = str(vet['_id'])
    
    return render_template("vets.html", vets=vets, current_user=current_user)


@main_bp.route("/history")
def history():
    return render_template("history.html")

@main_bp.route("/community/forum")
def forum():
    return render_template("forum.html")


@main_bp.route("/profile/setting")
def profile():
    return render_template("profile.html")

@main_bp.route("/notification/alerts")
def alerts():
    return render_template("alerts.html")


@main_bp.route('/dashboard')
def dashboard():
    return render_template("dashboard")