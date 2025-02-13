# Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class GrowingCharges(Document):
	pass

import frappe

@frappe.whitelist()
def get_delivered_weights(batch):
    if not batch:
        return {"error": "Batch parameter is required."}

    # Fetch all child records where the batch matches
    delivered_weights = frappe.get_all(
        "Batch Selection",
        filters={"batch": batch},  # Adjust field name if needed
        fields=["rate", "weight"]
    )

    return delivered_weights


import frappe

@frappe.whitelist()
def get_available_batches():
    # Get batches that already exist in Growing Charges
    used_batches = frappe.get_all("Growing Charges", fields=["batch"])
    used_batch_names = [batch["batch"] for batch in used_batches]

    # Fetch batches that are not used in Growing Charges
    available_batches = frappe.get_all(
        "Broiler Batch",
        filters={"name": ["not in", used_batch_names]},
        fields=["name", "batch_name"]
    )

    return available_batches


