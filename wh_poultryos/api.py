import frappe
from frappe import _


@frappe.whitelist()
def get_available_balance_of_user():
    available_balance = 0
    user = frappe.session.user
    print(user)
    user_balance_records = frappe.get_all(
        "User Balance", filters={"user": user}, limit_page_length=1
    )
    if user_balance_records:
        # If the user balance exists, get the existing document
        user_balance = frappe.get_doc("User Balance", user_balance_records[0].name)
        print(user_balance)
        available_balance = user_balance.available_balance

        if user_balance.available_balance is None:
            available_balance = 0  # Set available_balance to 0 if it is None

    print("available_balance", available_balance)
    return available_balance
