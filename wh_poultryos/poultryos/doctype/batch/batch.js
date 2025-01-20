// Copyright (c) 2024, LogicalDNA Techno Systems Pvt Ltd and contributors
// For license information, please see license.txt

frappe.ui.form.on('Batch', {
    module: function (frm) {
        // Check if the 'Module' field is set
        if (frm.doc.module) {
            // Filter the 'Breed' field based on the 'Module' selection
            frm.fields_dict['breed_name'].get_query = function (doc) {
                return {
                    filters: {
                        'module': doc.module  // Filter Breed based on the selected module
                    }
                };
            };
        } else {
            // If no module is selected, remove any filters
            frm.fields_dict['breed_name'].get_query = null;
            frm.set_value('breed_name', '');  // Clear the Breed field
        }
    },



    place_quantity_number_of_birds: function (frm) {
        frm.set_value("live_quantity_number_of_birds", frm.doc.place_quantity_number_of_birds || 0);
    },

    opening_date: function (frm) {

        // Automatically set live_batch_date when placement_date is entered
        if (frm.doc.opening_date) {
            let formatted_date = frappe.datetime.obj_to_user(frm.doc.opening_date);
            frm.set_value('live_batch_date', formatted_date);
        }

        let opening_date = frm.doc.opening_date;
        // let today = frappe.datetime.get_today();
        let today = frm.doc.live_batch_date;
        let days_diff = frappe.datetime.get_diff(today, opening_date);
        frm.set_value("batch_age_in_days", days_diff || 0);
    },

    rate: function (frm)
    {
        frm.set_value('amount', frm.doc.place_quantity_number_of_birds * frm.doc.rate);
        frm.set_value('biological_value', frm.doc.place_quantity_number_of_birds * frm.doc.rate);
        frm.set_value('bird_cost', frm.doc.place_quantity_number_of_birds * frm.doc.rate)
    }

    
  

   
});

