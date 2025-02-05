import frappe
import requests
from frappe import _, print_sql

CASHFREE_API_URL = "https://sandbox.cashfree.com/pg/orders"
CLIENT_ID = "69512d9b360314474635820f521596"  # Replace with your Cashfree client ID
CLIENT_SECRET = "669d3edc9f68057d0f72c71dfbb41a9f031639fa"  # Replace with your Cashfree client secret


def create_cashfree_order(amount_needed, batch_count):
    # Prepare the body for the Cashfree API request
    user = frappe.get_last_doc("User", filters={"email": frappe.session.user})
    organization = frappe.get_last_doc(
        "Organization", filters={"organization_owner": frappe.session.user}
    )
    print("frappe.user", user)
    print("frappe.user", organization)
    body = {
        "order_currency": "INR",
        "order_amount": amount_needed,
        "customer_details": {
            "customer_id": organization.name,
            "customer_name": organization.organization_name,
            "customer_email": user.email,
            "customer_phone": user.mobile_no,
        },
        "order_note": "Purchasing " + batch_count + " batch tokens",
    }

    headers = {
        "x-api-version": "2023-08-01",
        "x-client-id": CLIENT_ID,
        "x-client-secret": CLIENT_SECRET,
        "Content-Type": "application/json",
    }

    try:
        # Make the POST request to the Cashfree API
        response = requests.post(CASHFREE_API_URL, json=body, headers=headers)

        # Check for success
        if response.status_code == 200:
            response_data = response.json()
            if "order_id" in response_data:
                return response_data
            else:
                frappe.throw(_("Failed to create order with Cashfree."))
        else:
            frappe.throw(
                _("Failed to create order with Cashfree, API response: {0}").format(
                    response.json()
                )
            )
    except requests.exceptions.RequestException as e:
        frappe.throw(
            _("An error occurred while making the request to Cashfree: {0}").format(
                str(e)
            )
        )


@frappe.whitelist()
def handle_payment_success(order_id):
    # Here you would call Cashfree's API to check the payment status using the order_id
    payment_status = check_cashfree_payment_status(order_id)

    print(payment_status)

    if payment_status.get("order_status") == "PAID":
        # Update the user balance if the payment is successful
        user = payment_status.get("customer_details", {}).get("customer_email")
        amount = payment_status.get("order_amount")

        # Check if the order_id is new by querying the User Balance record
        user_balance_records = frappe.get_all(
            "User Balance",
            filters={"user": user, "order_id": order_id},
            limit_page_length=1,
        )

        if not user_balance_records:
            # Proceed to update the user balance if the order is new
            update_user_balance(user, amount, order_id)
            return {"message": "Payment success, user balance updated"}
        else:
            return {"message": "Order already processed, balance not updated"}

    else:
        return {"message": "Payment failed"}


def update_user_balance(user, amount, order_id):
    # Try to fetch the existing User Balance document for the user
    user_balance_records = frappe.get_all(
        "User Balance", filters={"user": user}, limit_page_length=1
    )

    if user_balance_records:
        # If the user balance exists, get the existing document
        user_balance = frappe.get_doc("User Balance", user_balance_records[0].name)
        print("User Balance Found", user_balance.user)

        # Add the payment amount to the user's total credits and update the available balance
        user_balance.total_credits += amount
        user_balance.available_balance += amount

        # Create a new transaction for this credit
        user_balance.append(
            "user_balance_transactions",
            {
                "order_id": order_id,  # Only store order_id for credit transactions
                "amount": amount,
                "transaction_type": "credit",  # Indicate this is a credit transaction
            },
        )
        user_balance.save()

    else:
        # If no record is found, create a new User Balance record
        print("No User Balance Found. Creating a new one.")

        # Create a new User Balance document
        new_balance = frappe.new_doc("User Balance")
        new_balance.user = user
        new_balance.total_credits = amount  # Set initial credits
        new_balance.available_balance = amount  # Set initial available balance
        new_balance.total_debits = 0  # No debits at this point

        # Create a transaction for this payment
        new_balance.append(
            "user_balance_transactions",
            {
                "order_id": order_id,  # Only store order_id for credit transactions
                "amount": amount,
                "transaction_type": "credit",  # Indicate this is a credit transaction
            },
        )
        new_balance.save()
        print(new_balance)

    # Log the updated user balance
    # print(f"Updated User Balance for {user}: {user_balance.available_balance}")


def check_cashfree_payment_status(order_id):
    url = f"https://sandbox.cashfree.com/pg/orders/{order_id}"  # URL for Cashfree sandbox API
    headers = {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": CLIENT_ID,
        "x-client-secret": CLIENT_SECRET,
    }
    data = {"order_id": order_id}

    response = requests.get(url, headers=headers, json=data)
    result = response.json()
    print(result)
    return result
