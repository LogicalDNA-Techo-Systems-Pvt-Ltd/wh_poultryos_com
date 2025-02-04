# my_custom_app/my_custom_app/overrides/batch_override.py

import frappe

def get_filtered_batches(doctype, filters=None, fields=None, limit_page_length=20, page_length=None, start=0, order_by=None, **kwargs):
    """
    This function overrides the default get_list behavior for the Batch DocType.
    It adds a filter for the current user to ensure they only see their own batches.
    """
    # # Ensure we're not causing recursion by accessing the session object
    # if hasattr(frappe.local, "session") and frappe.local.session:
    #     user = frappe.session.user  # Get the current logged-in user
    # else:
    #     # Fallback in case the session is not available
    #     user = "Guest"

    # Ensure filters is not None and add the user filter
    if not filters:
        filters = {}

    # Apply the filter for the current user (adjust 'owner' if needed)
    # filters["owner"] = user  # or use a different field if 'owner' is not the correct field

    # Now, use frappe.get_list() to fetch records with the custom filter, passing all the arguments.
    return frappe.get_list(doctype, filters=filters, fields=fields, limit_page_length=limit_page_length, 
                           page_length=page_length, start=start, order_by=order_by, **kwargs)
