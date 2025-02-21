import frappe


def broiler_daily_transaction_get_list_query(user):
    # Fetch the user document
    user_results = frappe.get_doc("User", user)

    # Check if the user has the 'Administrator' role
    user_role = user_results.roles

    if not "Administrator" in [role.role for role in user_role]:

        # Fetch organization based on user
        org_results = frappe.get_all(
            "Organization", filters={"organization_owner": user}, limit_page_length=1
        )

        if not org_results:
            org_name = ""
            print("No organization found for this user.")
        else:
            org_name = org_results[0].name
            print(org_name, "!!!!!!!!!!!!!!")

        # Fetch batches for the organization
        batch_results = frappe.get_all("Broiler Batch", filters={"org_name": org_name})

        if not batch_results:
            batch_names = ""
            print("No batches found for this organization.")
            sql_condition = "(1=0)"
        else:
            # Extract batch names into a list
            batch_names = [batch["name"] for batch in batch_results]
            sql_condition = (
                "(`tabBroiler Daily Transaction`.batch IN ({batch_names}))".format(
                    batch_names=",".join(
                        [frappe.db.escape(batch) for batch in batch_names]
                    )
                )
            )

        # Format the query with the correct batch names
        return sql_condition

    else:
        # For admin users, you can handle the query differently if needed
        print("Admin user detected.")
        # Return a query that doesn't filter by organization (or implement any other logic)
        return "1 = 1"  # This will return all records, or you can modify the query to suit your needs
