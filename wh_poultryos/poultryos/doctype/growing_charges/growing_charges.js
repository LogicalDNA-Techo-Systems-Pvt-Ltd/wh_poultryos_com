// Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

frappe.ui.form.on("Growing Charges", {


    refresh(frm) {

        frm.add_custom_button("Calculate GC", () => {
            // frappe.show_alert("It works")




            // Show a success message
            frappe.msgprint({
                title: __('Success'),
                message: __('Growing charges calculated'),
                indicator: 'blue'
            });

        })
    },

    batch: function (frm) {

        if (!frm.doc.batch) {
            frappe.msgprint(__('Please select a batch'));
            return;
        }

        // Fetch the placement date from the Batch doctype
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "Batch",
                name: frm.doc.batch
            },
            callback: function (response) {
                if (response.message) {
                    let placement_date = response.message.opening_date;
                    let live_batch_date = response.message.live_batch_date;
                    const live_batch_quantity = parseFloat(response.message.live_quantity_number_of_birds || 0);
                    const rate = response.message.rate;
                    const place_quantity_number_of_birds = response.message.place_quantity_number_of_birds;
                    if (!placement_date) {
                        frappe.msgprint(__('Placement date not found for the selected batch.'));
                        return;
                    }

                    // Calculate 1st-week mortality from Daily Transaction
                    frappe.call({
                        method: "frappe.client.get_list",
                        args: {
                            doctype: "CBF Daily Transaction",
                            filters: [
                                ["batch", "=", frm.doc.batch],
                                ["transaction_date", ">=", placement_date],
                                ["transaction_date", "<=", frappe.datetime.add_days(placement_date, 7)]
                            ],
                            fields: ["mortality_number_of_birds"]
                        },
                        callback: function (res) {
                            if (res.message) {
                                let total_mortality = res.message.reduce((sum, record) => sum + (record.mortality_number_of_birds || 0), 0);

                                const mortality_percent = (total_mortality / live_batch_quantity) * 100;

                                // Bind the total mortality to the fw_mortality field
                                frm.set_value("first_week_mortality", total_mortality);
                                frm.set_value("mortality_percentage", mortality_percent.toFixed(2)); // Limit to 2 decimal places

                                frappe.msgprint(__('First-week mortality calculated successfully.'));
                            } else {
                                frappe.msgprint(__('No mortality records found for the first week.'));
                                frm.set_value("first_week_mortality", 0);
                            }
                        }
                    });


                    frappe.call({
                        method: "frappe.client.get_list",
                        args: {
                            doctype: "CBF Daily Transaction",
                            filters: [
                                ["batch", "=", frm.doc.batch],
                                ["transaction_date", ">=", placement_date],
                                ["transaction_date", "<=", live_batch_date]
                            ],
                            fields: ["feed_consumed_quantity", "feed_cost"]
                        },
                        callback: function (res) {
                            if (res.message) {

                                const total_feed_quantity = res.message.reduce((sum, record) => sum + (parseFloat(record.feed_consumed_quantity) || 0), 0);
                                const total_feed_cost = res.message.reduce((sum, record) => sum + (parseFloat(record.feed_cost) || 0), 0);


                                // Bind the total feed quantity and cost to respective fields
                                frm.set_value("total_feed_consumed", total_feed_quantity);
                                frm.set_value("feed_cost", total_feed_cost);

                                frappe.msgprint(__('Feed quantity and cost calculated successfully.'));
                            } else {
                                frappe.msgprint(__('No feed records found.'));
                                frm.set_value("feed_consumed_quantity", 0);
                                frm.set_value("feed_cost", 0);
                            }
                        }
                    });

                  
                }
            }
        });
    },

    administrative_cost : function(frm)
    {
        if (!frm.doc.batch) {
            frappe.msgprint(__('Please select a batch'));
            return;
        }

        // Fetch the placement date from the Batch doctype
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "Batch",
                name: frm.doc.batch
            },
            callback: function (response) {
                if (response.message) {
                    let placement_date = response.message.opening_date;
                    let live_batch_date = response.message.live_batch_date;
                    const live_batch_quantity = parseFloat(response.message.live_quantity_number_of_birds || 0);
                    const rate = response.message.rate;
                    const place_quantity_number_of_birds = response.message.place_quantity_number_of_birds;
                    if (!placement_date) {
                        frappe.msgprint(__('Placement date not found for the selected batch.'));
                        return;
                    }                   

                    const feed_cost = parseFloat(frm.doc.feed_cost);
                    const medicine_cost = parseFloat(frm.doc.medicine_cost);
                    const vaccine_cost = parseFloat(frm.doc.vaccine_cost);                   
                    const administrative_cost = frm.doc.administrative_cost;
                    // Calculate Production Cost
                    const production_cost = feed_cost + medicine_cost + vaccine_cost + administrative_cost + (rate * place_quantity_number_of_birds);
                    console.log("", production_cost);
                    // Set the calculated production cost in the respective field
                    frm.set_value("production_cost", production_cost.toFixed(2)); // Round to 2 decimal places
                }
            }
        });
    }
});
