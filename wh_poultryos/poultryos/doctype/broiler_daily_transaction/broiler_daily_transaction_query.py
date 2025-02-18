import frappe


def broiler_daily_transaction_get_list_query(user):

    print(user)

    # Fetch the user document
    user_results = frappe.get_doc("User", user)
    print(user_results)

    # Check if the user has the 'Administrator' role
    user_role = user_results.roles
    print(user_role)
    print("Administrator" in [role.role for role in user_role])

    if not "Administrator" in [role.role for role in user_role]:

        # Fetch organization based on user
        org_results = frappe.get_all(
            "Organization", filters={"organization_owner": user}, limit_page_length=1
        )

        if not org_results:
            return "No organization found for this user."

        org_name = org_results[0].name
        print(org_name)

        # Fetch batches for the organization
        batch_results = frappe.get_all("Broiler Batch", filters={"org_name": org_name})
        print(batch_results)

        # Extract batch names into a list
        batch_names = [batch["name"] for batch in batch_results]

        # Check if batch_names is empty
        if not batch_names:
            return "No batches found for this organization."

        # Format the query with the correct batch names
        return "(`tabBroiler Daily Transaction`.batch IN ({batch_names}))".format(
            batch_names=",".join([frappe.db.escape(batch) for batch in batch_names])
        )
