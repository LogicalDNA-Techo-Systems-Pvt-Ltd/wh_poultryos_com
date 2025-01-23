import frappe
from frappe.utils.password import check_password, hash_password
from frappe.utils import random_string


@frappe.whitelist(allow_guest=True)
def login(usr, pwd):
    """
    Custom login function for PoultryOS

    Args:
        usr (str): User email
        pwd (str): User password

    Returns:
        dict: Login status
    """
    try:
        # Verify credentials
        user = frappe.get_doc("User", usr)

        # Check if user is active
        if not user.enabled:
            return {"message": "User disabled"}

        # Validate password
        if check_password(usr, pwd):
            # Perform login
            frappe.set_user(usr)
            frappe.local.login_manager.login_as(usr)

            return {"message": "Logged In"}
        else:
            return {"message": "Invalid credentials"}

    except frappe.DoesNotExistError:
        return {"message": "User not found"}
    except Exception as e:
        frappe.log_error(f"Login error: {str(e)}")
        return {"message": "Login failed"}


@frappe.whitelist(allow_guest=True)
def register_custom_user(email, password, full_name, phone=None):
    """
    Custom user registration function for PoultryOS

    Args:
        email (str): User email
        password (str): User password
        full_name (str): User's full name
        phone (str, optional): User's phone number

    Returns:
        dict: Registration status
    """
    try:
        # Check if user already exists
        if frappe.db.exists("User", {"email": email}):
            return {"message": "User already exists", "success": False}

        # Create new user
        user = frappe.get_doc(
            {
                "doctype": "User",
                "email": email,
                "first_name": full_name.split()[0],
                "last_name": (
                    " ".join(full_name.split()[1:])
                    if len(full_name.split()) > 1
                    else ""
                ),
                "full_name": full_name,
                "phone": phone,
                "enabled": 1,
                "new_password": password,
                "send_welcome_email": 0,  # Disable default welcome email
            }
        )

        # Set user roles
        user.append("roles", {"role": "Customer"})

        # Save user
        user.insert(ignore_permissions=True)

        # Set password securely
        user.set_password(password)

        return {"message": "Registration successful", "success": True}

    except Exception as e:
        frappe.log_error(f"Registration error: {str(e)}")
        return {"message": "Registration failed", "success": False}


@frappe.whitelist(allow_guest=True)
def send_reset_password_otp(email):
    """
    Send password reset OTP

    Args:
        email (str): User email

    Returns:
        dict: OTP sending status
    """
    try:
        # Validate user exists
        if not frappe.db.exists("User", {"email": email}):
            return {"message": "User not found", "success": False}

        # Generate OTP
        otp = random_string(6, chars="0123456789")

        # Store OTP (you might want to use a more secure method in production)
        frappe.cache().set(
            f"password_reset_otp_{email}", otp, expires_in=300
        )  # 5 minutes expiry

        # Send OTP via email (implement your email sending logic here)
        # frappe.sendmail(...)

        return {"message": "OTP sent successfully", "success": True}

    except Exception as e:
        frappe.log_error(f"OTP sending error: {str(e)}")
        return {"message": "Failed to send OTP", "success": False}
