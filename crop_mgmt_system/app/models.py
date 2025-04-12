from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin


class User(UserMixin):
    def __init__(self, user_dict):
        """Initialize user from MongoDB document."""
        self.id = str(user_dict['_id'])  # Convert ObjectId to string
        self.username = user_dict['Username']
        self.email = user_dict['Email']
        self.password_hash = user_dict['Password']
        self.profile_info = user_dict.get('profile_info', '')
    
    def set_password(self, password):
        """Hashes the password and stores it."""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Checks the hashed password against the provided one."""
        return check_password_hash(self.password_hash, password)
    
# class Vet(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     name = db.Column(db.String(100), nullable=False)
#     address = db.Column(db.String(200), nullable=False)
#     phone = db.Column(db.String(20), nullable=False)
#     email = db.Column(db.String(100))
#     website = db.Column(db.String(100))
#     latitude = db.Column(db.Float, nullable=False)
#     longitude = db.Column(db.Float, nullable=False)
#     opening_hours = db.Column(db.String(100))
#     rating = db.Column(db.Float)
#     services = db.Column(db.JSON)