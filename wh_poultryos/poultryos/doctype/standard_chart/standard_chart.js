// Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Standard Chart", {
// 	refresh(frm) {

// 	},
// });

frappe.ui.form.on('Standard Chart', {

    cumulative_feed: function (frm) {
        calculateFCR(frm);
    },

    body_weight: function (frm) {
        calculateFCR(frm);
    },

    feed_consumption: function (frm) {
        if (frm.doc.item_name && frm.doc.age_in_days !== undefined) {
            // Fetch the last cumulative feed for the same item
            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Standard Chart',
                    filters: { item_name: frm.doc.item_name },
                    fields: ['cumulative_feed', 'age_in_days'],
                    order_by: 'age_in_days desc',
                    limit_page_length: 1
                },
                callback: function (response) {
                    if (response.message && response.message.length > 0) {
                        // Parse values as numbers and calculate cumulative feed
                        let last_cumulative_feed = parseFloat(response.message[0].cumulative_feed) || 0;
                        let current_feed_consumption = parseFloat(frm.doc.feed_consumption) || 0;
                        let cumulative_feed = last_cumulative_feed + current_feed_consumption;
                        frm.set_value('cumulative_feed', cumulative_feed);
                    } else {
                        // If no previous record, set cumulative feed as current feed consumption
                        let current_feed_consumption = parseFloat(frm.doc.feed_consumption) || 0;
                        frm.set_value('cumulative_feed', current_feed_consumption);
                    }
                }
            });
        } else {
            frappe.msgprint(__('Please enter Item Name and age_in_days to calculate cumulative feed.'));
        }
    }
});

function calculateFCR(frm) {
    if (frm.doc.cumulative_feed && frm.doc.body_weight) {
        let cumulative_feed = parseFloat(frm.doc.cumulative_feed);
        let body_weight = parseFloat(frm.doc.body_weight);

        // Ensure the values are valid
        if (cumulative_feed > 0 && body_weight > 0) {
            let fcr = cumulative_feed / body_weight;

            // Round to 2 decimal places
            fcr = parseFloat(fcr.toFixed(2));

            // Set the calculated FCR value
            frm.set_value('fcr', fcr);
        } else {
            frappe.msgprint(__('Cumulative Feed and Body Weight must be greater than 0'));
            frm.set_value('fcr', null);
        }
    } else {
        // Clear FCR if required fields are missing
        frm.set_value('fcr', null);
    }
}
