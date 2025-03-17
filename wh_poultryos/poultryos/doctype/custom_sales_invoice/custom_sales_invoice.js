// Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Custom Sales Invoice", {
// 	refresh(frm) {

// 	},
// });

// frappe.ui.form.on('Batches', {
//     batch: function (frm, cdt, cdn) {
//         let row = locals[cdt][cdn];
//         if (row.batch_id) {
//             frappe.db.get_value("Batch", row.batch_id, "ready_for_sale", (r) => {
//                 if (!r.ready_for_sale) {
//                     frappe.msgprint(__("This batch is not ready for sale."));
//                     frappe.model.set_value(cdt, cdn, "batch", "");
//                 }
//             });
//         }
//     },
//     type: function (frm, cdt, cdn) {
//         let row = locals[cdt][cdn];
//         if (row.batch_id) {
//             frappe.db.get_value("Batch", row.batch, row.type === "Bird" ? "live_quantity_number_of_birds" : "culls", (r) => {
//                 frappe.model.set_value(cdt, cdn, "quantity", r[row.type === "Bird" ? "live_quantity_number_of_birds" : "culls"]);
//             });
//         }
//     },
//     quantity: function (frm, cdt, cdn) {
//         let row = locals[cdt][cdn];
//         row.amount = row.quantity * row.rate;
//         frm.refresh_field("batches");
//     },
//     rate: function (frm, cdt, cdn) {
//         let row = locals[cdt][cdn];
//         row.amount = row.quantity * row.rate;
//         frm.refresh_field("batches");
//     },


// });

frappe.ui.form.on('Batch Selection', {

    batches_add: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        // Set the "type" field to an empty value instead of defaulting to "Bird"
        frappe.model.set_value(cdt, cdn, "type", "");

        frm.refresh_field("batches");
    },

    type: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.batch) {
            frappe.db.get_value("Broiler Batch", row.batch, row.type === "Bird" ? "live_quantity_number_of_birds" : "culls")
                .then((r) => {
                    if (r.message) {
                        let instock = r.message[row.type === "Bird" ? "live_quantity_number_of_birds" : "culls"];
                        frappe.model.set_value(cdt, cdn, "instock", instock);
                    }
                });
        }
    },

    quantity: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        if (row.quantity > row.instock) {
            frappe.msgprint(__('Quantity cannot exceed available quantity'));
            frappe.model.set_value(cdt, cdn, "quantity", row.instock);
            return;
        }
    },

    rate: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        row.amount = row.quantity * row.rate;
        update_amount(frm, cdt, cdn);
        frm.refresh_field("batches");
    },

    weight: function (frm, cdt, cdn) {
        calculate_total_weight(frm);
    },
});

frappe.ui.form.on('Batch Selection Weight', {

    batches_add: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        // Set the "type" field to an empty value instead of defaulting to "Bird"
        frappe.model.set_value(cdt, cdn, "item_type", "");

        frm.refresh_field("batch_weight");


    },

    item_type: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.batch) {
            frappe.db.get_value("Broiler Batch", row.batch, row.item_type === "Bird" ? "live_quantity_number_of_birds" : "culls")
                .then((r) => {
                    if (r.message) {
                        let instock = r.message[row.item_type === "Bird" ? "live_quantity_number_of_birds" : "culls"];
                        frappe.model.set_value(cdt, cdn, "instock", instock);
                    }
                });
        }
    },


    weights: function (frm, cdt, cdn) {
        calculate_total_weight2(frm);
    },

    birdquantity: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        if (row.birdquantity > row.instock) {
            frappe.msgprint(__('Quantity cannot exceed available quantity'));
            frappe.model.set_value(cdt, cdn, "birdquantity", row.instock);
            return;
        }

        update_amount2(frm, cdt, cdn);
    },

    rate: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        update_amount2(frm, cdt, cdn);
        frm.refresh_field("batch_weight");
    },

});


