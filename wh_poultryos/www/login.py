import frappe
from frappe.utils import get_url, cstr
import json
from frappe.utils.password import check_password
from frappe.utils import random_string, get_url
from frappe.utils.oauth import get_oauth2_providers
import uuid
import base64
import secrets

def get_context(context):
    # Adding app title to context
    context.app_title = frappe.get_website_settings("app_name")

@frappe.whitelist(allow_guest=True)
def send_login_link(email):
    """
    Send magic login link to user's email
    """
    try:
        # Check if user exists
        if not frappe.db.exists("User", {"email": email}):
            return {"message": "User not found", "success": False}

        # Generate unique login token
        login_token = str(uuid.uuid4())

        # Store token with expiry
        frappe.cache().set(
            f"login_link_{login_token}", email, expires_in=1800
        )  # 30 minutes

        # Construct login link
        login_url = f"{get_url()}/api/method/wh_poultryos.auth.verify_login_link?token={login_token}"

        # Send email (implementation depends on your email setup)
        frappe.sendmail(
            recipients=email,
            subject="Your PoultryOS Login Link",
            message=f"Click to login: {login_url}",
        )

        return {"message": "Login link sent", "success": True}
    except Exception as e:
        print(str(e))
        frappe.log_error(f"Login link error: {str(e)}")
        return {"message": "Failed to send login link", "success": False}


@frappe.whitelist(allow_guest=True)
def verify_login_link(token):
    """
    Verify magic login link
    """
    try:
        # Retrieve email associated with token
        email = frappe.cache().get(f"login_link_{token}")

        if not email:
            return {"message": "Invalid or expired link", "success": False}

        # Log in the user
        user = frappe.get_doc("User", email)
        frappe.set_user(email)
        frappe.local.login_manager.login_as(email)

        # Clear the token
        frappe.cache().delete(f"login_link_{token}")

        return {"message": "Login successful", "success": True}
    except Exception as e:
        frappe.log_error(f"Login link verification error: {str(e)}")
        return {"message": "Login failed", "success": False}


@frappe.whitelist(allow_guest=True)
def get_social_login_providers():
    """
    Retrieve configured social login providers
    """
    try:
        print(f"Generating auth URL for provider")

        # Get social login providers from Frappe Social Login Key doctype
        providers = frappe.get_all(
            "Social Login Key",
            filters={"enable_social_login": 1},
            fields=["name", "provider_name", "icon", "client_id"],
        )

        # Add auth URLs for each provider
        for provider in providers:
            print(provider)
            provider["auth_url"] = get_social_login_auth_url(provider["name"])

        return {
            "provider_logins": providers,
            "login_with_email_link": frappe.db.get_single_value(
                "System Settings", "login_with_email_link"
            )
            or False,
        }
    except Exception as e:
        frappe.log_error(f"Social login providers retrieval error: {str(e)}")
        return {"provider_logins": [], "login_with_email_link": False}


def get_social_login_auth_url(provider):
    """
    Generate OAuth authorization URL for a social login provider
    """
    try:
        # Log the provider value for debugging
        print(f"Generating auth URL for provider: {provider}")

        social_login_key = frappe.get_doc("Social Login Key", provider)

        print(f"Redirect URL: {social_login_key.redirect_url}")

        scope = (
            social_login_key.scope
            if hasattr(social_login_key, "scope") and social_login_key.scope
            else "openid+profile+email"
        )

        # Generate state token
        token = secrets.token_urlsafe(32)

        # Create state JSON object
        state_data = {
            "token": token,
            "provider": provider,
            "timestamp": frappe.utils.now(),
        }

        # Encode state as base64
        state_json = json.dumps(state_data)
        state = base64.b64encode(state_json.encode("utf-8")).decode("utf-8")
        # frappe.cache().set(f"oauth_state_{state}", True, 'expires_in=300')

        # Construct authorization URL
        base_url = get_url()
        auth_url = (
            f"{social_login_key.authorize_url}?"
            f"client_id={social_login_key.client_id}&"
            f"redirect_uri={base_url}{social_login_key.redirect_url}&"
            f"response_type=code&"
            f"scope={scope}&"
            f"access_type=offline&"
            f"include_granted_scopes=true&"
            f"state={state}"
        )

        print(f"Generating auth URL for provider: {auth_url}")

        return auth_url
    except Exception as e:

        print(f"Generating auth URL for provider: {str(e)}")
        frappe.log_error(
            f"Social login auth URL generation error for {provider}: {str(e)}"
        )
        return ""
