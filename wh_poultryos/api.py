import frappe
from frappe.auth import LoginManager
from frappe.utils.password import get_decrypted_password

@frappe.whitelist(allow_guest=True)
def login(email, password):
    login_manager = LoginManager()
    login_manager.authenticate(email, password)
    if login_manager.is_logged_in():
        return {'message': 'success'}
    return {'message': 'failure'}

@frappe.whitelist(allow_guest=True)
def register_custom_user(email, password, first_name):
    if frappe.db.exists('User', email):
        return {'message': 'failure'}

    # Create user
    user = frappe.get_doc({
        'doctype': 'User',
        'email': email,
        'first_name': first_name,
        'enabled': 1
    })
    user.insert()

    # Set password
    user.password = get_decrypted_password(password)
    user.save()

    # Optionally assign a role
    user.add_roles('Customer')
    
    return {'message': 'success'}