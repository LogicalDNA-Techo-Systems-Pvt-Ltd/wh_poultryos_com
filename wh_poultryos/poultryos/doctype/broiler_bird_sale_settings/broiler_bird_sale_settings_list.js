// Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt
frappe.listview_settings['Broiler Bird Sale Settings'] = {
    // Initialize state to track if we've already checked settings
    _hasCheckedSettings: false,

    refresh(listview) {
        this.updateCreateButtonVisibility();
    },

    onload(listview) {
        this.updateCreateButtonVisibility();
    },

    updateCreateButtonVisibility: async function () {
        // Avoid redundant checks if already performed in this session
        if (this._hasCheckedSettings) return;

        try {
            const user = frappe.session.user;
            const organizationName = await this.fetchUserOrganization(user);

            if (!organizationName) {
                console.log("No organization found for user:", user);
                return;
            }

            const count = await this.fetchBroilerBirdSaleSettingsCount(organizationName);

            if (count >= 1) {
                this.hideCreateButton();
            }

            // Mark as checked to avoid redundant API calls
            this._hasCheckedSettings = true;
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
                    limit: 1 // Optimize by limiting to one result
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
                    organization: organizationName
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

    hideCreateButton: function () {
        // Use a more reliable approach to find and hide the primary action button
        setTimeout(() => {
            // Try the standard page primary action button first
            const primaryActions = document.querySelectorAll('.page-actions .btn-primary, .page-head .btn-primary, .primary-action');

            primaryActions.forEach(button => {
                // Look for buttons that might be the "New" button
                if (button &&
                    (button.textContent.includes('Add') ||
                        button.classList.contains('primary-action'))) {
                    button.style.display = 'none';
                    console.log("Add button hidden:", button.textContent);
                }
            });

            // Alternative approach using Frappe's standard list view
            if (cur_list && cur_list.page) {
                // Try to find and disable the add button through the cur_list object
                const addButton = cur_list.page.actions.find('.btn-primary[data-label="Add"]');
                if (addButton.length) {
                    addButton.hide();
                    console.log("Add button hidden via cur_list");
                }
            }
        }, 500); // Small delay to ensure DOM is ready
    }
};