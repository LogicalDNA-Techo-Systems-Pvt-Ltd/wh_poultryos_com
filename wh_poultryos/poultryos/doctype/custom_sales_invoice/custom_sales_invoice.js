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
    }
});


frappe.ui.form.on('Custom Sales Invoice', {

    onload: function (frm) {
        frm.fields_dict["batches"].grid.get_field("batch").get_query = function () {
            return {
                filters: {
                    ready_for_sale: 1
                }
            };
        };
    },

    after_save: function (frm) {
        frappe.call({
            method: 'wh_poultryos.poultryos.doctype.custom_sales_invoice.custom_sales_invoice.update_batch_quantities',
            args: {
                batches: frm.doc.batches
            },
            callback: function (r) {
                if (r.message.status === "success") {
                    frappe.msgprint(__('Batch quantities updated successfully.'));
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
    calculate_total_weight(frm);
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

// Function to calculate the total weight from the child table
function calculate_total_weight(frm) {
    let total_weight = 0;
    
    frm.doc.batches.forEach(row => {
        total_weight += row.weight || 0; // Sum up all row weights
    });

    frm.set_value("total_weight", total_weight);
    frm.refresh_field("total_weight");
}
