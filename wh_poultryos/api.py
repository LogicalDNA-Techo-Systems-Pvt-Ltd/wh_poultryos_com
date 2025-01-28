
    
@frappe.whitelist(allow_guest=True)
def register_user(email, password, full_name, phone=None, company=None):
    """
    Comprehensive user registration method
    
    Args:
        email (str): User's email address
        password (str): User's password
        full_name (str): User's full name
        phone (str, optional): User's phone number
        company (str, optional): User's company name
    
    Returns:
        dict: Registration status
    """
    try:
        # Validate input
        if not email or not password or not full_name:
            return {"message": "Missing required fields", "success": False}
        
        # Check email format
        if not frappe.utils.validate_email_address(email):
            return {"message": "Invalid email address", "success": False}
        
        # Check if user already exists
        if frappe.db.exists("User", {"email": email}):
            return {"message": "Email already registered", "success": False}
        
        # Password strength validation
        if len(password) < 8:
            return {"message": "Password too short", "success": False}
        
        # Split full name
        name_parts = full_name.split()
        first_name = name_parts[0]
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
        
        # Create user document
        user = frappe.get_doc({
            "doctype": "User",
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "full_name": full_name,
            "phone": phone,
            "enabled": 1,
            "send_welcome_email": 0,
            "document_type": "User",
            "new_password": password
        })
        
        # Add roles
        user.append("roles", {"role": "Customer"})
        
        # Add company if provided
        if company:
            # Check if company exists, if not create
            if not frappe.db.exists("Company", company):
                frappe.get_doc({
                    "doctype": "Company",
                    "company_name": company
                }).insert(ignore_permissions=True)
            
            user.company = company
        
        # Insert user
        user.insert(ignore_permissions=True)
        
        # Set password securely
        user.set_password(password)
        
        # Optional: Create customer profile
        create_customer_profile(email, full_name, phone, company)
        
        return {
            "message": "Registration successful", 
            "success": True,
            "user_id": user.name
        }
    
    except Exception as e:
        frappe.log_error(f"User registration error: {str(e)}")
        return {"message": "Registration failed", "success": False}

def create_customer_profile(email, full_name, phone=None, company=None):
    """
    Create a customer profile after user registration
    
    Args:
        email (str): User's email
        full_name (str): User's full name
        phone (str, optional): User's phone number
        company (str, optional): User's company name
    """
    try:
        # Check if customer already exists
        if frappe.db.exists("Customer", {"email_id": email}):
            return
        
        customer = frappe.get_doc({
            "doctype": "Customer",
            "customer_name": full_name,
            "email_id": email,
            "mobile_no": phone,
            "customer_group": "Individual",
            "territory": "All Territories"
        })
        
        if company:
            customer.company = company
        
        customer.insert(ignore_permissions=True)
    
    except Exception as e:
        frappe.log_error(f"Customer profile creation error: {str(e)}")