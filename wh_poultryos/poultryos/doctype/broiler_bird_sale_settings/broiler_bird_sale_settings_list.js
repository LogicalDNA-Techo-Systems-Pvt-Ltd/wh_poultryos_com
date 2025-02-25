// Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt
frappe.listview_settings['Broiler Bird Sale Settings'] = {
    refresh(frm) {

    },

    onload: function (listview) {
        console.log(listview);
        console.log(listview.total_count);
        // Fetch the total count of records
        frappe.call({
            method: 'frappe.client.get_count',
            args: {
                doctype: 'Broiler Bird Sale Settings'
            },
            callback: function (response) {
                if (response.message >= 1) {
                    // If more than 1 record exists, hide the "New" button
                    listview.can_create = false;
                }
            }
        });
    }
};
