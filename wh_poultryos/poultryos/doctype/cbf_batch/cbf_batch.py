# Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class CBFBatch(Document):
    def before_insert(self):
        """Validate user balance before allowing batch creation"""
        self.user = frappe.session.user
        self.batch_price = self.get_batch_price()
        self.user_balance = self.get_user_balance()

        if self.user_balance < 1:
            frappe.throw(
                f"Insufficient balance. You need atleast 1 token but have {self.user_balance}."
            )

    def after_insert(self):
        """Process balance deduction after successful batch creation"""
        try:
            self.deduct_balance()

        except Exception as e:
            # If balance deduction fails, delete the newly created batch
            frappe.delete_doc(self.doctype, self.name, ignore_permissions=True)
            frappe.throw(f"Failed to process payment: {str(e)}")

    def get_batch_price(self):
        """Get cbf batch cost from settings"""
        batch_cost = frappe.get_value("Batch Settings", None, "cbf_batch_cost")
        if not batch_cost:
            frappe.throw("CBF batch cost not configured in Batch Settings")
        return float(batch_cost)

    def get_user_balance(self):
        """Get current user's balance"""
        user_balance_records = frappe.get_all(
            "User Balance", filters={"user": self.user}, limit_page_length=1
        )

        if user_balance_records:
            # If the user balance exists, get the existing document
            user_balance = frappe.get_doc("User Balance", user_balance_records[0].name)
            print("User Balance Found", user_balance.user)
        # balance = frappe.get_value("User Balance", self.user, "available_balance") or 0
        return float(user_balance.available_balance)

    def deduct_balance(self):
        """Deduct the batch price from user's balance"""
        if not self.user or not self.batch_price:
            frappe.throw("Missing user or batch price information")

        # Recheck balance to prevent race conditions
        current_balance = self.get_user_balance()
        if current_balance < 1:
            frappe.throw("Insufficient balance for the transaction")

        # Try to fetch the existing User Balance document for the user
        user_balance_records = frappe.get_all(
            "User Balance", filters={"user": self.user}, limit_page_length=1
        )

        if user_balance_records:
            # If the user balance exists, get the existing document
            user_balance = frappe.get_doc("User Balance", user_balance_records[0].name)
            print("User Balance Found", user_balance.user)

            # Add the payment amount to the user's total credits and update the available balance
            user_balance.total_debits += 1
            user_balance.available_balance -= 1

            # Create a new transaction for this credit
            user_balance.append(
                "user_balance_transactions",
                {
                    "batch_tokens": 1,
                    "transaction_type": "debit",  # Indicate this is a credit transaction
                },
            )
            user_balance.save()

    def create_balance_history(self):
        """Create a record in balance history"""
        history_doc = frappe.get_doc(
            {
                "doctype": "Balance History",
                "user": self.user,
                "transaction_type": "Debit",
                "amount": self.batch_price,
                "reference_type": self.doctype,
                "reference_name": self.name,
                "balance_before": self.user_balance,
                "balance_after": self.user_balance - self.batch_price,
                "description": f"Deduction for CBF Batch {self.name}",
            }
        )
        history_doc.insert(ignore_permissions=True)
        frappe.db.commit()


@frappe.whitelist()
def update_batch_ready_for_sale(batch_name, ready_for_sale):
    """
    Update the ready_for_sale field in the Batch doctype.
    :param batch_name: Name of the batch to update
    :param ready_for_sale: Boolean (0 or 1) to update the status
    """
    if batch_name:
        frappe.db.set_value("CBF Batch", batch_name, "ready_for_sale", ready_for_sale)
        frappe.db.commit()
        return {"status": "success", "message": f"Batch {batch_name} updated successfully"}
    
    return {"status": "error", "message": "Batch not found"}