// Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Breeder Eggs Collection", {

// });

frappe.ui.form.on("Breeder Eggs Collection", {
    refresh: function(frm) {
        
    }
});


frappe.ui.form.on("Breeder Type Wise Eggs Collection", {

    quantity: function(frm, cdt, cdn) {
        update_total_eggs_collection(frm);
    },

    type_wise_eggs_collection_remove: function(frm, cdt, cdn) {
        update_total_eggs_collection(frm);
    },

    egg_type: function (frm, cdt, cdn) {
        
        let row = locals[cdt][cdn];
        let egg_type = row.egg_type; // Get selected egg type

        if (!egg_type) return; // Skip validation if no type is selected

        let duplicates = frm.doc.type_wise_eggs_collection.filter(r => r.egg_type === egg_type);

        if (duplicates.length > 1) {
            frappe.msgprint({
                title: __("Error"),
                indicator: "red",
                message: __("Egg type already exists. Please select a different type.")
            });

            // Reset the egg type to prevent duplicates
            frappe.model.set_value(cdt, cdn, "egg_type", "");
        }
    }

   
});

function update_total_eggs_collection(frm) {
    let total = 0;
    
    // Loop through all child table rows and sum up the quantity
    frm.doc.type_wise_eggs_collection.forEach(row => {
        total += row.quantity || 0;  // Avoid NaN issues
    });

    // Set the total to the parent field
    frm.set_value("total_eggs_collection_quantity", total);
}