"""
Input validation and error handling for AamaSuraksha API
Ensures data integrity and provides meaningful error messages
"""

from datetime import datetime
import re


class HealthRecordValidator:
    """Validate health record inputs"""

    @staticmethod
    def validate_health_record(record: dict) -> tuple[bool, str]:
        """
        Validate a health record for required fields and value ranges
        Returns: (is_valid, error_message)
        """
        # Check required fields
        required_fields = ['date', 'weight', 'systolic', 'diastolic']
        for field in required_fields:
            if field not in record or record[field] is None:
                return False, f"Missing required field: {field}"

        # Validate date format
        try:
            datetime.strptime(record['date'], '%Y-%m-%d')
        except ValueError:
            return False, "Invalid date format. Use YYYY-MM-DD"

        # Validate weight (kg) — Nepal context: 40-120kg
        try:
            weight = float(record['weight'])
            if weight < 35 or weight > 130:
                return False, f"Weight {weight}kg outside expected range (35-130kg)"
        except (ValueError, TypeError):
            return False, "Weight must be a number"

        # Validate blood pressure (systolic)
        try:
            systolic = int(record['systolic'])
            if systolic < 70 or systolic > 180:
                return False, f"Systolic {systolic} outside normal range (70-180)"
        except (ValueError, TypeError):
            return False, "Systolic must be an integer"

        # Validate blood pressure (diastolic)
        try:
            diastolic = int(record['diastolic'])
            if diastolic < 40 or diastolic > 120:
                return False, f"Diastolic {diastolic} outside normal range (40-120)"
        except (ValueError, TypeError):
            return False, "Diastolic must be an integer"

        # Validate haemoglobin if present (g/dL) — Nepal context: 7-15
        if 'haemoglobin' in record and record['haemoglobin'] is not None:
            try:
                hb = float(record['haemoglobin'])
                if hb < 5 or hb > 18:
                    return False, f"Haemoglobin {hb} outside expected range (5-18 g/dL)"
            except (ValueError, TypeError):
                return False, "Haemoglobin must be a number"

        # Validate blood sugar if present (mmol/L)
        if 'blood_sugar' in record and record['blood_sugar'] is not None:
            try:
                bs = float(record['blood_sugar'])
                if bs < 2 or bs > 20:
                    return False, f"Blood sugar {bs} outside expected range (2-20 mmol/L)"
            except (ValueError, TypeError):
                return False, "Blood sugar must be a number"

        return True, ""

    @staticmethod
    def validate_bulk_records(records: list) -> tuple[bool, str, list]:
        """
        Validate multiple health records
        Returns: (all_valid, error_message, invalid_indices)
        """
        if not records:
            return False, "No records provided", []

        invalid_indices = []
        for idx, record in enumerate(records):
            is_valid, error_msg = HealthRecordValidator.validate_health_record(record)
            if not is_valid:
                invalid_indices.append({
                    'index': idx,
                    'error': error_msg,
                    'record': record
                })

        if invalid_indices:
            error = f"{len(invalid_indices)} record(s) failed validation"
            return False, error, invalid_indices

        return True, "", []


class UserValidator:
    """Validate user registration and profile data"""

    @staticmethod
    def validate_nepali_phone(phone: str) -> tuple[bool, str]:
        """
        Validate Nepal phone number format
        Valid: +977XXXXXXXXXXX or 97XXXXXXXXXXX or XXXXXXXXXXX (10 digits starting with 9)
        """
        # Remove spaces and dashes
        phone = phone.replace(" ", "").replace("-", "")

        # Remove country code if present
        if phone.startswith("+977"):
            phone = phone[4:]
        elif phone.startswith("977"):
            phone = phone[3:]

        # Check if it's 10 digits starting with 9 (Nepal mobile)
        if not re.match(r'^[9]\d{9}$', phone):
            return False, "Invalid Nepal phone format. Use 10 digits starting with 9 (e.g., 98XXXXXXXX)"

        return True, ""

    @staticmethod
    def validate_user_registration(user_data: dict) -> tuple[bool, str]:
        """Validate user registration data"""
        required_fields = ['name', 'phone', 'age', 'weeks_pregnant']
        for field in required_fields:
            if field not in user_data or not user_data[field]:
                return False, f"Missing required field: {field}"

        # Validate name
        name = str(user_data['name']).strip()
        if len(name) < 2 or len(name) > 100:
            return False, "Name must be 2-100 characters"

        # Validate phone
        is_valid, error_msg = UserValidator.validate_nepali_phone(str(user_data['phone']))
        if not is_valid:
            return False, error_msg

        # Validate age (13-60 for maternal health app)
        try:
            age = int(user_data['age'])
            if age < 13 or age > 60:
                return False, "Age must be between 13 and 60"
        except (ValueError, TypeError):
            return False, "Age must be a number"

        # Validate weeks pregnant (0-44)
        try:
            weeks = int(user_data['weeks_pregnant'])
            if weeks < 0 or weeks > 44:
                return False, "Weeks pregnant must be 0-44"
        except (ValueError, TypeError):
            return False, "Weeks pregnant must be a number"

        return True, ""


