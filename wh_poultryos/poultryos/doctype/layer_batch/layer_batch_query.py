import frappe


def layer_batch_get_list_query(user):
    print(user)

    # Fetch the user document
    user_results = frappe.get_doc("User", user)
    print(user_results)

    # Check if the user has the 'Administrator' role
    user_role = user_results.roles
    print(user_role)
    print("Administrator" in [role.role for role in user_role])

    if not "Administrator" in [role.role for role in user_role]:
        # Fetch organization associated with the user
        org_results = frappe.get_all(
            "Organization", filters={"organization_owner": user}, limit_page_length=1
        )

        if not org_results:
            print("No organizations found for this user.")
            return ""  # or handle as needed

        org_name = org_results[0].name
        print(org_name)

        # Return the SQL query string with escaped org_name
        return "(`tabLayer Batch`.org_name = {org_name})".format(
            org_name=frappe.db.escape(org_name)
        )
