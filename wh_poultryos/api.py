# api.py
import frappe
from frappe import _


@frappe.whitelist()
def get_available_balance_of_user():
    """Get the available balance for the current user"""
    try:
        available_balance = 0
        user = frappe.session.user

        user_balance_records = frappe.get_all(
            "User Balance", filters={"user": user}, limit_page_length=1
        )

        if user_balance_records:
            # If the user balance exists, get the existing document
            user_balance = frappe.get_doc("User Balance", user_balance_records[0].name)
            available_balance = user_balance.available_balance or 0

        return available_balance
    except Exception as e:
        frappe.log_error(str(e), "Error fetching user balance")
        return 0


@frappe.whitelist()
def update_batch_stats(batch):
    """Update batch statistics based on all transactions

    Args:
        batch (str): Batch ID

    Returns:
        dict: Updated batch statistics
    """
    try:
        if not batch:
            return {
                "success": False,
                "message": _("Batch ID is required"),
            }

        batch_doc = frappe.get_doc("Broiler Batch", batch)

        # Get all transactions for this batch
        transactions = frappe.get_all(
            "Broiler Daily Transaction",
            filters={"batch": batch},
            fields=[
                "name",
                "transaction_date",
                "total_mortality_qty",
                "total_cull_qty",
                "actual_avg_bird_weight",
                "actual_total_feed_consumption",
                "total_daily_cost",
                "batch_age",
                "feed_cost",
            ],
        )

        print(transactions)
        
        # Calculate cumulative values (safely handle None values)
        total_mortality = sum([t.total_mortality_qty or 0 for t in transactions])
        total_culls = sum([t.total_cull_qty or 0 for t in transactions])
        total_feed = sum([t.actual_total_feed_consumption or 0 for t in transactions])
        # total_cost = sum([t.feed_cost or 0 for t in transactions])
        total_cost = sum([float(t.feed_cost) if t.feed_cost else 0 for t in transactions])

        
        print(total_mortality)
        print(total_feed)
        print(total_cost)       
        
        
        # Get the latest weight
        latest_weight = 0
        if transactions:
            # Sort transactions by date (newest first)
            sorted_transactions = sorted(
                transactions, key=lambda x: x.transaction_date, reverse=True
            )
            latest_transaction = sorted_transactions[0]
            latest_weight = float(latest_transaction.actual_avg_bird_weight or 0)
            opening_date = frappe.utils.getdate(
                batch_doc.opening_date
            )  # Convert to date object
            transaction_date = frappe.utils.getdate(
                latest_transaction.transaction_date
            )  # Convert to date object

            # Calculate the difference in days
            diff_days = int(
                (transaction_date - opening_date).days or 0
            )  # Difference in days

        # Update batch document
        batch_doc.mortality = total_mortality
        batch_doc.culls = total_culls

        # Calculate live quantity
        initial_qty = int(batch_doc.place_quantity_number_of_birds or 0)
        live_qty = int(max(0, initial_qty - total_mortality - total_culls))
        batch_doc.live_quantity_number_of_birds = live_qty
        
       
        print(initial_qty)
        print(live_qty)
        
        
        batch_doc.body_weight = latest_weight
        batch_doc.total_feed = total_feed
        batch_doc.total_feed_cost = total_cost
        batch_doc.batch_age_in_days = diff_days
        batch_doc.live_batch_date = transaction_date

        # Calculate FCR (Feed Conversion Ratio) - safely handle zero values
        batch_doc.current_fcr = 0
        if latest_weight > 0 and live_qty > 0:
            total_live_weight = float(latest_weight) * float(live_qty)
            if total_live_weight > 0:
                batch_doc.current_fcr = float(total_feed) / float(total_live_weight)

        # Calculate EEF (European Efficiency Factor)
        batch_doc.current_eef = 0
        batch_age_in_days = int(batch_doc.batch_age_in_days or 0)
        if initial_qty > 0 and batch_age_in_days > 0 and batch_doc.current_fcr > 0:
            livability = (float(live_qty) / float(initial_qty)) * 100

            if latest_weight > 0:
                batch_doc.current_eef = (
                    (livability * (float(latest_weight) / 1000))
                    / (batch_age_in_days * float(batch_doc.current_fcr))
                    * 100
                )

        # Calculate production cost per kg
        batch_doc.production_cost = 0
        if all(
            [
                total_cost > 0,
                latest_weight > 0,
                live_qty > 0,
            ]
        ):
            total_live_weight_kg = (float(latest_weight) / 1000) * float(live_qty)
            if total_live_weight_kg > 0:
                batch_doc.production_cost = float(total_cost) / float(
                    total_live_weight_kg
                )

       
        # Save the batch document
        batch_doc.save()
        # frappe.db.commit()  # Ensure commit happens
        # print("Batch doc saved successfully!")  
                
        return {
            "success": True,
            "message": _("Batch statistics updated successfully"),
            "data": {
                "fcr": batch_doc.current_fcr,
                "eef": batch_doc.current_eef,
                "production_cost": batch_doc.production_cost,
                "live_quantity": batch_doc.live_quantity_number_of_birds,
            },
        }

    except Exception as e:
        frappe.log_error(str(e), "Error updating batch statistics")
        return {
            "success": False,
            "message": _("Error updating batch statistics: {0}").format(str(e)),
        }


