// Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

frappe.ui.form.on("Shed", {
    // Trigger on form refresh
    refresh(frm) {
        calculate_total_sq_ft(frm);
    },

    // Trigger when width or length is changed
    width: function (frm) {
        calculate_total_sq_ft(frm);
    },

    length: function (frm) {
        calculate_total_sq_ft(frm);
    }
});

// Function to calculate Total Sq. Ft.
function calculate_total_sq_ft(frm) {
    // Ensure width and length are defined and non-negative
    if (frm.doc.width && frm.doc.length) {
        frm.doc.total_sq_ft = (frm.doc.width * frm.doc.length).toFixed(2); // Fixing to 2 decimal places
        frm.set_value('total_sq_ft', total_sq_ft);
        frm.refresh_field('total_sq_ft'); // Refresh the field to show updated value
    }
}
