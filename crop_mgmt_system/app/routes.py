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


main_bp = Blueprint('main', __name__)

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

@main_bp.route("/crop/prediction", methods=["GET", "POST"])
def predict():
    predicted_class = None  # Initialize variable
    metrics = None
    confusion = None

    if request.method == "POST":
        if "file" not in request.files:
            flash("No file uploaded", "danger")
            return render_template("homepage.html", prediction=None, metrics=None, confusion=None)

        file = request.files["file"]

        if file.filename == "":
            flash("No selected file", "danger")
            return render_template("homepage.html", prediction=None, metrics=None, confusion=None)

        try:
            # Read image file as a PIL Image
            img = image.load_img(io.BytesIO(file.read()), target_size=(224, 224))

            # Normalize image
            img_array = image.img_to_array(img) / 255.0

            # Reshape for model
            img_array = np.expand_dims(img_array, axis=0)

            # Make prediction
            prediction = model.predict(img_array)
            predicted_class = class_labels[np.argmax(prediction)]  # Get class label

            # Metrics Calculation (if you have ground truth for a sample to compare with)
            # Assuming you have ground truth labels for this prediction (like in a batch, for example)
            true_label = ...  # Obtain the true label for comparison, e.g., from a database or predefined set
            
            # Classification report (precision, recall, f1-score)
            y_pred = np.argmax(prediction, axis=1)
            y_true = np.array([true_label])  # True label should be in a comparable format
            report = classification_report(y_true, y_pred, target_names=class_labels)

            # Confusion Matrix
            confusion = confusion_matrix(y_true, y_pred)

            flash(f"Prediction: {predicted_class}", "success")
            metrics = pd.DataFrame.from_dict(classification_report(y_true, y_pred, target_names=class_labels, output_dict=True)).T

        except Exception as e:
            flash(f"Error processing image: {str(e)}", "danger")

    return render_template("result.html", prediction=predicted_class, metrics=metrics, confusion=confusion)
