// Copyright (c) 2025, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

frappe.ui.form.on("Item Rate", {

    onload: function(frm) {
        if (frm.doc.__islocal) { // Only for new records
            frm.set_value("item_type", ""); // Ensures no default selection
        }
    },
    
	item_type: function(frm) {
        if (frm.doc.item_type) {
            frm.set_query("item_name", function() {
                return {
                    filters: {
                        item_type: frm.doc.item_type  // Filters item_name based on selected item_type
                    }
                };
            });
        }
    }
});