class RiskAssessmentValidator:
    """Validate risk assessment requests"""

    @staticmethod
    def validate_risk_request(request_data: dict, min_records: int = 1) -> tuple[bool, str]:
        """
        Validate risk assessment request
        Returns: (is_valid, error_message)
        """
        if 'user_id' not in request_data:
            return False, "Missing user_id in request"

        health_records = request_data.get('health_records', [])

        if len(health_records) < min_records:
            return False, f"Minimum {min_records} health record(s) required for assessment"

        # Validate individual records
        is_valid, error_msg, invalid_indices = HealthRecordValidator.validate_bulk_records(health_records)

        if not is_valid:
            return False, f"Health records validation failed: {error_msg}"

        return True, ""


class ErrorResponse:
    """Standardized error response formatting"""

    @staticmethod
    def validation_error(field: str, message: str) -> dict:
        """Format validation error"""
        return {
            'error': 'validation_error',
            'field': field,
            'message': message,
            'timestamp': datetime.now().isoformat()
        }

    @staticmethod
    def database_error(message: str = "Database connection failed") -> dict:
        """Format database error"""
        return {
            'error': 'database_error',
            'message': message,
            'timestamp': datetime.now().isoformat()
        }

    @staticmethod
    def model_error(message: str = "ML model not available") -> dict:
        """Format model error"""
        return {
            'error': 'model_error',
            'message': message,
            'timestamp': datetime.now().isoformat()
        }

    @staticmethod
    def server_error(message: str = "Internal server error") -> dict:
        """Format server error"""
        return {
            'error': 'server_error',
            'message': message,
            'timestamp': datetime.now().isoformat()
        }


class DataSanitizer:
    """Sanitize and normalize data"""

    @staticmethod
    def sanitize_string(value: str, max_length: int = 255) -> str:
        """Sanitize string input"""
        if not isinstance(value, str):
            value = str(value)

        # Remove leading/trailing whitespace
        value = value.strip()

        # Truncate if too long
        if len(value) > max_length:
            value = value[:max_length]

        return value

    @staticmethod
    def normalize_phone(phone: str) -> str:
        """Normalize phone number to standard format"""
        phone = phone.replace(" ", "").replace("-", "").replace("+", "")

        # Add country code if missing
        if len(phone) == 10 and phone.startswith('9'):
            phone = "977" + phone
        elif len(phone) == 13 and phone.startswith('977'):
            pass  # Already in standard format
        else:
            phone = "977" + phone[-10:]  # Take last 10 digits

        return phone

    @staticmethod
    def normalize_health_record(record: dict) -> dict:
        """Normalize health record data"""
        normalized = {
            'date': str(record.get('date', '')).strip(),
            'weight': float(record.get('weight', 52.0)),
            'systolic': int(record.get('systolic', 120)),
            'diastolic': int(record.get('diastolic', 80)),
            'symptoms': DataSanitizer.sanitize_string(record.get('symptoms', ''), 500),
            'notes': DataSanitizer.sanitize_string(record.get('notes', ''), 1000),
        }

        # Optional Nepal-specific fields
        if 'haemoglobin' in record:
            normalized['haemoglobin'] = float(record['haemoglobin'])
        if 'blood_sugar' in record:
            normalized['blood_sugar'] = float(record['blood_sugar'])
        if 'prev_complications' in record:
            normalized['prev_complications'] = int(record['prev_complications'])

        return normalized
