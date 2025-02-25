// Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt
frappe.listview_settings['Broiler Bird Sale Settings'] = {
    // Initialize state
    // _hasCheckedSettings: false,

    refresh(listview) {
        this.updateCreateButtonVisibility(listview);
    },

    onload(listview) {
        this.updateCreateButtonVisibility(listview);
    },

    updateCreateButtonVisibility: async function (listview) {
        // Avoid redundant checks if already performed in this session
        // if (this._hasCheckedSettings) return;

        try {
            const user = frappe.session.user;
            const organizationName = await this.fetchUserOrganization(user);

            if (!organizationName) {
                console.log("No organization found for user:", user);
                return;
            }

            const count = await this.fetchBroilerBirdSaleSettingsCount(organizationName);

            if (count >= 1 && listview) {
                // Use Frappe's supported API to control the button
                this.disableCreateButton(listview);
            }

            // Mark as checked to avoid redundant API calls
            // this._hasCheckedSettings = true;
        } catch (error) {
            console.error("Failed to update create button visibility:", error);
            frappe.show_alert({
                message: __("Could not verify settings permissions. Please refresh the page."),
                indicator: 'red'
            });
        }
    },

    fetchUserOrganization: function (user) {
        return new Promise((resolve, reject) => {
            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Organization',
                    filters: { organization_owner: user },
                    fields: ['name'],
                    limit: 1
                },
                callback: function (response) {
                    if (response.message && response.message.length > 0) {
                        resolve(response.message[0].name);
                    } else {
                        resolve(null);
                    }
                },
                error: function (err) {
                    console.error("Error fetching user organization:", err);
                    reject(err);
                }
            });
        });
    },

    fetchBroilerBirdSaleSettingsCount: function (organizationName) {
        return new Promise((resolve, reject) => {
            frappe.call({
                method: 'frappe.client.get_count',
                args: {
                    doctype: 'Broiler Bird Sale Settings',
                    filters: { organization: organizationName }
                },
                callback: function (response) {
                    resolve(response.message || 0);
                },
                error: function (err) {
                    console.error("Error fetching settings count:", err);
                    reject(err);
                }
            });
        });
    },

    disableCreateButton: function (listview) {
        // Use Frappe's supported methods to control the add button visibility

        // Method 1: Set the 'can_create' property to false
        // frappe.model.can_create = false;

        // Method 2: Use listview's internal methods when available
        if (listview && listview.can_create) {
            listview.can_create = false;

            // Refresh the page actions to reflect the change
            if (listview.page) {
                listview.page.clear_primary_action();
            }
        }
    }
};