@frappe.whitelist()
def get_standard_values(batch, age,module):
    """
    Fetches standard values for a given batch and age from Standard Chart
    and converts percentage values to quantities based on opening quantity.

    Args:
        batch (str): The batch code/ID
        age (int): The age of the batch in days

    Returns:
        dict: A dictionary containing standard values for mortality, culls,
              average weight, and feed consumption
    """
    # Get the breed and opening quantity from the batch
    
    # Determine which batch doctype to fetch
    batch_doc_type = "Broiler Batch" if module == "CBF" else "Layer Batch"

    # Get the batch document based on the module
    batch_doc = frappe.get_doc(batch_doc_type, batch)
    
    # batch_doc = frappe.get_doc("Broiler Batch", batch)

    if not batch_doc:
        frappe.throw(_("Batch not found"))

    breed = batch_doc.breed_name
    opening_quantity = batch_doc.place_quantity_number_of_birds

    if not breed:
        frappe.throw(_("Breed not found for the selected batch"))

    if not opening_quantity or opening_quantity <= 0:
        frappe.throw(_("Opening quantity must be greater than zero"))

    # Convert age to integer to ensure proper comparison
    age = int(age)
    print("breed is", breed)
    print("age is", age)
    # Query the Standard Chart for the given breed and age
    standard_values = frappe.get_all(
        "Standard Chart",
        filters={"breed": breed, "age_in_days": age},
        fields=[
            "standard_mortality",
            "standard_culls",
            "standard_avg_bird_weight",
            "standard_total_feed_consumption",
        ],
    )
    print("checkinghgggggggggggggggggggggggggggggg")
    print(standard_values)
    
    # Check if standard values exist for the given criteria
    if not standard_values:
        # Try to find the closest age record if exact age match is not found
        closest_age_record = frappe.db.sql(
            """
            SELECT 
                standard_mortality,
                standard_culls,
                standard_avg_bird_weight,
                standard_total_feed_consumption
            FROM 
                `tabStandard Chart`
            WHERE 
                breed = %s 
            ORDER BY 
                ABS(age_in_days - %s) ASC
            LIMIT 1
        """,
            (breed, age),
            as_dict=True,
        )

        if not closest_age_record:
            frappe.throw(
                _("No standard values found for breed {0} at age {1} days").format(
                    breed, age
                )
            )

        standard_values = closest_age_record

    # Get the standard values
    std_mortality_percentage = standard_values[0].get("standard_mortality") or 0
    std_culls_percentage = standard_values[0].get("standard_culls") or 0
    std_avg_weight = standard_values[0].get("standard_avg_bird_weight") or 0
    std_feed_consumption = (
        standard_values[0].get("standard_total_feed_consumption") or 0
    )

    # Convert percentage values to actual quantities based on opening quantity
    std_mortality_quantity = (std_mortality_percentage / 100) * opening_quantity
    std_culls_quantity = (std_culls_percentage / 100) * opening_quantity

    # Return the standard values with both percentages and calculated quantities
    return {
        "mortality": std_mortality_quantity,
        "mortality_percentage": std_mortality_percentage,
        "culls": std_culls_quantity,
        "culls_percentage": std_culls_percentage,
        "avg_weight": std_avg_weight,
        "feed_consumption": std_feed_consumption,
    }