frappe.ui.form.on('Custom Sales Invoice', {

    onload: function (frm) {
        frm.set_query("batch", "batches", function () {
            return {
                filters: {
                    batch_status: "Ready for sale"
                }
            };
        });


        frm.set_query("batch", "batch_weight", function () {
            return {
                filters: {
                    batch_status: "Ready for sale"
                }
            };
        });
    },

    sales_type: function (frm) {

        frm.set_value('total_weight', 0);
        frm.set_value('total_amount', 0);
        frm.refresh_field('total_weight');
        frm.refresh_field('total_amount');
        if (frm.doc.sales_type === "Sales by Bird") {

            frm.set_df_property('batches', 'hidden', 0);  // Show the child table     
            frm.set_df_property('batch_weight', 'hidden', 1);    

        } else {
            frm.set_df_property('batch_weight', 'hidden', 0);  // Hide the child table
            frm.set_df_property('batches', 'hidden', 1);
        }

    },

    before_save: function (frm) {
        console.log("", frm.doc.sales_type);

    },

    after_save: function (frm) {


        frappe.call({
            method: 'wh_poultryos.poultryos.doctype.custom_sales_invoice.custom_sales_invoice.update_batch_quantities',
            args: {
                batches: frm.doc.sales_type === "Sales by Bird" ? frm.doc.batches : frm.doc.batch_weight,
                sales_type: frm.doc.sales_type
            },
            callback: function (r) {
                if (r.message.status === "success") {
                    frappe.msgprint(__('Batch quantities updated successfully.'));

                    frappe.call({
                        method: 'wh_poultryos.poultryos.doctype.custom_sales_invoice.custom_sales_invoice.get_total_weight',
                        args: {
                            batches: frm.doc.sales_type === "Sales by Bird" ? JSON.stringify(frm.doc.batches) : JSON.stringify(frm.doc.batch_weight),
                            sales_type: frm.doc.sales_type
                        },
                        callback: function (res) {

                            if (res.message) {

                                res.message.forEach(batch => {

                                    frappe.call({
                                        method: 'frappe.client.get_value',
                                        args: {
                                            doctype: 'Broiler Batch',
                                            filters: { name: batch.batch_name },
                                            fieldname: ['total_delivered_weight']
                                        },
                                        callback: function (existing) {

                                            let current_weight = existing.message ? existing.message.total_delivered_weight || 0 : 0;
                                            let new_weight = current_weight + batch.total_weight;

                                            frappe.call({
                                                method: 'frappe.client.set_value',
                                                args: {
                                                    doctype: 'Broiler Batch',
                                                    name: batch.batch_name,
                                                    fieldname: {
                                                        total_delivered_weight: new_weight 
                                                    }
                                                },
                                                callback: function () {
                                                    console.log("Updated Total Delivered Weight for:", batch.batch_name);
                                                }
                                            });
                                        }
                                    })


                                });
                            }
                        }
                    })

                } else {
                    frappe.msgprint(__('Error updating batch quantities.'));
                }
            }
        });
    }

});

// Function to calculate individual row amount
function update_amount(frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    row.amount = row.quantity * row.rate;
    frm.refresh_field("batches");
    calculate_total(frm);

}

function update_amount2(frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    row.amount = row.birdquantity * row.rate;
    frm.refresh_field("batches");
    calculate_total2(frm);

}

// Function to calculate the total amount from child table
function calculate_total(frm) {
    let total = 0;
    frm.doc.batches.forEach(row => {
        total += row.amount || 0; // Sum up all row amounts
    });

    frm.set_value("total_amount", total);
    frm.refresh_field("total_amount");
}

function calculate_total2(frm) {
    let total = 0;
    frm.doc.batch_weight.forEach(row => {
        total += row.amount || 0; // Sum up all row amounts
    });

    frm.set_value("total_amount", total);
    frm.refresh_field("total_amount");
}
// Function to calculate the total weight from the child table
function calculate_total_weight(frm) {
    let total_weight = 0;

    frm.doc.batches.forEach(row => {
        total_weight += row.weight || 0; // Sum up all row weights
    });

    frm.set_value("total_weight", total_weight);
    frm.refresh_field("total_weight");
}

// Function to calculate the total weight from the child table
function calculate_total_weight2(frm) {
    let total_weight = 0;

    frm.doc.batch_weight.forEach(row => {
        total_weight += row.weights || 0; // Sum up all row weights
    });

    frm.set_value("total_weight", total_weight);
    frm.refresh_field("total_weight");
}
