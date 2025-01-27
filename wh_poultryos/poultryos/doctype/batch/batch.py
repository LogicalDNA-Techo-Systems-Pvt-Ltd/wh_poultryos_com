# Copyright (c) 2024, LogicalDNA Techno Systems Pvt Ltd and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document
import frappe

class Batch(Document):
	pass

def before_insert(doc, method):
    # Fetch the current token count
    settings = frappe.get_single("Demo Batch Settings")  # Assuming Demo Batch Settings DocType exists
    if settings.count <= 0:
        frappe.throw("Demo batch count is 0. Please purchase a token to add a new batch.")
    
    # Deduct one token for batch creation
    settings.count -= 1
    settings.save()

    frappe.msgprint("Batch token used. Please purchase more tokens if required.")

