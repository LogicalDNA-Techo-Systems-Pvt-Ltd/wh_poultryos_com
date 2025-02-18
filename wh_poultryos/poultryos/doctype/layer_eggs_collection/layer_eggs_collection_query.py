import frappe


def layer_eggs_collection_get_list_query(user):

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
            org_name = ""
            print("No organization found for this user.")

        org_name = org_results[0].name
        print(org_name)

        # Fetch batches for the organization
        batch_results = frappe.get_all("Layer Batch", filters={"org_name": org_name})
        
        if not batch_results:
            print("No batches found for this organization.")
            return ""

        # Extract batch names into a list
        batch_names = [batch["name"] for batch in batch_results]

        # Check if batch_names is empty and handle accordingly
        if not batch_names:
            return "1 = 1"  # A condition that always evaluates to true (since there are no batches)

        # Format the query with the correct batch names
        return "(`tabLayer Eggs Collection`.batch IN ({batch_names}))".format(
            batch_names=",".join([frappe.db.escape(batch) for batch in batch_names])
        )
